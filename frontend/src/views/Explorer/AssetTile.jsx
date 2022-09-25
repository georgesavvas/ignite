import React, {useContext} from "react";

import Typography from "@mui/material/Typography";
import { useSnackbar } from "notistack";

import URI from "../../components/URI";
import Path from "../../components/Path";
import {CopyToClipboard, ShowInExplorer} from "../ContextActions";
import {setReprForProject, setReprForParent} from "../ContextActions";
import { ContextContext } from "../../contexts/ContextContext";
import Tile from "../../components/Tile";


function AssetTile(props) {
  const {enqueueSnackbar} = useSnackbar();
  const [currentContext] = useContext(ContextContext);

  const hasThumbnail = props.entity.thumbnail && props.entity.thumbnail.filename;
  const thumbnailWidth = hasThumbnail ? "100%" : "50%";
  const currentPath = currentContext.path_nr.replace(currentContext.project + "/", "");
  let contextPath = props.entity.context.replace(currentPath, "");
  if (contextPath.startsWith("/")) contextPath = contextPath.slice(1);

  const dirData = {
    kind: props.entity.dir_kind,
    path: props.entity.path
  };

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
      label: "Set representative for project",
      fn: () => setReprForProject(props.entity.path, enqueueSnackbar)
    },
    {
      label: "Set representative for parent",
      fn: () => setReprForParent(props.entity.path, enqueueSnackbar),
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
  ];

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
        <Typography align="left">{props.entity.name} - {props.entity.version}</Typography>
        <URI uri={props.entity.uri} />
        <Path path={props.entity.creation_time} />
        <Path path={props.entity.modification_time} />
        <Path path={props.entity.size} />
        {/* <Typography align="left">{props.entity.context}</Typography> */}
      </>
    );
  }

  return (
    <>
      <Tile {...props} contextItems={contextItems} thumbnailWidth={thumbnailWidth}
        thumbnail={hasThumbnail ? undefined : "media/no_icon_grey.png"}
        columnWidths={["90px", "300px", "100px", "100%"]}
      >
        {details()}
      </Tile>
    </>
  );
}

export default AssetTile;
