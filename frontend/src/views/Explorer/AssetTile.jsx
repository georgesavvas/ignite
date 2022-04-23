import React from "react";
import Tile from "../../components/Tile";
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import { CopyToClipboard } from "../../components/utils";
import clientRequest from "../../services/clientRequest";

function AssetTile(props) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const contextItems = [
    {
      "label": "Copy URI",
      "fn": () =>  CopyToClipboard(props.entity.uri, enqueueSnackbar)
    },
    {
      "label": "Copy path",
      "fn": () =>  CopyToClipboard(props.entity.path, enqueueSnackbar),
      "divider": true
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
    <Tile {...props} contextItems={contextItems}>
      {details()}
    </Tile>
  );
}

export default AssetTile;
