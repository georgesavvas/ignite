import { CircularProgress } from "@mui/material";
import React from "react";
import styles from "./Task.module.css";
import Typography from '@mui/material/Typography';
import PauseIcon from '@mui/icons-material/Pause';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import ClearIcon from '@mui/icons-material/Clear';

const Task = props => {

  const getStatusIcon = () => {
    const state = props.state;
    switch (state) {
      case "paused": return <PauseIcon />;
      case "queueing": return <WatchLaterOutlinedIcon />;
      default: return <DirectionsRunOutlinedIcon />;
    }
  }

  const getActionButton = () => {
    const state = props.state;
    switch (state) {
      case "paused": return <PlayArrowIcon />;
      default: return <PauseIcon />;
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <Typography className={styles.title} align="center">{props.task.name}</Typography>
        <div className={styles.progressBar} />
      </div>
      <div className={styles.details}>
        {getStatusIcon()}
        <Typography>{props.task.asset.name}</Typography>
        <Typography>{props.task.component.name}</Typography>
        <div className={styles.spacer} />
        {getActionButton()}
        <ClearIcon />
      </div>
    </div>
  )
}

export default Task;