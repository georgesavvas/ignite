import { Typography } from '@mui/material';
import styles from "./Path.module.css";
import ContextMenu, { handleContextMenu } from "./ContextMenu";
import { CopyToClipboard } from "../views/ContextActions";
import { useSnackbar } from 'notistack';
import React, {useState} from 'react';

function Path(props) {
  const [contextMenu, setContextMenu] = useState(null);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const contextItems = [
    {
      "label": "Copy",
      "fn": () => CopyToClipboard(props.path, enqueueSnackbar)
    },
    // {
    //   "label": "Go to asset",
    //   "fn": () => CopyToClipboard(props.path, enqueueSnackbar)
    // }
  ]

  return (
    <>
      <ContextMenu items={contextItems} contextMenu={contextMenu} setContextMenu={setContextMenu} />
      <div className={styles.container} onClick={e => handleContextMenu(e, contextMenu, setContextMenu)}>
        <Typography>{props.path}</Typography>
      </div>
    </>
  )
}

export default Path;
