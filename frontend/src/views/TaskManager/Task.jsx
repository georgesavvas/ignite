import { CircularProgress } from "@mui/material";
import React from "react";
import styles from "./Task.module.css";
import Typography from '@mui/material/Typography';
import PauseIcon from '@mui/icons-material/Pause';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';

export default function Task(props) {
  return (
    <div className={styles.container}>
      <CircularProgress size={30} thickness={3} variant={props.progress || props.state !== "running" ? "determinate" : "indeterminate"} value={props.progress ? props.progress * 100 : 0} />
      <div className={styles.label}>
        <Typography
          variant="caption"
          component="div"
          color="text.secondary"
        >
          {/* {`${Math.round(props.progress || 0 * 100)}%`} */}
        </Typography>
        {props.state !== "running" ? null :
          <PlayArrowIcon style={{width: "20px", height: "20px"}} />
        }
        {props.state !== "pending" ? null :
          <PendingOutlinedIcon style={{width: "25px", height: "25px"}} />
        }
        {props.state !== "queued" ? null :
          <WatchLaterOutlinedIcon style={{width: "25px", height: "25px"}} />
        }
      </div>
    </div>
  )
}
