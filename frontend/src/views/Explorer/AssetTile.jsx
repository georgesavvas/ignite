import React, { useState, useContext } from "react";
import Tile from "../../components/Tile";
import Typography from '@mui/material/Typography';
import { ContextContext } from "../../contexts/ContextContext";
import { useSnackbar } from 'notistack';
import { CopyToClipboard, ShowInExplorer } from "../ContextActions";

function AssetTile(props) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);

  const hasThumbnail = props.entity.thumbnail && props.entity.thumbnail.filename;
  const thumbnailWidth = hasThumbnail ? "100%" : "50%";
  let currentPath = currentContext.posix.replace(currentContext.project_path, "");
  if (currentPath.startsWith("/")) currentPath = currentPath.slice(1);
  let contextPath = props.entity.full_context.replace(currentPath, "");
  if (contextPath.startsWith("/")) contextPath = contextPath.slice(1);
  const dirData = {
    kind: props.entity.dir_kind,
    path: props.entity.path
  }

  const contextItems = [
    {
      label: "Copy URI",
      fn: () =>  CopyToClipboard(props.entity.uri, enqueueSnackbar)
    },
    {
      label: "Copy path",
      fn: () =>  CopyToClipboard(props.entity.path, enqueueSnackbar),
      divider: true
    },
    {
      label: "Open in file explorer",
      fn: () => ShowInExplorer(props.entity.path, enqueueSnackbar),
      divider: true
    },
    {
      label: "Delete asset version",
      fn: () => props.onContextMenu("delete", dirData)
    }
  ]

  function details() {
    if (props.viewType === "grid") return(
      <>
        <Typography style={{position: "absolute", top: "5px", left: "10px"}}>
          {contextPath || "asset"}
        </Typography>
        <Typography style={{position: "absolute", bottom: "5px", left: "10px"}}>
          {props.entity.name}
        </Typography>
        <Typography style={{position: "absolute", bottom: "5px", right: "10px"}}>
          {props.entity.version}
        </Typography>
      </>
    ); else return(
      <>
        <Typography align="left">{props.entity.name}</Typography>
        <Typography align="left">{props.entity.version}</Typography>
        <Typography align="left">{props.entity.context}</Typography>
      </>
    )
  }

  return (
    <>
      <Tile {...props} contextItems={contextItems} thumbnailWidth={thumbnailWidth}
        thumbnail={hasThumbnail ? undefined : "media/no_icon_grey.png"}
      >
        {details()}
      </Tile>
    </>
  );
}

export default AssetTile;
