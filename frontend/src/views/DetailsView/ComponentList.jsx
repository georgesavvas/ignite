import React, { useState, useEffect, useContext } from "react";
import styles from "./ComponentList.module.css";
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CopyIcon from "../../icons/CopyIcon";
import { useSnackbar } from 'notistack';
import { CopyToClipboard } from "../../components/utils";
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";
import openExplorer from "../../utils/openExplorer";

const dccNames = {
  houdini: ["hmaster", "hescape", "houdini", "houdinicore", "houdinifx"],
  maya: ["maya"],
  blender: ["blender"],
  nuke: ["nuke"]
}

function Component({comp, index, onSelect, selectedComp}) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [contextMenu, setContextMenu] = useState(null);

  const containerStyle = {
    borderColor: comp.filename === selectedComp.filename ? "rgb(252, 140, 3)" : "rgb(70,70,70)"
  }

  const handleClick = e => {
    onSelect(e.currentTarget.id);
  }

  const handleCopy = (e, path) => {
    if (e) e.stopPropagation();
    CopyToClipboard(path, enqueueSnackbar);
  }

  const contextItems = [
    {
      "label": "Copy path",
      "fn": () => handleCopy(undefined, comp.path),
      "divider": true
    },
    {
      "label": "Open in file explorer",
      "fn": () => openExplorer(comp.path, enqueueSnackbar)
    },
  ]

  return (
    <div key={index} onContextMenu={e => handleContextMenu(e, contextMenu, setContextMenu)}>
      <ContextMenu items={contextItems} contextMenu={contextMenu} setContextMenu={setContextMenu} />
      <div className={styles.compContainer} id={comp.filename} onClick={handleClick} style={containerStyle}>
        <div className={styles.compIcon} />
        <div className={styles.textContainer}>
          <Typography variant="subtitle1" className={styles.label}>{comp.filename}</Typography>
        </div>
        <div className={styles.spacer} />
        <IconButton onClick={e => handleCopy(e, comp.path)}>
          <CopyIcon />
        </IconButton>
      </div>
    </div>
  )
}

function ComponentList(props) {
  return (
    <div className={styles.container}>
      <Typography variant="h5" style={{marginBottom: "10px"}}>Components</Typography>
      <div className={styles.compList}>
        {props.components.map((comp, index) => <Component
            comp={comp} index={index}
            onSelect={props.onSelect} selectedComp={props.selectedComp}
          />
        )}
      </div>
    </div>
  )
}

export default ComponentList;
