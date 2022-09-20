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
import LowPriorityIcon from '@mui/icons-material/LowPriority';
import ReplayIcon from '@mui/icons-material/Replay';
import clientRequest from "../../services/clientRequest";

const Task = props => {
  const state = props.task.state;

  const handleAction = action => {
    const data = {
      task_id: props.task.id,
      edit: action
    }
    clientRequest("edit_task", data)
  }

  const handleClear = () => {
    props.onClear(props.task.id)
  }

  const getStatusIcon = () => {
    switch (state) {
      case "paused": return <PauseIcon />;
      case "waiting": return <WatchLaterOutlinedIcon />;
      default: return <DirectionsRunOutlinedIcon />;
    }
  }

  const getActionButton = () => {
    switch (state) {
      case "paused": return <PlayArrowIcon className={styles.button} onClick={() => handleAction("unpause")} />;
      // case "waiting": return <PauseIcon className={styles.button} onClick={() => handleAction("pause")} />
      case "finished": case "error": return <ReplayIcon className={styles.button} onClick={() => handleAction("retry")} />;
      default: return <LowPriorityIcon className={styles.button} onClick={() => handleAction("retry")} />;
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
        width: `${progress}%`
      };
      case "error": return {backgroundColor: "rgb(100, 0, 0)"};
      case "finished": return {
        backgroundColor: "rgb(0, 50, 120)",
        transition: "background-color 1s"
      };
      default: return {
        backgroundColor: "rgb(0, 80, 0)",
        width: `${Math.max(1, progress)}%`,
        transition: progress === 0 ? "width 0.1s, background-color 1s" : "width 2s, background-color 1s"
      };
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        {/* <Typography className={styles.title} align="center">{props.task.name}</Typography> */}
        <div className={`${styles.progressBar} ${styles[state]}`} style={getProgressBarStyle()} />
      </div>
      <div className={styles.details}>
        {/* {getStatusIcon()} */}
        <div className={styles.detailsText}>
          <Typography noWrap>{props.task.name}</Typography>
          <Typography noWrap>{props.task.entity.path}</Typography>
          {/* <Typography noWrap>{props.task.asset.name} - {props.task.asset.context}</Typography>
          <Typography>{props.task.component.name}</Typography> */}
        </div>
        {/* <div className={styles.spacer} /> */}
        {getActionButton()}
        <ClearIcon className={styles.button} onClick={handleClear} />
      </div>
    </div>
  )
}

export default Task;