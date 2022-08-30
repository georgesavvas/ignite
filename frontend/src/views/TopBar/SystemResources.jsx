import styles from "./SystemResources.module.css";
import { Divider, Typography } from "@mui/material";
import React, { useState } from "react";

const ResourceBox = props => {
  const style = {
    right: `${props.value}%`
  };
  return (
    <div className={styles.resourceBoxContainer}>
      <Typography variant="caption" className={styles.type}>{props.label}</Typography>
      {/* <div className={styles.resourceBoxValue}> */}
        <Typography variant="caption" className={styles.type}>{props.value}%</Typography>
      {/* </div> */}
      <div className={styles.resourceBoxBackground} style={style}></div>
    </div>
  )
};

export default function SystemResources() {
  const [usageData, setUsageData] = useState({});

  window.services.onResourceUsage((_event, data) => {
    setUsageData(data);
    console.log(data);
  })

  return (
    <div className={styles.container}>
      <ResourceBox label="CPU" value={usageData.cpu} />
      <Divider orientation="vertical" />
      <ResourceBox label="GPU" value={usageData.gpu} />
      <Divider orientation="vertical" />
      <ResourceBox label="RAM" value={usageData.mem} />
      <Divider orientation="vertical" />
      <ResourceBox label="VRAM" value={usageData.vram} />
    </div>
  )
}
