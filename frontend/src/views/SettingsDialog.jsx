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
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import IconButton from '@mui/material/IconButton';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { Stack } from '@mui/material';
import {DccContext} from "../contexts/DccContext";

const Input = styled('input')({
  display: 'none',
});

export default function SettingsDialog(props) {
  const [dccConfig, setDccConfig] = useContext(DccContext);

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
      return setDccConfig(data, "modify");
    }).then(() => console.log("all finished!"));
  }

  const handleRemoveDcc = (e) => {
    const target_id = e.currentTarget.id.split("-")[1];
    const data = {index: target_id};
    setDccConfig(data, "remove");
  }

  const handleFileSelected = (e) => {
    const value = e.target.files[0].path;
    const s = e.currentTarget.id.split("-");
    const target_id = s[1];
    const data = {
      index: target_id,
      field: "path",
      value: value
    }
    setDccConfig(data, "modify");
  }

  function renderDcc(dcc, index) {
    // console.log(dcc);
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
        backgroundColor: "rgb(40,40,40)",
        backgroundImage: "none"
      },
    },
  }

  const dccBar = {
    display: "flex",
    justifyContent: "space-between"
  }

  const handleAddDcc = (e) => {
    setDccConfig({}, "add");
  }

  const handleRevertDefaultsDcc = (e) => {
    setDccConfig({}, "revertToDefaults");
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
