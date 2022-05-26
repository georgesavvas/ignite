import React, { useContext, useState } from "react";
import Tile from "../../components/Tile";
import Typography from '@mui/material/Typography';
import { ContextContext } from "../../contexts/ContextContext";
import { useSnackbar } from 'notistack';
import { CopyToClipboard, ShowInExplorer } from "../ContextActions";
import { DIRCONTEXTOPTIONS } from "../../constants";

function DirectoryTile(props) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);

  const isScene = props.entity.dir_kind === "scene";
  const thumbnailWidth = isScene || props.entity.thumbnail ? "100%" : "50%";
  const currentPath = currentContext.posix.replace(currentContext.project_path + "/", "");
  const contextPath = props.entity.full_context.replace(currentPath, "");

  const dirData = {
    path: props.entity.path,
    kind: props.entity.dir_kind,
    name: props.entity.name
  }

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
        label: `Rename ${entity.dir_kind}`,
        fn: () => props.onContextMenu("rename", dirData)
      },
      {
        label: `Delete ${entity.dir_kind}`,
        fn: () => props.onContextMenu("delete", dirData),
        divider: true
      }
    ]
  }

  function getSpecificContextItems(entity) {
    if (!DIRCONTEXTOPTIONS.hasOwnProperty(entity.dir_kind)) return [];
    return DIRCONTEXTOPTIONS[entity.dir_kind].map(contextOption => (
      {
        label: contextOption.label,
        value: contextOption.name,
        dir_path: entity.path,
        fn: () => props.onContextMenu(
          "create", {...entity, method: contextOption.name, kind: contextOption.dir_kind}
        )
      }
    ))
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
          {contextPath || props.entity.dir_kind}
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

  let contextItems = getGenericContextItems(props.entity);
  contextItems = contextItems.concat(getSpecificContextItems(props.entity));

  return (
    <>
      <Tile
        {...props}
        thumbnail={props.entity.thumbnail ? undefined : thumbnailPath()}
        thumbnailWidth={thumbnailWidth}
        onClick={handleClick}
        contextItems={contextItems}
      >
        {details()}
      </Tile>
    </>
  );
}

export default DirectoryTile;
