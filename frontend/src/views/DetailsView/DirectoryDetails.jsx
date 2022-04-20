import React, { useState, useRef } from "react";
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { TextField } from "@mui/material";
import Modal from "../../components/Modal";

const style = {
  width: "100%",
  height: "100%"
}

function ReprAssetModal(props) {
  const uriField = useRef();
  const handleSave = e => {
    const field = uriField.current;
    const uri = field.value;
    props.onSave(uri);
  }
  return(
    <Modal
      open={props.open}
      onClose={props.onClose}
      title="Set representative asset"
      buttonLabel="OK"
      onButtonClicked={handleSave}
      maxWidth="sm"
    >
      <TextField inputRef={uriField} fullWidth color="ignite" size="small" label="Asset URI" />
    </Modal>
  )
}

function DirectoryDetails(props) {
  const [reprModalOpen, setReptModalOpen] = useState(false);
  const dir_kind = props.entity.dir_kind;
  const dir_kind_formatted = dir_kind.charAt(0).toUpperCase() + dir_kind.slice(1)

  const handleReptChange = uri => {
    setReptModalOpen(false);
  }

  return (
    <div style={style}>
      <ReprAssetModal
        open={reprModalOpen}
        onSave={uri => handleReptChange(uri)}
        onClose={() => setReptModalOpen(false)}
      />
      <div style={{margin: "10px", overflow: "hidden"}}>
        <Typography variant="h5">{dir_kind_formatted} Details</Typography>
        <Typography>Name: {props.entity.name}</Typography>
        <Typography>Path: {props.entity.path}</Typography>
        <Typography>Repr Asset: {props.entity.repr_av}</Typography>
        <Button onClick={() => setReptModalOpen(true)}>Choose asset</Button>
      </div>
    </div>
  )
}

export default DirectoryDetails;
