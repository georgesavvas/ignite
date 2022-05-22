import React, { useEffect, useState } from 'react';
import Modal from "../components/Modal";
import CreateDirModal from "./CreateDirModal";
import serverRequest from "../services/serverRequest";
import clientRequest from "../services/clientRequest";
import TextField from '@mui/material/TextField';

export function CopyToClipboard(text, enqueueSnackbar) {
  navigator.clipboard.writeText(text);
  enqueueSnackbar("Copied to clipboard!", {variant: "success"});
}

export function ShowInExplorer(filepath, enqueueSnackbar) {
  clientRequest("show_in_explorer", {"filepath": filepath}).then((resp) => {
    if (!resp.ok) enqueueSnackbar("Failed launching scene.", {variant: "error"});
  })
}

export function DeleteDir({data, open=false, onClose, enqueueSnackbar, fn}) {
  const handleDeleteEntity = () => {
    serverRequest("delete_entity", data).then(resp => {
      if (resp.ok) enqueueSnackbar("Successfully deleted!", {variant: "success"});
      else enqueueSnackbar("There was an issue with deleting this.", {variant: "error"}
      );
    });
    if (fn) fn();
    onClose();
  }

  return (
    <Modal open={open} buttonLabel="Confirm" onButtonClicked={handleDeleteEntity}
      maxWidth="sm" closeButton onClose={onClose}
      text={`This will permanently delete this ${data.kind}!`}
      title="Are you sure?"
    />
  )
}

export function RenameDir({data, open=false, onClose, enqueueSnackbar, fn}) {
  const [nameValue, setNameValue] = useState("");

  useEffect(() => {
    setNameValue(data.name);
  }, [data.name])

  function handleRenameDir() {
    serverRequest("rename_entity", {...data, name: nameValue}).then(resp => {
      if (resp.ok) enqueueSnackbar("Renamed!", {variant: "success"});
      else {
        let reason = "";
        if (resp.text) reason = ` - ${resp.text}`;
        enqueueSnackbar(`Couldn't rename ${data.kind}${reason}.`, {variant: "error"});
      }
    });
    if (fn) fn();
    onClose();
  }

  return (
    <Modal open={open} buttonLabel="Confirm" onButtonClicked={handleRenameDir}
      maxWidth="sm" closeButton onClose={onClose} title={`Renaming ${data.kind}`}
    >
      <TextField
        id="name"
        label="Name"
        variant="outlined"
        value={nameValue}
        onChange={e => setNameValue(e.target.value)}
        size="small"
        fullWidth
        autoFocus
        style={{marginTop: "10px"}}
      />
    </Modal>
  )
}

export function CreateDir({data, open=false, onClose, enqueueSnackbar, fn}) {
  const handleOnCreate = data => {
    serverRequest("create_dirs", data).then((resp => {
      enqueueSnackbar(resp.text, {variant: resp.ok ? "success" : "error"});
      if (fn) fn();
    }));
  }

  return (
    <CreateDirModal
      open={open}
      data={data}
      onCreate={data => handleOnCreate(data)}
      onClose={onClose}
    />
  )
}
