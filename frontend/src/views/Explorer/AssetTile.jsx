import React, { useState } from "react";
import Tile from "../../components/Tile";
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import { CopyToClipboard } from "../../components/utils";
import openExplorer from "../../utils/openExplorer";
import Modal from "../../components/Modal";
import serverRequest from "../../services/serverRequest";

function AssetTile(props) {
  const [ modalOpen, setModalOpen ] = useState(false);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const handleDeleteEntity = () => {
    const data = {
      path: props.entity.path,
      entity: "assetversion"
    }
    serverRequest("delete_entity", data).then(resp => {
      if (resp.ok) enqueueSnackbar("Successfully deleted!", {variant: "success"});
      else enqueueSnackbar(
        "There was an issue with deleting this.", {variant: "error"}
      );
    });
    setModalOpen(false);
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
      fn: () => openExplorer(props.entity.path, enqueueSnackbar),
      divider: true
    },
    {
      label: "Delete asset version",
      fn: () => setModalOpen(true)
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

  return (
    <>
      <Modal open={modalOpen} buttonLabel="Confirm" onButtonClicked={handleDeleteEntity}
        maxWidth="sm" closeButton text="This will permanently delete this version!"
        onClose={() => setModalOpen(false)} title="Are you sure?"
      />
      <Tile {...props} contextItems={contextItems}>
        {details()}
      </Tile>
    </>
  );
}

export default AssetTile;
