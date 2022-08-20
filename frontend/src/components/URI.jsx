import { Typography } from '@mui/material';
import styles from "./URI.module.css";
import ContextMenu, { handleContextMenu } from "./ContextMenu";
import { CopyToClipboard } from "../views/ContextActions";
import { useSnackbar } from 'notistack';
import React, {useState} from 'react';

function URI(props) {
  const [contextMenu, setContextMenu] = useState(null);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const contextItems = [
    {
      "label": "Copy",
      "fn": () => CopyToClipboard(props.uri, enqueueSnackbar)
    },
    // {
    //   "label": "Go to asset",
    //   "fn": () => CopyToClipboard(props.uri, enqueueSnackbar)
    // }
  ]

  return (
    <>
      <ContextMenu items={contextItems} contextMenu={contextMenu} setContextMenu={setContextMenu} />
      <div className={styles.container} onClick={e => handleContextMenu(e, contextMenu, setContextMenu)}>
        <Typography>{props.uri}</Typography>
      </div>
    </>
  )
}

export default URI;
