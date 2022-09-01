import styles from "./SystemResources.module.css";
import { Divider, Typography } from "@mui/material";
import React, { useState } from "react";

const ResourceBox = props => {
  const style = {
    right: `${props.value}%`
  };
  return (
    <div className={styles.resourceBoxContainer}>
      <Typography variant="caption" className={styles.type}>{props.label}:</Typography>
      <Typography variant="caption" className={styles.type}>{Math.round(props.value)}%</Typography>
      <div className={styles.resourceBoxBackground} style={style} />
      <div className={styles.resourceBoxBackgroundFilled} />
    </div>
  )
};

export default function SystemResources() {
  const [usageData, setUsageData] = useState({});

  window.services.onResourceUsage((_event, data) => {
    setUsageData(data);
  })

  return (
    <div className={styles.container}>
      <ResourceBox label="CPU" value={usageData.cpu} />
      {/* <Divider orientation="vertical" /> */}
      <ResourceBox label="RAM" value={usageData.mem} />
    </div>
  )
}
