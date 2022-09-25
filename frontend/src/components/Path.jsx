import React, {useState} from "react";

import Typography from "@mui/material/Typography";
import {useSnackbar} from "notistack";

import styles from "./Path.module.css";
import ContextMenu, { handleContextMenu } from "./ContextMenu";
import {CopyToClipboard} from "../views/ContextActions";


function Path(props) {
  const [contextMenu, setContextMenu] = useState(null);
  const {enqueueSnackbar} = useSnackbar();

  const contextItems = [
    {
      "label": "Copy",
      "fn": () => CopyToClipboard(props.path, enqueueSnackbar)
    },
    // {
    //   "label": "Go to asset",
    //   "fn": () => CopyToClipboard(props.path, enqueueSnackbar)
    // }
  ];

  if (!props.path) return null;

  return (
    <>
      <ContextMenu items={contextItems} contextMenu={contextMenu} setContextMenu={setContextMenu} />
      <div className={styles.container} onClick={e => handleContextMenu(e, contextMenu, setContextMenu)}>
        <Typography style={{color: "cadetblue", direction: "rtl", textAlign: "left"}} noWrap>{props.path}</Typography>
      </div>
    </>
  );
}

export default Path;
