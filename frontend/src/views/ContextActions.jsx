import React, {useEffect, useState, useRef} from "react";

import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

import Modal from "../components/Modal";
import CreateDirModal from "./CreateDirModal";
import serverRequest from "../services/serverRequest";
import clientRequest from "../services/clientRequest";


export function CopyToClipboard(text, enqueueSnackbar) {
  navigator.clipboard.writeText(text);
  enqueueSnackbar("Copied to clipboard!", {variant: "success"});
}

export function ShowInExplorer(filepath, enqueueSnackbar) {
  clientRequest("show_in_explorer", {"filepath": filepath}).then((resp) => {
    if (!resp.ok) enqueueSnackbar(
      resp.msg || "Failed launching scene.", {variant: "error"}
    );
  });
}

export function clearRepr(target, enqueueSnackbar, refresh) {
  const data = {
    target: target,
    repr: ""
  };
  serverRequest("set_repr", data).then(resp => {
    if (resp.ok) {
      enqueueSnackbar("Done", {variant: "success"});
      refresh();
    }
    else enqueueSnackbar(resp.msg || "Couldn't clear repr", {variant: "error"});
  });
}

export function setReprForProject(repr, enqueueSnackbar) {
  const data = {
    repr: repr
  };
  serverRequest("set_repr_for_project", data).then(resp => {
    if (resp.ok) enqueueSnackbar(`Repr set for ${resp.data}`, {variant: "success"});
    else enqueueSnackbar(`Couldn't set repr for ${resp.data}`, {variant: "error"});
  });
}

export function setReprForParent(repr, enqueueSnackbar) {
  const data = {
    repr: repr
  };
  serverRequest("set_repr_for_parent", data).then(resp => {
    if (resp.ok) enqueueSnackbar(`Repr set for ${resp.data}`, {variant: "success"});
    else enqueueSnackbar(
      resp.msg || `Couldn't set repr for ${resp.data}`, {variant: "error"}
    );
  });
}

export function DeleteDir({data, open=false, onClose, enqueueSnackbar, fn}) {
  const textFieldRef = useRef();
  const [puzzle, setPuzzle] = useState([0, 0]);
  const [solved, setSolved] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!open) return;
    const n1 = Math.floor(Math.random() * 49);
    const n2 = Math.floor(Math.random() * 49);
    setPuzzle([n1, n2]);
    setValue("");
  }, [open, data]);

  useEffect(() => {
    setSolved(parseInt(value) === puzzle[0] + puzzle[1]);
  }, [value, puzzle]);

  const handleDeleteEntity = () => {
    serverRequest("delete_entity", data).then(resp => {
      if (resp.ok) enqueueSnackbar("Successfully deleted!", {variant: "success"});
      else enqueueSnackbar(
        resp.msg || "There was an issue with deleting this.", {variant: "error"}
      );
    });
    if (fn) fn();
    onClose();
  };

  const kind = data.kind === "assetversion" ? "asset version" : data.kind;

  return (
    <Modal open={open} title="Are you sure?" onFormSubmit={handleDeleteEntity}
      maxWidth="sm" closeButton onClose={onClose} focusRef={textFieldRef}
      text={`This will permanently delete this ${kind}!`} focusDelay={1500}
      buttons={[
        <Button disabled={!solved} type="submit" key="confirm">Confirm</Button>,
        <Button key="cancel" onClick={onClose}>Cancel</Button>
      ]}
    >
      <TextField
        style={{marginTop: "20px"}}
        label={`${puzzle[0]} + ${puzzle[1]} =`}
        size="small"
        autoFocus
        inputRef={textFieldRef}
        value={value || ""}
        onChange={e => setValue(e.target.value)}
        helperText={solved ? "Go for it" : "Solve the above to continue"}
        color={solved ? "success" : "error"}
      />
    </Modal>
  );
}

export function VaultImport({data, open=false, onClose, enqueueSnackbar, fn}) {
  const [nameValue, setNameValue] = useState("");
  const textFieldRef = useRef();

  useEffect(() => {
    if (!open) return;
    setNameValue(data.name);
  }, [open]);

  function handleSubmit() {
    serverRequest("vault_import", {...data, name: nameValue}).then(resp => {
      if (resp.ok) enqueueSnackbar("Done", {variant: "success"});
      else enqueueSnackbar(
        resp.msg || "An error occurred...", {variant: "error"}
      );
    });
    if (fn) fn();
    onClose();
    setNameValue("");
  }

  return (
    <Modal open={open} onFormSubmit={handleSubmit} focusRef={textFieldRef}
      maxWidth="sm" closeButton onClose={onClose} title={"Add asset to vault"}
      buttons={[<Button key="confirm" type="submit">Confirm</Button>]}
    >
      <TextField
        id="name"
        label="Name"
        variant="outlined"
        value={nameValue || ""}
        onChange={e => setNameValue(e.target.value)}
        size="small"
        fullWidth
        autoFocus
        inputRef={textFieldRef}
        style={{marginTop: "10px"}}
      />
    </Modal>
  );
}

export function VaultExport({data, open=false, onClose, enqueueSnackbar, fn}) {
  const [nameValue, setNameValue] = useState("");
  const textFieldRef = useRef();

  useEffect(() => {
    if (!open) return;
    setNameValue(data.name);
  }, [open]);

  function handleSubmit() {
    serverRequest("vault_export", {...data, name: nameValue}).then(resp => {
      if (resp.ok) enqueueSnackbar("Done", {variant: "success"});
      else enqueueSnackbar(
        resp.msg || "An error occurred...", {variant: "error"}
      );
    });
    if (fn) fn();
    onClose();
    setNameValue("");
  }

  return (
    <Modal open={open} onFormSubmit={handleSubmit} focusRef={textFieldRef}
      maxWidth="sm" closeButton onClose={onClose} title={"Import asset from vault"}
      buttons={[<Button key="confirm" type="submit">Confirm</Button>]}
    >
      <TextField
        id="name"
        label="Name"
        variant="outlined"
        value={nameValue || ""}
        onChange={e => setNameValue(e.target.value)}
        size="small"
        fullWidth
        autoFocus
        inputRef={textFieldRef}
        style={{marginTop: "10px"}}
      />
    </Modal>
  );
}

export function RenameDir({data, open=false, onClose, enqueueSnackbar, fn}) {
  const [nameValue, setNameValue] = useState("");
  const textFieldRef = useRef();

  useEffect(() => {
    if (!open) return;
    setNameValue(data.name);
  }, [open]);

  function handleRenameDir() {
    if (nameValue === data.name) {
      onClose();
      return;
    }
    serverRequest("rename_entity", {...data, name: nameValue}).then(resp => {
      if (resp.ok) enqueueSnackbar("Renamed!", {variant: "success"});
      else {
        let reason = "";
        if (resp.error) reason = ` - ${resp.error}`;
        enqueueSnackbar(
          resp.msg || `Couldn't rename ${data.kind}${reason}.`,
          {variant: "error"}
        );
      }
    });
    if (fn) fn();
    onClose();
    setNameValue("");
  }

  return (
    <Modal open={open} onFormSubmit={handleRenameDir} focusRef={textFieldRef}
      maxWidth="sm" closeButton onClose={onClose} title={`Renaming ${data.kind}`}
      buttons={[<Button key="confirm" type="submit">Confirm</Button>]}
    >
      <TextField
        id="name"
        label="Name"
        variant="outlined"
        value={nameValue || ""}
        onChange={e => setNameValue(e.target.value)}
        size="small"
        fullWidth
        autoFocus
        inputRef={textFieldRef}
        style={{marginTop: "10px"}}
      />
    </Modal>
  );
}

export function CreateDir({data, open=false, onClose, enqueueSnackbar, fn}) {
  const handleOnCreate = data => {
    serverRequest("create_dirs", data).then((resp => {
      enqueueSnackbar(
        resp.msg || resp.text, {variant: resp.ok ? "success" : "error"}
      );
      if (fn) fn();
    }));
  };

  return (
    <>
      <CreateDirModal
        open={open}
        data={data}
        onCreate={data => handleOnCreate(data)}
        onClose={onClose}
      />
    </>
  );
}
