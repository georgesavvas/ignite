import { Typography } from '@mui/material';
import styles from "./URI.module.css";
import ContextMenu, { handleContextMenu } from "./ContextMenu";
import React, {useState} from 'react';

function URI(props) {
  const [contextMenu, setContextMenu] = useState(null);

  const contextItems = [
    {
      "label": "Copy",
      "fn": () =>  navigator.clipboard.writeText(props.uri)
    },
    {
      "label": "Go to asset",
      "fn": () =>  navigator.clipboard.writeText(props.uri)
    }
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
