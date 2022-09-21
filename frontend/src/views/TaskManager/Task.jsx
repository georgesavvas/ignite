import { CircularProgress, Divider } from "@mui/material";
import React from "react";
import styles from "./Task.module.css";
import Typography from '@mui/material/Typography';
import PauseIcon from '@mui/icons-material/Pause';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import ClearIcon from '@mui/icons-material/Clear';
import LowPriorityIcon from '@mui/icons-material/LowPriority';
import ReplayIcon from '@mui/icons-material/Replay';
import clientRequest from "../../services/clientRequest";
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';

const COLOURS = {
  waiting: "rgb(120, 120, 0)",
  paused: "rgb(70, 70, 70)",
  finished: "rgb(0, 80, 0)",
  error: "rgb(100, 0, 0)",
  running: "rgb(0, 50, 120)"
}

const Task = props => {
  const state = props.task.state || "waiting";

  const handleAction = action => {
    const data = {
      task_id: props.task.id,
      edit: action
    }
    clientRequest("edit_task", data)
  }

  const handleClear = () => {
    if (state !== "running") props.onClear(props.task.id);
    else props.forceKill(props.task.id);
    const data = {
      task_id: props.task.id,
      edit: state === "running" ? "kill" : "clear"
    }
    clientRequest("edit_task", data)
  }

  const getStatusIcon = () => {
    switch (state) {
      case "finished": return <CheckIcon className={styles.statusIcon} style={getIconStyle("finished")} />;
      case "paused": return <PauseIcon className={styles.statusIcon} style={getIconStyle("paused")} />;
      case "waiting": return <WatchLaterOutlinedIcon className={styles.statusIcon} style={getIconStyle("waiting")} />;
      case "error": return <ErrorIcon className={styles.statusIcon} style={getIconStyle("error")} />
      default: return <DirectionsRunOutlinedIcon className={styles.statusIcon} style={getIconStyle("running")} />;
    }
  }

  const getActionButton = () => {
    switch (state) {
      case "paused": return <PlayArrowIcon className={`${styles.button} ${styles.unpauseButton}`} onClick={() => handleAction("unpause")} />;
      case "running": return <PauseIcon className={`${styles.button} ${styles.pauseButton}`} onClick={() => handleAction("pause")} />
      case "finished": case "error": return <ReplayIcon className={`${styles.button} ${styles.retryButton}`} onClick={() => handleAction("retry")} />;
      // default: return <LowPriorityIcon className={`${styles.button} ${styles.retryButton}`} onClick={() => handleAction("retry")} />;
      default: return null;
    }
  }

  const getIconStyle = state => {
    const colour = COLOURS[state];
    return {
      color: colour,
      filter: "brightness(150%)"
    }
  }

  const getProgressBarStyle = () => {
    const progress = props.task.progress;
    switch (state) {
      case "waiting": return {
        backgroundColor: "rgb(120, 120, 0)",
        transition: "background-color 1s"
      };
      case "paused": return {
        backgroundColor: "rgb(70, 70, 70)",
        width: `${progress || 100}%`
      };
      case "error": return {backgroundColor: "rgb(100, 0, 0)"};
      case "finished": return {
        backgroundColor: "rgb(0, 80, 0)",
        transition: "background-color 1s"
      };
      default: return {
        backgroundColor: "rgb(0, 50, 120)",
        width: `${Math.max(1, progress || 100)}%`,
        transition: progress === 0 ? "width 0.1s, background-color 1s" : "width 2s, background-color 1s"
      };
    }
  }

  return (
    <div className={styles.container} style={props.style}>
      <div className={styles.topBar}>
        {/* <Typography className={styles.title} align="center">{props.task.name}</Typography> */}
        <div className={`${styles.progressBar} ${styles[state]}`} style={{...getProgressBarStyle(), backgroundColor: COLOURS[state]}} />
      </div>
      <div className={styles.details}>
        {getStatusIcon()}
        <Divider orientation="vertical" flexItem />
        <div className={styles.detailsText}>
          <Typography noWrap>{props.task.name}</Typography>
          <Typography noWrap>{props.task.entity.path}</Typography>
          {/* <Typography noWrap>{props.task.asset.name} - {props.task.asset.context}</Typography>
          <Typography>{props.task.component.name}</Typography> */}
        </div>
        {/* <div className={styles.spacer} /> */}
        {/* <Divider orientation="vertical" flexItem /> */}
        {getActionButton()}
        <ClearIcon className={`${styles.button} ${state === "finished" ? styles.pauseButton : styles.killButton}`} onClick={handleClear} />
      </div>
    </div>
  )
}

export default Task;