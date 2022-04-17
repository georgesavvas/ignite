import React, { useState, useEffect, useContext } from "react";
import styles from "./ComponentViewer.module.css";
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CopyIcon from "../icons/CopyIcon";
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { Button } from "@mui/material";
import {DccContext} from "../contexts/DccContext";
import {ContextContext} from "../contexts/ContextContext";

const dccNames = {
  houdini: ["hmaster", "hescape", "houdini", "houdinicore", "houdinifx"],
  maya: ["maya"],
  blender: ["blender"],
  nuke: ["nuke"]
}

function ComponentViewer(props) {

  const handleClick = (e) => {
    props.onSelect(e.currentTarget.id);
  }

  function formatComp(comp, index) {
    // const dcc_name = getDccName(dcc.path.split("/").at(-1).split("\\").at(-1).split(".")[0]);
    // const dccIcon = `url(media/dcc/${dcc_name}.png)`;
    // const containerStyle = {
    //   borderColor: dcc.name === selectedDcc ? "rgb(252, 140, 3)" : "rgb(70,70,70)"
    // }

    const containerStyle = {
      borderColor: comp.name === props.selectedComp ? "rgb(252, 140, 3)" : "rgb(70,70,70)"
    }

    return (
      <div className={styles.compContainer} id={comp.name} key={index} onClick={handleClick} style={containerStyle}>
        <div className={styles.compIcon} />
        <Typography variant="subtitle1" className={styles.label}>{comp.filename}</Typography>
        <div className={styles.spacer} />
        <IconButton>
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

export default ComponentViewer;
