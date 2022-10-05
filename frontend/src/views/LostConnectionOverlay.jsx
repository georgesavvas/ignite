import { Typography } from "@mui/material";
import React from "react";
import IgnTextField from "../components/IgnTextField";
import styles from "./LostConnectionOverlay.module.css";


const LostConnectionOverlay = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Typography variant="h4">
          Lost connection to Ignite server...
        </Typography>
        <IgnTextField
          label="Server address"
          style={{minWidth: "300px"}}
        />
      </div>
    </div>
  );
};

export default LostConnectionOverlay;
