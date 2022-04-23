import React, { useContext, useState } from "react";
import Tile from "../../components/Tile";
import Typography from '@mui/material/Typography';
import {ContextContext} from "../../contexts/ContextContext";
import { useSnackbar } from 'notistack';
import { CopyToClipboard } from "../../components/utils";
import clientRequest from "../../services/clientRequest";

function DirectoryTile(props) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [currentContext, setCurrentContext] = useContext(ContextContext);
  const isScene = props.entity.dir_kind === "scene";
  const thumbnailWidth = isScene || props.entity.thumbnail ? "100%" : "50%";

  const contextItems = [
{
      "label": "Copy path",
      "fn": () =>  CopyToClipboard(props.entity.path, enqueueSnackbar)
    },
    {
      "label": "Open in file explorer",
      "fn": () => handleOpenExplorer(props.entity.path)
    },
  ]

  const handleOpenExplorer = filepath => {
    clientRequest("show_in_explorer", {"filepath": filepath}).then((resp) => {
      if (!resp.ok) enqueueSnackbar("Failed launching scene.", {variant: "error"});
    })
  }

  const handleClick = e => {
    if (e.detail === 2) {
      var path = props.entity.path;
      if (props.entity.hasOwnProperty("task")) {
        path = props.entity.task.path;
      }
      setCurrentContext(path);
    };
  }

  function thumbnailPath() {
    let path = "media/folder_icon.png";
    if (isScene) path = `media/dcc/${props.entity.dcc}.png`;
    return path;
  }

  const name = isScene ? props.entity.dcc : props.entity.name;

  function details() {
    if (props.viewType === "grid") return(
      <>
        <Typography variant="context" style={{position: "absolute", top: "5px", left: "10px"}}>
          {props.entity.full_context}
        </Typography>
        <Typography style={{position: "absolute", bottom: "5px", left: "10px"}}>
          {name}
        </Typography>
        <Typography style={{position: "absolute", bottom: "5px", right: "10px"}}>
          {props.entity.version}
        </Typography>
      </>
    ); else return(
      <>
        <Typography align="left">{props.entity.name}</Typography>
        <Typography align="left">{props.entity.version}</Typography>
        <Typography align="left">{props.entity.full_context}</Typography>
      </>
    )
  }

  return (
    <Tile
      {...props}
      thumbnail={props.entity.thumbnail ? undefined : thumbnailPath()}
      thumbnailWidth={thumbnailWidth}
      onClick={handleClick}
      contextItems={contextItems}
    >
      {details()}
    </Tile>
  );
}

export default DirectoryTile;
