import React, { useState, useRef } from "react";
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TagContainer from "./TagContainer";
import { TextField } from "@mui/material";
import Modal from "../../components/Modal";
import serverRequest from "../../services/serverRequest";
import Attributes from "./Attributes";

const style = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column"
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
    const data = {
      target: props.entity.path,
      repr: uri
    }
    serverRequest("set_repr_asset", data)
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
        <Typography>Repr Asset: {props.entity.repr}</Typography>
        <Button onClick={() => setReptModalOpen(true)}>Choose asset</Button>
      </div>
      <TagContainer entityPath={props.entity.path} tags={props.entity.tags} />
      <Attributes entityPath={props.entity.path} attributes={props.entity.attributes} />
    </div>
  )
}

export default DirectoryDetails;
