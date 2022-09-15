import React, {useEffect, useState, useContext} from 'react';
// import { ipcRenderer } from 'electron';
import { styled } from '@mui/material/styles';
import styles from "./SettingsDialog.module.css";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import IconButton from '@mui/material/IconButton';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { Stack, Divider } from '@mui/material';
import Modal from "../components/Modal";
import {ConfigContext} from "../contexts/ConfigContext";
import clientRequest from '../services/clientRequest';

const Input = styled('input')({
  display: 'none',
});

export default function SettingsDialog(props) {
  const [serverAddress, setServerAddress] = useState("");
  const [config, setConfig] = useContext(ConfigContext);

  useEffect(() => {
    setServerAddress(config.serverDetails.address)
  }, [config.serverDetails.address])

  const handleDccConfigChange = (e) => {
    const s = e.currentTarget.id.split("-");
    const target_id = s[1];
    const target_field = s[0];
    const data = {
      index: target_id,
      field: target_field,
      value: e.target.value
    }
    window.api.checkPath(data.value).then(exists => {
      data.valid = exists;
      return setConfig("dccConfig", data, "modify");
    })
  }

  const handleRemoveDcc = (e) => {
    const target_id = e.currentTarget.id.split("-")[1];
    const data = {index: target_id};
    setConfig("dccConfig", data, "remove");
  }

  const handleFileInput = e => {
    window.api.fileInput().then(resp => {
      if (resp.cancelled) return;
      onFileSelected(e, resp.filePaths[0]);
    })
  }

  const onFileSelected = (e, filepath) => {
    const s = e.target.id.split("-");
    const target_id = s[1];
    const data = {
      index: target_id,
      field: "path",
      value: filepath
    }
    setConfig("dccConfig", data, "modify");
  }

  function renderDcc(dcc, index) {
    if (dcc.valid === undefined) dcc.valid = false;
    return (
      <ListItem key={index}>
        <IconButton
          color="primary"
          component="span"
          id={"remove-" + index}
          onClick={handleRemoveDcc}
        >
          <RemoveCircleOutlineIcon style={{color: "red", fontSize: "2rem"}} />
        </IconButton>
        <Divider flexItem orientation="vertical" />
        <div className={styles.gridContainer}>
          <div className={styles.gridItemPath}>
            <TextField
              margin="dense"
              id={"path-" + index}
              label="Executable"
              fullWidth
              variant="outlined"
              value={dcc.path}
              size="small"
              color={dcc.valid ? "success" : "warning"}
              onChange={handleDccConfigChange}
              className={styles.textField}
              InputProps={{
                className: styles.input
              }}
            />
            <Button id={"file-" + index} variant="outlined" className={styles.browse} onClick={handleFileInput}>...</Button>
          </div>
          <div className={styles.gridItemName}>
            <TextField
              margin="dense"
              id={"name-" + index}
              label="Name"
              variant="outlined"
              fullWidth
              value={dcc.name}
              size="small"
              onChange={handleDccConfigChange}
              className={styles.textField}
              InputProps={{
                className: styles.input
              }}
            />
          </div>
          <div className={styles.gridItemExts}>
            <TextField
              margin="dense"
              id={"exts-" + index}
              label="Extensions"
              fullWidth
              variant="outlined"
              value={dcc.exts}
              size="small"
              onChange={handleDccConfigChange}
              className={styles.textField}
              InputProps={{
                className: styles.input
              }}
            />
          </div>
        </div>
      </ListItem>
    )
  }

  const dialogStyle = {
    "& .MuiDialog-container": {
      "& .MuiPaper-root": {
        width: "100%",
        maxWidth: "80vw",
        backgroundColor: "rgb(40,40,40)",
        backgroundImage: "none"
      },
    },
  }

  const dccBar = {
    display: "flex",
    justifyContent: "space-between"
  }

  const handleAddDcc = e => {
    setConfig("dccConfig", [], "add");
  }

  const handleDiscoverDcc = e => {
    clientRequest("discover_dcc").then(resp => {
      const new_config = resp.data;
      let existing_paths = [];
      config.dccConfig.forEach(config => {
        existing_paths.push(config.path);
      })
      const filtered = new_config.filter(config => !existing_paths.includes(config.path));
      console.log(`Previously had ${existing_paths.length} configs, discovered ${new_config.length}, adding ${filtered.length}`);
      setConfig("dccConfig", filtered, "add");
    });
  }

  const handleServerAddressChange = e => {
    setServerAddress(e.target.value);
    setConfig("serverDetails", {address: e.target.value});
  }

  return (
    <Modal open={props.open} onClose={props.onClose} title="Settings" maxWidth="lg"
      closeButton>
      <div className={styles.container}>
        <DialogContentText style={{alignSelf: "flex-start"}}>
          Server Details
        </DialogContentText>
        <div className={styles.insideContainer}>
          <TextField
            margin="dense"
            id="server-address"
            label="Address"
            fullWidth
            variant="standard"
            value={serverAddress}
            onChange={handleServerAddressChange}
          />
          <TextField
            margin="dense"
            id="server-password"
            label="Password"
            fullWidth
            variant="standard"
            value={config.serverDetails.password}
            onChange={e => setConfig("serverDetails", {password: e.target.value})}
          />
        </div>
        <Divider flexItem style={{marginTop: "20px", marginBottom: "20px"}} />
        <DialogContentText style={{alignSelf: "flex-start"}}>
          Access
        </DialogContentText>
        <div className={styles.insideContainer}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={config.access.remote}
                  onChange={e => setConfig("access", {remote: e.target.checked})}
                />}
              label="Remote"
              style={{alignSelf: "flex-start"}}
            />
            <TextField
              margin="dense"
              id="projects-dir"
              label="Projects directory"
              fullWidth
              variant="standard"
              disabled={config.access.remote}
              value={config.access.projectsDir}
              onChange={e => setConfig("access", {projectsDir: e.target.value})}
            />
        </div>
        <Divider flexItem style={{marginTop: "20px", marginBottom: "20px"}} />
        <DialogContentText style={{alignSelf: "flex-start"}}>
          DCC config
        </DialogContentText>
        <div className={styles.insideContainer}>
          <Stack direction="row" alignItems="center" spacing={2} style={{alignSelf: "flex-end"}}>
            <Button variant="outlined" onClick={handleAddDcc}>Add</Button>
            <Button variant="outlined" onClick={handleDiscoverDcc}>Discover</Button>
          </Stack>
          <List
            sx={{ width: '100%' }}
          >
            {config.dccConfig.map((dcc, index) => renderDcc(dcc, index))}
          </List>
        </div>
      </div>
    </Modal>
  )
}
