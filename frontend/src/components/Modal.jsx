import React from 'react';
import styles from "./Modal.module.css";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import ClearIcon from '@mui/icons-material/Clear';

function Modal(props) {

  const dialogStyle = {
    "& .MuiDialog-container": {
      "& .MuiPaper-root": {
        backgroundColor: "rgb(20,20,20)",
        backgroundImage: "none",
        height: props.fullHeight ? "100%" : "none"
      },
    },
  }

  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth={props.fullWidth !== undefined ? props.fullWidth : true}
      maxWidth={props.maxWidth || "sx"} sx={dialogStyle}
    >
      <ClearIcon onClick={props.onClose} className={styles.closeButtonStyle} />
      {props.title ? <DialogTitle>{props.title}</DialogTitle> : null}
      <DialogContent {...props.dialogContentProps}>
        {props.text ? <DialogContentText>{props.text}</DialogContentText> : null}
        {props.children}
      </DialogContent>
      <DialogActions>
        {props.buttons || null}
      </DialogActions>
    </Dialog>
  );
}

export default Modal;
