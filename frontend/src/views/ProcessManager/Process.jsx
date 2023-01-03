// Copyright 2022 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React from "react";

import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import PauseIcon from "@mui/icons-material/Pause";
import WatchLaterOutlinedIcon from "@mui/icons-material/WatchLaterOutlined";
import DirectionsRunOutlinedIcon from "@mui/icons-material/DirectionsRunOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ClearIcon from "@mui/icons-material/Clear";
import ReplayIcon from "@mui/icons-material/Replay";
import CheckIcon from "@mui/icons-material/Check";
import ErrorIcon from "@mui/icons-material/Error";

import clientRequest from "../../services/clientRequest";
import styles from "./Process.module.css";


const COLOURS = {
  waiting: "rgb(120, 120, 0)",
  paused: "rgb(70, 70, 70)",
  finished: "rgb(0, 80, 0)",
  error: "rgb(100, 0, 0)",
  running: "rgb(0, 50, 120)"
};

const Process = props => {
  const state = props.process.state || "waiting";

  const handleAction = action => {
    const data = {
      process_id: props.process.id,
      edit: action
    };
    clientRequest("edit_process", data);
  };

  const handleClear = () => {
    const shouldKill = ["running", "paused"].includes(state);
    if (!shouldKill) props.onClear(props.process.id);
    else props.forceKill(props.process.id);
    const data = {
      process_id: props.process.id,
      edit: shouldKill ? "kill" : "clear"
    };
    clientRequest("edit_process", data);
  };

  const getStatusIcon = () => {
    switch (state) {
    case "finished": return <CheckIcon className={styles.statusIcon} style={getIconStyle("finished")} />;
    case "paused": return <PauseIcon className={styles.statusIcon} style={getIconStyle("paused")} />;
    case "waiting": return <WatchLaterOutlinedIcon className={styles.statusIcon} style={getIconStyle("waiting")} />;
    case "error": return <ErrorIcon className={styles.statusIcon} style={getIconStyle("error")} />;
    default: return <DirectionsRunOutlinedIcon className={styles.statusIcon} style={getIconStyle("running")} />;
    }
  };

  const getActionButton = () => {
    switch (state) {
    case "paused": return <PlayArrowIcon className={`${styles.button} ${styles.unpauseButton}`} onClick={() => handleAction("unpause")} />;
    case "running": return <PauseIcon className={`${styles.button} ${styles.pauseButton}`} onClick={() => handleAction("pause")} />;
    case "finished": case "error": return <ReplayIcon className={`${styles.button} ${styles.retryButton}`} onClick={() => handleAction("retry")} />;
      // default: return <LowPriorityIcon className={`${styles.button} ${styles.retryButton}`} onClick={() => handleAction("retry")} />;
    default: return null;
    }
  };

  const getIconStyle = state => {
    const colour = COLOURS[state];
    return {
      color: colour,
      filter: "brightness(150%)"
    };
  };

  const getProgressBarStyle = () => {
    const progress = props.process.progress;
    switch (state) {
    case "waiting": return {
      backgroundColor: "rgb(120, 120, 0)",
      transition: "background-color 1s"
    };
    case "paused": return {
      backgroundColor: "rgb(70, 70, 70)",
      width: `${progress || 100}%`,
      transition: "background-color 1s"
    };
    case "error": return {
      backgroundColor: "rgb(100, 0, 0)",
      transition: "background-color 1s"
    };
    case "finished": return {
      backgroundColor: "rgb(0, 80, 0)",
      transition: "background-color 1s"
    };
    default: return {
      backgroundColor: "rgb(0, 50, 120)",
      width: `${Math.max(1, progress || 100)}%`,
      transition: progress === 0 ? "width 0.1s, background-color 1s" : "width 0.5s, background-color 1s"
    };
    }
  };

  return (
    <div className={styles.container} style={props.style}>
      <div className={styles.topBar}>
        {/* <Typography className={styles.title} align="center">{props.process.name}</Typography> */}
        <div className={`${styles.progressBar} ${styles[state]}`} style={{...getProgressBarStyle(), backgroundColor: COLOURS[state]}} />
      </div>
      <div className={styles.details}>
        {getStatusIcon()}
        <Divider orientation="vertical" flexItem />
        <div className={styles.detailsText}>
          <Typography noWrap>{props.process.name}</Typography>
          <Typography noWrap style={{direction: "rtl", textAlign: "left"}}>{props.process.entity.path}</Typography>
          {/* <Typography noWrap>{props.process.asset.name} - {props.process.asset.context}</Typography>
          <Typography>{props.process.component.name}</Typography> */}
        </div>
        {/* <div className={styles.spacer} /> */}
        {/* <Divider orientation="vertical" flexItem /> */}
        {getActionButton()}
        <ClearIcon className={`${styles.button} ${["finished", "error"].includes(state) ? styles.pauseButton : styles.killButton}`} onClick={handleClear} />
      </div>
    </div>
  );
};

export default Process;