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


import React from "react";

import Typography from "@mui/material/Typography";
import {useSnackbar} from "notistack";
import AddIcon from "@mui/icons-material/Add";

import {CopyToClipboard, ShowInExplorer, clearRepr} from "../ContextActions";
import styles from "./ProjectTile.module.css";
import Tile from "../../components/Tile";


export function NewProjectTile(props) {
  return (
    <div className={styles.newProjectTile} onClick={props.onClick}>
      <AddIcon className={styles.button} style={{fontSize: "48px"}} />
    </div>
  );
}

function ProjectTile(props) {
  const {enqueueSnackbar} = useSnackbar();

  const hasThumbnail = props.entity.thumbnail && props.entity.thumbnail.filename;
  const thumbnailWidth = hasThumbnail ? "100%" : "50%";

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
      {
        label: "Clear representative",
        fn: () => clearRepr(entity.path, enqueueSnackbar, props.onRefresh),
        divider: true
      },
      {
        label: `Rename ${entity.dir_kind}`,
        fn: () => props.onContextMenu("rename", dirData)
      },
      {
        label: `Delete ${entity.dir_kind}`,
        fn: () => props.onContextMenu("delete", dirData)
      }
    ];
  }

  const handleClick = () => {
    props.onSelected(props.entity);
  };

  function thumbnailPath() {
    let path = "media/folder_icon.png";
    return path;
  }

  function details() {
    if (props.viewType === "grid") return(
      <>
        <Typography style={{position: "absolute", bottom: "5px", left: "10px"}}>
          {props.entity.name}
        </Typography>
      </>
    ); else return(
      <>
        <Typography align="left">{props.entity.name}</Typography>
      </>
    );
  }

  let contextItems = getGenericContextItems(props.entity);

  return (
    <>
      <Tile
        {...props}
        thumbnail={hasThumbnail ? undefined : thumbnailPath()}
        thumbnailWidth={thumbnailWidth}
        onClick={handleClick}
        contextItems={contextItems}
      >
        {details()}
      </Tile>
    </>
  );
}

export default ProjectTile;
