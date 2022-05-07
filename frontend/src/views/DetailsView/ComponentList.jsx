import React, { useState, useEffect, useContext } from "react";
import styles from "./ComponentList.module.css";
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CopyIcon from "../../icons/CopyIcon";
import { useSnackbar } from 'notistack';
import { CopyToClipboard } from "../../components/utils";

const dccNames = {
  houdini: ["hmaster", "hescape", "houdini", "houdinicore", "houdinifx"],
  maya: ["maya"],
  blender: ["blender"],
  nuke: ["nuke"]
}

function ComponentList(props) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const handleClick = e => {
    props.onSelect(e.currentTarget.id);
  }

  const handleCopy = (e, comp) => {
    e.stopPropagation();
    CopyToClipboard(comp.filename, enqueueSnackbar);
  }

  function formatComp(comp, index) {
    const containerStyle = {
      borderColor: comp.filename === props.selectedComp.filename ? "rgb(252, 140, 3)" : "rgb(70,70,70)"
    }

    return (
      <div className={styles.compContainer} id={comp.filename} key={index} onClick={handleClick} style={containerStyle}>
        <div className={styles.compIcon} />
        <div className={styles.textContainer}>
          <Typography variant="subtitle1" className={styles.label}>{comp.filename}</Typography>
        </div>
        <div className={styles.spacer} />
        <IconButton onClick={e => handleCopy(e, comp)}>
          <CopyIcon />
        </IconButton>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Typography variant="h5" style={{marginBottom: "10px"}}>Components</Typography>
      <div className={styles.compList}>
        {props.components.map((comp, index) => formatComp(comp, index))}
      </div>
    </div>
  )
}

export default ComponentList;
