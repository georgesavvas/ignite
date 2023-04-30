// Copyright 2023 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { CircularProgress, Tooltip } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { AssetVersion } from "@renderer/types/common";
import { useSnackbar } from "notistack";
import { useContext, useEffect, useState } from "react";
import { HandlerProps, ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";

import ContextMenu, { ContextMenuType } from "../../components/ContextMenu";
import Path from "../../components/Path";
import URI from "../../components/URI";
import { ConfigContext, ConfigContextType } from "../../contexts/ConfigContext";
import { ContextContext, ContextContextType } from "../../contexts/ContextContext";
import { EntityContext, EntityContextType } from "../../contexts/EntityContext";
import BuildFileURL from "../../services/BuildFileURL";
import serverRequest from "../../services/serverRequest";
import loadReflexLayout from "../../utils/loadReflexLayout";
import saveReflexLayout from "../../utils/saveReflexLayout";
import { CopyToClipboard } from "../ContextActions";
import styles from "./AssetDetails.module.css";
import ComponentList from "./ComponentList";
import ComponentViewer from "./ComponentViewer";
import TagContainer from "./TagContainer";

const splitterStyle = {
  borderColor: "rgb(80,80,80)",
  backgroundColor: "rgb(80,80,80)",
};

const style = {
  width: "100%",
  height: "100%",
};

const defaultFlexRations = {
  "asset.viewer": 0.4,
  "asset.details": 0.25,
  "asset.comps": 0.35,
};

const compExtensionPreviewPriority = [
  ".mp4",
  ".mov",
  ".jpg",
  ".jpeg",
  ".png",
  ".tif",
  ".tiff",
  ".exr",
];

interface AssetDetailsProps {
  entity: IgniteAssetVersion;
}

const AssetDetails = (props: IgniteAssetDetailsProps) => {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations);
  const { config } = useContext(ConfigContext) as ConfigContextType;
  const [selectedCompName, setSelectedCompName] = useState("");
  const { currentContext, refresh } = useContext(ContextContext) as ContextContextType;
  const { setSelectedEntity } = useContext(EntityContext) as EntityContextType;
  const { enqueueSnackbar } = useSnackbar();
  const [contextMenu, setContextMenu] = useState<ContextMenuType | null>(null);
  const [protectLoading, setProtectLoading] = useState(false);

  useEffect(() => {
    const data = loadReflexLayout();
    if (!data) {
      setFlexRatios(defaultFlexRations);
      return;
    }
    const viewer = data["asset.viewer"];
    const details = data["asset.details"];
    const comps = data["asset.comps"];
    if (!viewer || !details || !comps) {
      setFlexRatios(defaultFlexRations);
      return;
    }
    const fullWidth = viewer[1] + details[1] + comps[1];
    const ratios = {
      "asset.viewer": viewer[1] / fullWidth,
      "asset.details": details[1] / fullWidth,
      "asset.comps": comps[1] / fullWidth,
    };
    setFlexRatios(ratios);
  }, []);

  useEffect(() => {
    if (!props.entity.components) {
      setSelectedCompName("");
      return;
    }
    compExtensionPreviewPriority.some((ext: string) => {
      const comp = props.entity.components.find((comp) => comp.ext === ext);
      if (comp) {
        setSelectedCompName(comp.filename);
        return true;
      }
      return;
    });
  }, [props.entity]);

  const handleVersionChange = (e: SelectChangeEvent) => {
    const version = e.target.value;
    const path = BuildFileURL(`${props.entity.asset}/${version}`, config, {
      reverse: true,
      pathOnly: true,
    });
    serverRequest("get_assetversion", { path: path }).then((resp) => {
      setSelectedEntity(resp.data);
    });
  };

  const handleResized = (data: HandlerProps) => {
    saveReflexLayout(data);
  };

  const getComp = (compName: string) => {
    return props.entity.components.find((comp) => comp.filename === compName);
  };

  const selectedComp = getComp(selectedCompName);

  const contextItems = [
    {
      label: "Copy tags",
      fn: () => CopyToClipboard(props.entity.tags.join(", "), enqueueSnackbar),
    },
    // {
    //   label: "Add tags",
    //   fn: () => ShowInExplorer(props.entity.path, enqueueSnackbar)
    // }
  ];

  const handleProtect = () => {
    setProtectLoading(true);
    const data = {
      path: props.entity.path,
      protected: true,
    };
    serverRequest("set_directory_protected", data).then((resp) => {
      const ok = resp.ok;
      if (!ok) enqueueSnackbar("Failed to change permissions...", { variant: "error" });
      refresh();
      setProtectLoading(false);
    });
  };

  const handleUnProtect = () => {
    setProtectLoading(true);
    const data = {
      path: props.entity.path,
      protected: false,
    };
    serverRequest("set_directory_protected", data).then((resp) => {
      const ok = resp.ok;
      if (!ok) enqueueSnackbar("Failed to change permissions...", { variant: "error" });
      refresh();
      setProtectLoading(false);
    });
  };

  return (
    <div style={style}>
      <ContextMenu items={contextItems} contextMenu={contextMenu} setContextMenu={setContextMenu} />
      <ReflexContainer orientation="horizontal">
        <ReflexElement
          flex={flexRatios["asset.viewer"]}
          name={"asset.viewer"}
          onStopResize={handleResized}
        >
          <ComponentViewer comp={selectedComp} />
        </ReflexElement>
        <ReflexSplitter style={splitterStyle} />
        <ReflexElement
          flex={flexRatios["asset.details"]}
          name={"asset.details"}
          onStopResize={handleResized}
        >
          <div style={{ margin: "10px", overflow: "hidden" }}>
            <div
              style={{
                height: "40px",
                margin: "6px 0px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <Typography variant="h5">{props.entity.name}</Typography>
                {!protectLoading ? (
                  props.entity.protected ? (
                    <Tooltip title="Un-protect">
                      <img
                        alt="protected"
                        src="src/assets/shield.png"
                        className={styles.button}
                        onClick={handleUnProtect}
                      />
                    </Tooltip>
                  ) : (
                    <Tooltip title="Protect">
                      <img
                        alt="unprotected"
                        src="src/assets/shield_broken.png"
                        className={styles.button}
                        onClick={handleProtect}
                      />
                    </Tooltip>
                  )
                ) : (
                  <CircularProgress color="ignite" />
                )}
              </div>
              <FormControl size="small">
                <InputLabel>Version</InputLabel>
                <Select
                  autoWidth
                  value={props.entity.version}
                  label="Version"
                  onChange={handleVersionChange}
                >
                  {props.entity.versions.map((ver) => (
                    <MenuItem key={ver} value={ver}>
                      {ver}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <URI uri={props.entity.uri} />
            <Path path={props.entity.path} />
          </div>
          <div style={{ padding: "5px" }}>
            <TagContainer
              entityPath={props.entity.path}
              tags={props.entity.tags}
              onRefresh={refresh}
            />
          </div>
        </ReflexElement>
        <ReflexSplitter style={splitterStyle} />
        <ReflexElement
          flex={flexRatios["asset.comps"]}
          name={"asset.comps"}
          onStopResize={handleResized}
        >
          <ComponentList
            project={currentContext.project}
            components={props.entity.components}
            selectedComp={selectedComp}
            onSelect={setSelectedCompName}
            asset={props.entity}
          />
        </ReflexElement>
      </ReflexContainer>
    </div>
  );
};

export default AssetDetails;
