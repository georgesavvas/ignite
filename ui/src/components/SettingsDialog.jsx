import React, {useEffect, useState} from 'react';
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
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import IconButton from '@mui/material/IconButton';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { Divider, Stack, Typography } from '@mui/material';

const Input = styled('input')({
  display: 'none',
});

export default function SettingsDialog(props) {
  const defaultDccConfig = [
    {
      name: "Houdini 19",
      path: "C:\\Program Files\\Side Effects Software\\Houdini 19.0.506\\bin\\hmaster.exe",
      exts: ["hip, hipnc"]
    },
    {
      name: "Maya",
      path: "C:\\Program Files\\Autodesk\\Maya2023\\bin\\maya.exe",
      exts: ["ma"]
    }
  ]
  const [dccConfig, setDccConfig] = useState(defaultDccConfig)

  useEffect(() => {
    const data = localStorage.getItem("dcc_config");
    if (data !== null) {
      const storedDccConfig = JSON.parse(data);
      setDccConfig(storedDccConfig);
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("dcc_config", JSON.stringify(dccConfig));
  }, [dccConfig])

  function editDccConfig(config, index, property, value) {
    let cc = [...config];
    cc[index][property] = value;
    return cc;
  }

  function removeFromDccConfig(config, index) {
    let cc = [...config];
    cc.splice(index, 1);
    return cc;
  }

  const handleDccConfigChange = (e) => {
    const s = e.currentTarget.id.split("-");
    const target_id = s[1];
    const target_field = s[0];
    setDccConfig(prevState => editDccConfig(prevState, target_id, target_field, e.target.value));
  }

  const handleRemoveDcc = (e) => {
    const target_id = e.currentTarget.id.split("-")[1];
    setDccConfig(prevState => removeFromDccConfig(prevState, target_id));
  }

  const handleFileSelected = (e) => {
    const value = e.target.files[0].path;
    const s = e.currentTarget.id.split("-");
    const target_id = s[1];
    setDccConfig(prevState => editDccConfig(prevState, target_id, "path", value));
  }

  function renderDcc(dcc, index) {
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
              onChange={handleDccConfigChange}
              className={styles.textField}
              InputProps={{
                className: styles.input
              }}
            />
            <label htmlFor={"file-" + index} className={styles.label}>
              <Input onChange={handleFileSelected} id={"file-" + index} type="file" />
              <Button variant="outlined" className={styles.browse} component="span">...</Button>
            </label>
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
      },
    },
  }

  const dccBar = {
    display: "flex",
    justifyContent: "space-between"
  }

  const handleAddDcc = (e) => {
    setDccConfig(prevState => [...prevState, {name: "", path: ""}]);
  }

  const handleRevertDefaultsDcc = (e) => {
    setDccConfig(defaultDccConfig);
  }

  return (
    <Dialog open={props.open} onClose={props.onClose} sx={dialogStyle}>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent style={{height: "350px", margin: "20px", padding: "20px", border: "solid darkgrey 1px", borderRadius: "10px"}}>
        <DialogContentText>Server Details</DialogContentText>
        <TextField
          margin="dense"
          id="server-address"
          label="Address"
          fullWidth
          variant="standard"
          value="localhost"
          disabled
        />
        <TextField
          margin="dense"
          id="server-password"
          label="Password"
          fullWidth
          variant="standard"
          disabled
        />
      </DialogContent>
      <DialogContent style={{margin: "20px", padding: "20px", border: "solid darkgrey 1px", borderRadius: "10px"}}>
        <div style={dccBar}>
          <DialogContentText>DCC config</DialogContentText>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button variant="outlined" onClick={handleAddDcc}>Add</Button>
            <Button variant="outlined" onClick={handleRevertDefaultsDcc}>Revert to defaults</Button>
          </Stack>
        </div>
        <List
          sx={{ width: '100%' }}
        >
          {dccConfig.map((dcc, index) => renderDcc(dcc, index))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Close</Button>
      </DialogActions>
  </Dialog>
  )
}
