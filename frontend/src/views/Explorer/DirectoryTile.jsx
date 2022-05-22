import React, { useContext, useState } from "react";
import Tile from "../../components/Tile";
import Typography from '@mui/material/Typography';
import { ContextContext } from "../../contexts/ContextContext";
import { useSnackbar } from 'notistack';
import { CopyToClipboard, ShowInExplorer } from "../ContextActions";
import { DeleteDir, RenameDir, CreateDir } from "../ContextActions";
import clientRequest from "../../services/clientRequest";
import Modal from "../../components/Modal";
import serverRequest from "../../services/serverRequest";

function DirectoryTile(props) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);
  const isScene = props.entity.dir_kind === "scene";
  const thumbnailWidth = isScene || props.entity.thumbnail ? "100%" : "50%";

  const contextItems = [
    {
      "label": "Copy path",
      "fn": () =>  CopyToClipboard(props.entity.path, enqueueSnackbar)
    },
    {
      "label": "Open in file explorer",
      "fn": () => ShowInExplorer(props.entity.path, enqueueSnackbar)
    },
    {
      "label": `Rename ${props.entity.dir_kind}`,
      "fn": () => setRenameModalOpen(true)
    },
    {
      "label": `Delete ${props.entity.dir_kind}`,
      "fn": () => setDeleteModalOpen(true)
    }
  ]

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

  const dirData = {
    path: props.entity.path,
    kind: props.entity.dir_kind,
    name: props.entity.name
  }

  return (
    <>
      <CreateDir open={createModalOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setCreateModalOpen(false)} data={dirData}
        fn={props.refreshContext}
      />
      <DeleteDir open={deleteModalOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setDeleteModalOpen(false)} data={dirData}
        fn={props.refreshContext}
      />
      <RenameDir open={renameModalOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setRenameModalOpen(false)} data={dirData}
        fn={props.refreshContext}
      />
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
