// Copyright 2022 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, { useState, useEffect, useContext } from "react";

import Typography from "@mui/material/Typography";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import {ReflexContainer, ReflexSplitter, ReflexElement} from "react-reflex";
import {useSnackbar} from "notistack";

import ComponentViewer from "./ComponentViewer";
import ComponentList from "./ComponentList";
import TagContainer from "./TagContainer";
import saveReflexLayout from "../../utils/saveReflexLayout";
import loadReflexLayout from "../../utils/loadReflexLayout";
import {ContextContext} from "../../contexts/ContextContext";
import {CopyToClipboard} from "../ContextActions";
import ContextMenu from "../../components/ContextMenu";
import URI from "../../components/URI";
import Path from "../../components/Path";
import serverRequest from "../../services/serverRequest";
import {EntityContext} from "../../contexts/EntityContext";
import BuildFileURL from "../../services/BuildFileURL";
import {ConfigContext} from "../../contexts/ConfigContext";
import styles from "./AssetDetails.module.css";
import { CircularProgress, Tooltip } from "@mui/material";


const splitterStyle = {
  borderColor: "rgb(80,80,80)",
  backgroundColor: "rgb(80,80,80)"
};

const style = {
  width: "100%",
  height: "100%"
};

const defaultFlexRations = {
  "asset.viewer": 0.4,
  "asset.details": 0.25,
  "asset.comps": 0.35
};

const compExtensionPreviewPriority = [
  ".mp4",
  ".mov",
  ".jpg",
  ".jpeg",
  ".png",
  ".tif",
  ".tiff",
  ".exr"
];

function AssetDetails(props) {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations);
  const [config] = useContext(ConfigContext);
  const [selectedCompName, setSelectedCompName] = useState("");
  const [currentContext,, refreshContext] = useContext(ContextContext);
  const [, setSelectedEntity] = useContext(EntityContext);
  const {enqueueSnackbar} = useSnackbar();
  const [contextMenu, setContextMenu] = useState(null);
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
      "asset.comps": comps[1] / fullWidth
    };
    setFlexRatios(ratios);
  }, []);

  useEffect(() => {
    if (!props.entity.components) {
      setSelectedCompName("");
      return;
    }
    compExtensionPreviewPriority.some(ext => {
      const comp = props.entity.components.find(comp => comp.ext === ext);
      if (comp) {
        setSelectedCompName(comp.filename);
        return true;
      }
    });
  }, [props.entity]);

  const handleVersionChange = e => {
    const version = e.target.value;
    const path = BuildFileURL(
      `${props.entity.asset}/${version}`,
      config,
      {reverse: true, pathOnly: true}
    );
    serverRequest("get_assetversion", {path: path}).then(resp => {
      setSelectedEntity(resp.data);
    });
  };

  const handleResized = data => {
    saveReflexLayout(data);
  };

  const getComp = compName => {
    return props.entity.components.find(comp => comp.filename === compName);
  };

  const selectedComp = getComp(selectedCompName);

  const contextItems = [
    {
      label: "Copy tags",
      fn: () =>  CopyToClipboard(props.entity.tags.join(", "), enqueueSnackbar)
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
      protected: true
    };
    serverRequest("set_directory_protected", data).then(resp => {
      const ok = resp.ok;
      if (!ok) enqueueSnackbar(
        "Failed to change permissions...", {variant: "error"}
      );
      refreshContext();
      setProtectLoading(false);
    });
  };

  const handleUnProtect = () => {
    setProtectLoading(true);
    const data = {
      path: props.entity.path,
      protected: false
    };
    serverRequest("set_directory_protected", data).then(resp => {
      const ok = resp.ok;
      if (!ok) enqueueSnackbar(
        "Failed to change permissions...", {variant: "error"}
      );
      refreshContext();
      setProtectLoading(false);
    });
  };

  return (
    <div style={style}>
      <ContextMenu items={contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu}
      />
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
          <div style={{margin: "10px", overflow: "hidden"}}>
            <div
              style={{
                height: "40px",
                margin: "6px 0px",
                display: "flex",
                justifyContent: "space-between"
              }}
            >
              <div style={{display: "flex", gap: "10px", alignItems: "center"}}>
                <Typography variant="h5">{props.entity.name}</Typography>
                {!protectLoading ?
                  props.entity.protected ?
                    <Tooltip title="Un-protect">
                      <img
                        alt="protected"
                        src="media/shield.png"
                        className={styles.button}
                        onClick={handleUnProtect}
                      />
                    </Tooltip> :
                    <Tooltip title="Protect">
                      <img
                        alt="unprotected"
                        src="media/shield_broken.png"
                        className={styles.button}
                        onClick={handleProtect}
                      />
                    </Tooltip> :
                  <CircularProgress color="ignite" />
                }
              </div>
              <FormControl size="small">
                <InputLabel>Version</InputLabel>
                <Select
                  autoWidth
                  value={props.entity.version}
                  label="Version"
                  onChange={handleVersionChange}
                >
                  {props.entity.versions.map(ver =>
                    <MenuItem key={ver} value={ver}>{ver}</MenuItem>
                  )}
                </Select>
              </FormControl>
            </div>
            <URI uri={props.entity.uri} />
            <Path path={props.entity.path} />
          </div>
          <div style={{padding: "5px"}}>
            <TagContainer
              entityPath={props.entity.path}
              tags={props.entity.tags}
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
}

export default AssetDetails;
