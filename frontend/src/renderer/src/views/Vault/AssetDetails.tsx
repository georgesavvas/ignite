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
import { ConfigContext, ConfigContextType } from "../../contexts/ConfigContext";
import { VaultContext, VaultContextType } from "../../contexts/VaultContext";
import BuildFileURL from "../../services/BuildFileURL";
import serverRequest from "../../services/serverRequest";
import loadReflexLayout from "../../utils/loadReflexLayout";
import saveReflexLayout from "../../utils/saveReflexLayout";
import { CopyToClipboard } from "../ContextActions";
import ComponentList from "../DetailsView/ComponentList";
import ComponentViewer from "../DetailsView/ComponentViewer";
import TagContainer from "../DetailsView/TagContainer";

const splitterStyle = {
  borderColor: "rgb(80,80,80)",
  backgroundColor: "rgb(80,80,80)",
};

const versionSelectStyle = {
  minWidth: "150px",
  position: "absolute",
  right: "10px",
  top: "15px",
} as React.CSSProperties;

const style = {
  width: "100%",
  height: "100%",
};

const defaultFlexRations = {
  "vault.details.viewer": 0.4,
  "vault.details.details": 0.25,
  "vault.details.comps": 0.35,
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
  setSelectedEntity: (entity: IgniteAssetVersion) => void;
}

const AssetDetails = (props: IgniteAssetDetailsProps) => {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations);
  const { config } = useContext(ConfigContext) as ConfigContextType;
  const [selectedCompName, setSelectedCompName] = useState("");
  const { enqueueSnackbar } = useSnackbar();
  const [contextMenu, setContextMenu] = useState<ContextMenuType | null>(null);
  const { refreshVault } = useContext(VaultContext) as VaultContextType;

  useEffect(() => {
    const data = loadReflexLayout();
    if (!data) {
      setFlexRatios(defaultFlexRations);
      return;
    }
    const viewer = data["vault.details.viewer"];
    const details = data["vault.details.details"];
    const comps = data["vault.details.comps"];
    if (!viewer || !details || !comps) {
      setFlexRatios(defaultFlexRations);
      return;
    }
    const fullWidth = viewer[1] + details[1] + comps[1];
    const ratios = {
      "vault.details.viewer": viewer[1] / fullWidth,
      "vault.details.details": details[1] / fullWidth,
      "vault.details.comps": comps[1] / fullWidth,
    };
    setFlexRatios(ratios);
  }, []);

  useEffect(() => {
    const comps = props.entity?.components;
    if (!comps) {
      setSelectedCompName("");
      return;
    }
    const found = compExtensionPreviewPriority.some((ext) => {
      const comp = comps.find((comp) => comp.ext === ext);
      if (comp) {
        setSelectedCompName(comp.filename);
        return true;
      }
      return false;
    });
    if (!found) setSelectedCompName(comps[0].filename);
  }, [props.entity]);

  const handleVersionChange = (e: SelectChangeEvent<string>) => {
    const version = e.target.value;
    const path = BuildFileURL(`${props.entity.asset}/${version}`, config, {
      reverse: true,
      pathOnly: true,
    });
    serverRequest("get_assetversion", { path: path }).then((resp) => {
      props.setSelectedEntity(resp.data);
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

  return (
    <div style={style}>
      <ContextMenu items={contextItems} contextMenu={contextMenu} setContextMenu={setContextMenu} />
      <ReflexContainer orientation="horizontal">
        <ReflexElement
          flex={flexRatios["vault.details.viewer"]}
          name={"vault.details.viewer"}
          onStopResize={handleResized}
        >
          <ComponentViewer comp={selectedComp} />
        </ReflexElement>
        <ReflexSplitter style={splitterStyle} />
        <ReflexElement
          flex={flexRatios["vault.details.details"]}
          name={"vault.details.details"}
          onStopResize={handleResized}
        >
          <div style={{ margin: "10px", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", minHeight: "50px" }}>
              <FormControl size="small" style={versionSelectStyle}>
                <InputLabel>Version</InputLabel>
                <Select value={props.entity.version} label="Version" onChange={handleVersionChange}>
                  {props.entity.versions.map((ver) => (
                    <MenuItem key={ver} value={ver}>
                      {ver}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="h5">{props.entity.name}</Typography>
            </div>
            <Path path={props.entity.path} />
          </div>
          <TagContainer
            entityPath={props.entity.path}
            tags={props.entity.tags || []}
            onRefresh={refreshVault}
          />
        </ReflexElement>
        <ReflexSplitter style={splitterStyle} />
        <ReflexElement
          flex={flexRatios["vault.details.comps"]}
          name={"vault.details.comps"}
          onStopResize={handleResized}
        >
          <ComponentList
            project={"__vault__"}
            components={props.entity.components || []}
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
