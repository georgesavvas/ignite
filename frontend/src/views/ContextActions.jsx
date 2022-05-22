import React from 'react';
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

export function DeleteDir({data, open, onClose, enqueueSnackbar, fn}) {
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

export function RenameDir({data, open, onClose, enqueueSnackbar, fn}) {
  function handleRenameDir() {
    serverRequest("rename_entity", data).then(resp => {
      if (resp.ok) enqueueSnackbar("Successfully deleted!", {variant: "success"});
      else enqueueSnackbar(`Couldn't rename ${data.kind}.`, {variant: "error"});
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
        defaultValue={data.name}
        size="small"
        fullWidth
        autoFocus
        style={{marginTop: "10px"}}
      />
    </Modal>
  )
}

export function CreateDir({data, open, onClose, enqueueSnackbar, fn}) {
  const handleOnCreate = () => {
    serverRequest("create_dirs", data).then((resp => {
      enqueueSnackbar(resp.text, {variant: resp.ok ? "success" : "error"});
      if (fn) fn();
    }));
  }

  return (
    <CreateDirModal
      open={open}
      data={data}
      onCreate={(v, data) => handleOnCreate(v, data)}
      onClose={onClose}
    />
  )
}
