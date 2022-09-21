import React, { useEffect, useState } from 'react';
import Modal from "../components/Modal";
import CreateDirModal from "./CreateDirModal";
import serverRequest from "../services/serverRequest";
import clientRequest from "../services/clientRequest";
import TextField from '@mui/material/TextField';
import { Button, OutlinedInput, Typography } from '@mui/material';
import { Stack } from '@mui/system';

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
  const [puzzle, setPuzzle] = useState([0, 0]);
  const [solved, setSolved] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!open) return;
    const n1 = Math.floor(Math.random() * 49);
    const n2 = Math.floor(Math.random() * 49);
    setPuzzle([n1, n2])
    setValue("")
  }, [open, data])

  useEffect(() => {
    setSolved(parseInt(value) === puzzle[0] + puzzle[1]);
  }, [value, puzzle])

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
    <Modal open={open} title="Are you sure?"
      maxWidth="sm" closeButton onClose={onClose}
      text={`This will permanently delete this ${data.kind}!`}
      buttons={[
        <Button disabled={!solved} key="confirm" onClick={handleDeleteEntity}>Confirm</Button>,
        <Button key="cancel" onClick={onClose}>Cancel</Button>
      ]}
    >
      <TextField
        style={{marginTop: "20px"}}
        label={`${puzzle[0]} + ${puzzle[1]} =`}
        size="small"
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        helperText={solved ? "Go for it" : "Solve the above to continue"}
        color={solved ? "success" : "error"}
      />
    </Modal>
  )
}

export function RenameDir({data, open=false, onClose, enqueueSnackbar, fn}) {
  const [nameValue, setNameValue] = useState("");

  useEffect(() => {
    setNameValue(data.name);
  }, [data.name])

  function handleRenameDir() {
    console.log("hello")
    serverRequest("rename_entity", {...data, name: nameValue}).then(resp => {
      if (resp.ok) enqueueSnackbar("Renamed!", {variant: "success"});
      else {
        let reason = "";
        if (resp.error) reason = ` - ${resp.error}`;
        enqueueSnackbar(`Couldn't rename ${data.kind}${reason}.`, {variant: "error"});
      }
    });
    if (fn) fn();
    onClose();
  }

  return (
    <Modal open={open}
      maxWidth="sm" closeButton onClose={onClose} title={`Renaming ${data.kind}`}
      buttons={[<Button key="confirm" onClick={handleRenameDir}>Confirm</Button>]}
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
    <>
      <CreateDirModal
        open={open}
        data={data}
        onCreate={data => handleOnCreate(data)}
        onClose={onClose}
      />
    </>
  )
}
