import React, {useContext} from "react";

import {CircularProgress, Typography} from "@mui/material";

import IgnTextField from "../components/IgnTextField";
import styles from "./LostConnectionOverlay.module.css";
import {ConfigContext} from "../contexts/ConfigContext";


const LostConnectionOverlay = () => {
  const [config, setConfig] = useContext(ConfigContext);

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
        <IgnTextField
          label="Server password"
          style={{minWidth: "300px"}}
        />
        <CircularProgress color="ignite" />
      </div>
    </div>
  );
};

export default LostConnectionOverlay;
