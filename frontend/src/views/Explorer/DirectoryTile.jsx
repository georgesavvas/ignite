import React, { useContext, useState } from "react";
import Tile from "../../components/Tile";
import Typography from '@mui/material/Typography';
import {ContextContext} from "../../contexts/ContextContext";


function DirectoryTile(props) {
  const [currentContext, setCurrentContext] = useContext(ContextContext);
  const isScene = props.entity.dir_kind === "scene";
  const thumbnailWidth = isScene || props.entity.thumbnail ? "100%" : "50%";

  const handleClick = e => {
    if (e.detail === 2) {
      var path = props.entity.path;
      if (props.entity.hasOwnProperty("task")) {
        path = props.entity.task.path;
      }
      setCurrentContext({
        path: path,
        name: props.entity.name,
        kind: props.entity.dir_kind
      });
    };
  }

  function thumbnailPath() {
    var path = "media/folder_icon.png";
    if (isScene) path = `media/dcc/${props.entity.dcc}.png`;
    return path;
  }

  const name = isScene ? props.entity.dcc : props.entity.name;

  function details() {
    if (props.viewType === "grid") return(
      <>
        <Typography variant="context" style={{"position": "absolute", "top": "5px", "left": "10px"}}>
          {props.entity.full_context}
        </Typography>
        <Typography style={{"position": "absolute", "bottom": "5px", "left": "10px"}}>
          {name}
        </Typography>
        <Typography style={{"position": "absolute", "bottom": "5px", "right": "10px"}}>
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
    >
      {details()}
    </Tile>
  );
}

export default DirectoryTile;
