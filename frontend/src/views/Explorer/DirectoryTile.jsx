// Copyright 2022 George Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, {useContext} from "react";

import Typography from "@mui/material/Typography";
import { useSnackbar } from "notistack";

import {CopyToClipboard, ShowInExplorer, clearRepr} from "../ContextActions";
import {setReprForProject, setReprForParent} from "../ContextActions";
import {DIRECTORYICONS, DIRCONTEXTOPTIONS} from "../../constants";
import Tile from "../../components/Tile";
import {ContextContext} from "../../contexts/ContextContext";

function DirectoryTile(props) {
  const {enqueueSnackbar} = useSnackbar();
  const [currentContext, setCurrentContext] = useContext(ContextContext);

  const hasThumbnail = props.entity.thumbnail && props.entity.thumbnail.filename;
  const isScene = props.entity.dir_kind === "scene";
  const thumbnailWidth = isScene || hasThumbnail ? "100%" : "30%";
  const currentPath = currentContext.path_nr.replace(currentContext.project + "/", "");
  let contextPath = props.entity.context.replace(currentPath, "");
  if (contextPath.startsWith("/")) contextPath = contextPath.slice(1);

  const dirData = {
    path: props.entity.path,
    kind: props.entity.dir_kind,
    name: props.entity.name
  };

  function getGenericContextItems(entity) {
    return [
      {
        label: "Copy path",
        fn: () =>  CopyToClipboard(entity.path, enqueueSnackbar)
      },
      {
        label: "Open in file explorer",
        fn: () => ShowInExplorer(entity.path, enqueueSnackbar),
        divider: true
      },
      // {
      //   label: "Import asset from Vault",
      //   fn: () =>  props.onContextMenu("vaultExport", dirData),
      //   divider: true
      // },
      {
        label: "Clear thumbnail asset",
        fn: () => clearRepr(entity.path, enqueueSnackbar)
      },
      {
        label: "Use thumbnail for project",
        fn: () => setReprForProject(entity.path, enqueueSnackbar)
      },
      {
        label: "Use representative for parent",
        fn: () => setReprForParent(entity.path, enqueueSnackbar),
        divider: true
      },
      {
        label: `Rename ${entity.dir_kind}`,
        fn: () => props.onContextMenu("rename", dirData)
      },
      {
        label: `Delete ${entity.dir_kind}`,
        fn: () => props.onContextMenu("delete", dirData),
        divider: true
      }
    ];
  }

  function getSpecificContextItems(entity) {
    if (!DIRCONTEXTOPTIONS[entity.dir_kind]) return [];
    const kindOptions = DIRCONTEXTOPTIONS[entity.dir_kind];
    const namedOptions = kindOptions[entity.name] || kindOptions.default;
    return namedOptions.map(contextOption => ({
      label: contextOption.label,
      value: contextOption.name,
      dir_path: entity.path,
      fn: () => props.onContextMenu(
        "create", {...entity, method: contextOption.name, kind: contextOption.dir_kind}
      )
    }));
  }

  const handleClick = e => {
    if (e.detail === 2) {
      var path = props.entity.path;
      if (props.entity.task) {
        path = props.entity.task.path;
      }
      setCurrentContext(path);
    }
  };

  function thumbnailPath() {
    let path = "media/folder_icon.png";
    if (isScene) path = `media/dcc/${props.entity.dcc}.png`;
    return path;
  }

  const name = isScene ? props.entity.dcc : props.entity.name;

  function details() {
    return (
      <>
        <Typography style={{position: "absolute", top: "5px", left: "10px"}}>
          {contextPath || props.entity.dir_kind}
        </Typography>
        <Typography style={{position: "absolute", bottom: "5px", left: "10px"}}>
          {name}
        </Typography>
        <Typography style={{position: "absolute", bottom: "5px", right: "10px"}}>
          {props.entity.version}
        </Typography>
      </>
    );
  }

  let contextItems = getGenericContextItems(props.entity);
  contextItems = contextItems.concat(getSpecificContextItems(props.entity));

  let icon = undefined;
  if (!props.entity.thumbnail) {
    icon = props.entity.icon && props.entity.icon in DIRECTORYICONS ?
      DIRECTORYICONS[props.entity.icon] : undefined;
  }

  return (
    <>
      <Tile
        {...props}
        thumbnail={hasThumbnail ? undefined : thumbnailPath()}
        thumbnailComp={icon}
        thumbnailWidth={thumbnailWidth}
        onClick={handleClick}
        contextItems={contextItems}
        columnWidths={isScene ? ["100px", "100px", "100px", "200px"] : ["100px", "100px", "100px", "200px"]}
      >
        {details()}
      </Tile>
    </>
  );
}

export default DirectoryTile;
