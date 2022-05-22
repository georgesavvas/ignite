import React, { useState } from "react";
import Tile from "../../components/Tile";
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import { CopyToClipboard, ShowInExplorer } from "../ContextActions";
import { DeleteDir, RenameDir, CreateDir } from "../ContextActions";
import Modal from "../../components/Modal";
import serverRequest from "../../services/serverRequest";

function AssetTile(props) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

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
      fn: () => setDeleteModalOpen(true)
    }
  ]

  function details() {
    if (props.viewType === "grid") return(
      <>
        <Typography style={{position: "absolute", top: "5px", left: "10px"}}>
          {props.entity.context}
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

  const dirData = {
    kind: props.entity.dir_kind,
    path: props.entity.path
  }

  return (
    <>
      <DeleteDir open={deleteModalOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setDeleteModalOpen(false)} data={dirData}
        fn={props.refreshContext}
      />
      <Tile {...props} contextItems={contextItems}>
        {details()}
      </Tile>
    </>
  );
}

export default AssetTile;
