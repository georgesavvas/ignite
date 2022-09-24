import React, {useEffect, useState, useContext} from 'react';
import styles from "./General.module.css";
import {ConfigContext} from "../../contexts/ConfigContext";
import TextField from '@mui/material/TextField';
import DialogContentText from '@mui/material/DialogContentText';
import FormControlLabel from '@mui/material/FormControlLabel';
import { Stack, Divider, Typography } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import FileInput from '../../components/FileInput';

const General = () => {
  const [serverAddress, setServerAddress] = useState("");
  const [config, setConfig] = useContext(ConfigContext);

  useEffect(() => {
    setServerAddress(config.serverDetails.address)
  }, [config.serverDetails.address])

  return (
    <div className={styles.container}>
      <div className={styles.serverDetails}>
        <Typography variant="h5" style={{marginBottom: "10px"}}>
          Server Details
        </Typography>
        <TextField
          margin="dense"
          id="server-address"
          size="small"
          label="Address"
          value={serverAddress}
          onChange={e => setConfig("serverDetails", {address: e.target.value})}
        />
        <TextField
          margin="dense"
          id="server-password"
          label="Password"
          type="password"
          size="small"
          value={config.serverDetails.password}
          onChange={e => setConfig("serverDetails", {password: e.target.value})}
        />
        <FileInput
          margin="dense"
          id="projects-dir"
          label="Server projects directory"
          size="small"
          fullWidth
          value={config.access.serverProjectsDir}
          onChange={value => setConfig("access", {serverProjectsDir: value})}
          style={{alignSelf: "stretch"}}
        />
      </div>
      <Divider flexItem className={styles.divider} />
      <div className={styles.access}>
        <Typography variant="h5" style={{marginBottom: "10px"}}>
          Access
        </Typography>
        <FileInput
          margin="dense"
          id="projects-dir"
          label="Projects directory"
          size="small"
          fullWidth
          disabled={config.access.remote}
          value={config.access.projectsDir}
          onChange={value => setConfig("access", {projectsDir: value})}
        />
      </div>
    </div>
  )
}

export default General
