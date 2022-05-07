import React from 'react'
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

const dialogStyle = {
  "& .MuiDialog-container": {
    "& .MuiPaper-root": {
      // width: "100%",
      // maxWidth: "80vw",
      backgroundColor: "rgb(20,20,20)",
      backgroundImage: "none"
    },
  },
}

function Modal(props) {
  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth={props.fullWidth !== undefined ? props.fullWidth : true} maxWidth={props.maxWidth || "sx"} sx={dialogStyle}>
      {props.title ? <DialogTitle>{props.title}</DialogTitle> : null}
      <DialogContent>
        {props.text ? <DialogContentText>{props.text}</DialogContentText> : null}
        {props.children}
      </DialogContent>
      <DialogActions>
        {
          props.buttonLabel ?
          <Button onClick={props.onButtonClicked}>{props.buttonLabel}</Button> :
          null
        }
        {props.closeButton ? <Button onClick={props.onClose}>Close</Button> : null}
      </DialogActions>
    </Dialog>
  );
}

export default Modal;
