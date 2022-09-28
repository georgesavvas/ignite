import React, {useState} from "react";

import Typography from "@mui/material/Typography";
import {useSnackbar} from "notistack";

import styles from "./URI.module.css";
import ContextMenu, { handleContextMenu } from "./ContextMenu";
import {CopyToClipboard} from "../views/ContextActions";


function URI(props) {
  const [contextMenu, setContextMenu] = useState(null);
  const {enqueueSnackbar} = useSnackbar();

  const contextItems = [
    {
      "label": "Copy",
      "fn": () => CopyToClipboard(props.uri, enqueueSnackbar)
    },
    // {
    //   "label": "Go to asset",
    //   "fn": () => CopyToClipboard(props.uri, enqueueSnackbar)
    // }
  ];

  if (!props.uri) return null;

  return (
    <>
      <ContextMenu items={contextItems} contextMenu={contextMenu} setContextMenu={setContextMenu} />
      <div className={styles.container} onClick={e => handleContextMenu(e, contextMenu, setContextMenu)} style={props.style}>
        <Typography style={{color: "rgb(252, 140, 3)", direction: "rtl", textAlign: "left"}} noWrap>{props.uri}</Typography>
      </div>
    </>
  );
}

export default URI;
