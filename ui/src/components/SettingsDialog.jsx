import React, {useState} from 'react';
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
import { Divider, Typography } from '@mui/material';

export default function SettingsDialog(props) {
  const dccList = [
    {
      name: "houdini1",
      path: "C:\\Program Files\\Side Effects Software\\Houdini 19.0.506\\bin\\hmaster.exe"
    },
    {
      name: "houdini2",
      path: "C:\\Program Files\\Side Effects Software\\Houdini 19.0.506\\bin\\hmaster.exe"
    },
    {
      name: "houdini3",
      path: "C:\\Program Files\\Side Effects Software\\Houdini 19.0.506\\bin\\hmaster.exe"
    },
    {
      name: "houdini4",
      path: "C:\\Program Files\\Side Effects Software\\Houdini 19.0.506\\bin\\hmaster.exe"
    },
    {
      name: "houdini4",
      path: "C:\\Program Files\\Side Effects Software\\Houdini 19.0.506\\bin\\hmaster.exe"
    },
    {
      name: "houdini4",
      path: "C:\\Program Files\\Side Effects Software\\Houdini 19.0.506\\bin\\hmaster.exe"
    },
  ]
  const [dccConfig, setDccConfig] = useState(dccList)

  function editDccConfig(config, index, property, value) {
    let cc = [...config];
    cc[index][property] = value;
    return cc;
  }

  const handleDccConfigChange = (e) => {
    const s = e.target.id.split("-");
    const target_id = s[1];
    const target_field = s[0];
    // console.log(target_id, target_field, e.target.value);
    setDccConfig(prevState => editDccConfig(prevState, target_id, target_field, e.target.value));
  }

  function renderDcc(dcc, index) {
    return (
      <ListItem>
        <TextField
          margin="dense"
          id={"name-" + index}
          // label="Name"
          variant="outlined"
          value={dccConfig[index].name}
          onChange={handleDccConfigChange}
        />
        <TextField
          margin="dense"
          id={"path-" + index}
          // label="Executable"
          fullWidth
          variant="outlined"
          value={dccConfig[index].path}
          onChange={handleDccConfigChange}
        />
        <IconButton color="primary" aria-label="upload picture" component="span">
          <RemoveCircleOutlineIcon style={{color: "red", fontSize: "2rem"}} />
        </IconButton>
      </ListItem>
    )
  }

  const dialogStyle = {
    "& .MuiDialog-container": {
      "& .MuiPaper-root": {
        width: "100%",
        maxWidth: "80vw",  // Set your width here
      },
    },
  }

  return (
    <Dialog open={props.open} onClose={props.onClose} sx={dialogStyle}>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent style={{margin: "20px", padding: "20px", border: "solid darkgrey 1px", borderRadius: "10px"}}>
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
        <DialogContentText>DCC config</DialogContentText>
        <List
          sx={{ width: '100%' }}
        >
          {dccList.map((dcc, index) => renderDcc(dcc, index))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Close</Button>
      </DialogActions>
  </Dialog>
  )
}