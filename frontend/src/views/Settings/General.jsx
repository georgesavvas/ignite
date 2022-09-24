import React, {useEffect, useState, useContext} from 'react';
import styles from "./General.module.css";
import {ConfigContext} from "../../contexts/ConfigContext";
import TextField from '@mui/material/TextField';
import DialogContentText from '@mui/material/DialogContentText';
import FormControlLabel from '@mui/material/FormControlLabel';
import { Stack, Divider, Typography } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import FileInput from '../../components/FileInput';
import IgnButton from '../../components/IgnButton';

const General = () => {
  const [serverAddress, setServerAddress] = useState("");
  const [config, setConfig] = useContext(ConfigContext);
  const [settings, setSettings] = useState({serverDetails: {}, access: {}});
  const [canSave, setCanSave] = useState(false);

  useEffect(() => {
    setSettings({
      serverDetails: {
        address: config.serverDetails.address,
        password: config.serverDetails.password
      },
      access: {
        projectsDir: config.access.projectsDir,
        serverProjectsDir: config.access.serverProjectsDir
      }
    })
  }, [config.serverDetails, config.access])

  const handleServerDetailsChange = (field, value) => {
    setSettings(prevState => ({
      ...prevState,
      serverDetails: {...prevState.serverDetails[field], value}
    }));
  }

  const handleAccessChange = (field, value) => {
    setSettings(prevState => ({
      ...prevState,
      access: {...prevState.access[field], value}
    }))
    checkSave()
  }

  const handleSave = () => {
    setConfig("serverDetails", {...settings.serverDetails})
    setConfig("access", {...settings.access})
    setCanSave(false)
  }

  const checkSave = () => {
    let changed = false;
    if (config.serverDetails !== settings.serverDetails) changed = true;
    if (config.access !== settings.access) changed = true;
    setCanSave(changed)
  }

  const isServerLocal = settings.serverDetails.address && settings.serverDetails.address.startsWith("localhost");

  return (
    <div className={styles.container}>
      <div className={styles.serverDetails}>
        <Typography variant="h5" style={{marginBottom: "10px"}}>
          Server Details
        </Typography>
        <div className={styles.row}>
          <TextField
            margin="dense"
            id="server-address"
            size="small"
            label="Address"
            value={settings.serverDetails.address}
            onChange={e => handleServerDetailsChange("address", e.target.value)}
          />
          <TextField
            margin="dense"
            id="server-password"
            label="Password"
            type="password"
            size="small"
            value={settings.serverDetails.password}
            onChange={e => handleServerDetailsChange("password", e.target.value)}
          />
        </div>
      </div>
      <Divider flexItem style={{margin: "20px 0px"}} />
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
          disabled={settings.access.remote}
          value={settings.access.projectsDir}
          onChange={e => handleAccessChange("projectsDir", e.target.value)}
          buttonStyle={{marginTop: "4px"}}
        />
        <FileInput
          margin="dense"
          id="projects-dir"
          label="Server projects directory"
          size="small"
          fullWidth
          disabled={isServerLocal}
          value={settings.access.serverProjectsDir}
          onChange={e => handleAccessChange("serverProjectsDir", e.target.value)}
          style={{alignSelf: "stretch"}}
          buttonStyle={{marginTop: "4px"}}
        />
      </div>
      <div className={styles.centered} style={{marginTop: "20px"}}>
        <IgnButton disabled={!canSave} color="ignite"
          onClick={() => handleSave()}
        >
          Save
        </IgnButton>
      </div>
    </div>
  )
}

export default General
