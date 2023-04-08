// Copyright 2023 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, {useEffect, useState, useRef} from "react";

import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import LoadingButton from "@mui/lab/LoadingButton";

import Modal from "../components/Modal";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ClearIcon from "@mui/icons-material/Clear";
import Box from "@mui/material/Box";
import CreateDirModal from "./CreateDirModal";
import serverRequest from "../services/serverRequest";
import clientRequest from "../services/clientRequest";
import {DIRECTORYICONS, KINDTYPES} from "../constants";
import { Checkbox, FormControlLabel } from "@mui/material";


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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const n1 = Math.floor(Math.random() * 49);
    const n2 = Math.floor(Math.random() * 49);
    setLoading(false);
    setPuzzle([n1, n2]);
    setValue("");
  }, [open, data]);

  useEffect(() => {
    setSolved(parseInt(value) === puzzle[0] + puzzle[1]);
  }, [value, puzzle]);

  const handleDeleteEntity = () => {
    setLoading(true);
    serverRequest("delete_entity", data).then(resp => {
      if (resp.ok) enqueueSnackbar("Successfully deleted!", {variant: "success"});
      else enqueueSnackbar(
        resp.msg || "There was an issue with deleting this.", {variant: "error"}
      );
      if (fn) fn();
    });
    onClose();
    setLoading(false);
  };

  const kind = data.kind === "assetversion" ? "asset version" : data.kind;

  return (
    <Modal open={open} title="Are you sure?" onFormSubmit={handleDeleteEntity}
      maxWidth="sm" closeButton onClose={onClose} focusRef={textFieldRef}
      text={`This will permanently delete this ${kind}!`} focusDelay={1500}
      buttons={[
        <LoadingButton disabled={!solved} type="submit" key="confirm" loading={loading}>Confirm</LoadingButton>,
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
  const [loading, setLoading] = useState(false);
  const textFieldRef = useRef();

  useEffect(() => {
    if (!open) return;
    setLoading(false);
    setNameValue(data.name);
  }, [open]);

  function handleSubmit() {
    setLoading(true);
    serverRequest("vault_import", {...data, name: nameValue}).then(resp => {
      if (resp.ok) enqueueSnackbar("Done", {variant: "success"});
      else enqueueSnackbar(
        resp.msg || "An error occurred...", {variant: "error"}
      );
      if (fn) fn();
    });
    onClose();
    setNameValue("");
    setLoading(false);
  }

  return (
    <Modal open={open} onFormSubmit={handleSubmit} focusRef={textFieldRef}
      maxWidth="sm" closeButton onClose={onClose} title={"Add asset to vault"}
      buttons={[<LoadingButton key="confirm" type="submit" loading={loading}>Confirm</LoadingButton>]}
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
  const [loading, setLoading] = useState(false);
  const textFieldRef = useRef();

  useEffect(() => {
    if (!open) return;
    setLoading(false);
    setNameValue(data.name);
  }, [open]);

  function handleSubmit() {
    setLoading(true);
    serverRequest("vault_export", {...data, name: nameValue}).then(resp => {
      if (resp.ok) enqueueSnackbar("Done", {variant: "success"});
      else enqueueSnackbar(
        resp.msg || "An error occurred...", {variant: "error"}
      );
      if (fn) fn();
    });
    onClose();
    setNameValue("");
    setLoading(false);
  }

  return (
    <Modal open={open} onFormSubmit={handleSubmit} focusRef={textFieldRef}
      maxWidth="sm" closeButton onClose={onClose} title={"Import asset from vault"}
      buttons={[<LoadingButton key="confirm" type="submit" loading={loading}>Confirm</LoadingButton>]}
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
  const [loading, setLoading] = useState(false);
  const textFieldRef = useRef();

  useEffect(() => {
    if (!open) return;
    setLoading(false);
    setNameValue(data.name);
  }, [open]);

  function handleRenameDir() {
    if (nameValue === data.name) {
      onClose();
      return;
    }
    setLoading(true);
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
      if (fn) fn();
    });
    onClose();
    setNameValue("");
    setLoading(true);
  }

  return (
    <Modal open={open} onFormSubmit={handleRenameDir} focusRef={textFieldRef}
      maxWidth="sm" closeButton onClose={onClose} title={`Renaming ${data.kind}`}
      buttons={[<LoadingButton key="confirm" type="submit" loading={loading}>Confirm</LoadingButton>]}
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

export function ChangeTaskType(props) {
  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [rename, setRename] = useState("");
  const [loading, setLoading] = useState(false);
  const textFieldRef = useRef();
  const {data, open=false, onClose, enqueueSnackbar, fn} = props;
  const kind = data.kind;

  useEffect(() => {
    if (!open) return;
    setType(data.taskType);
    setName(data.name);
  }, [open]);

  if (!KINDTYPES[kind]) return null;

  const types = KINDTYPES[kind].sort((a, b) => a[1].localeCompare(b[1]));
  const Icon = DIRECTORYICONS[`${kind}_${type}`];

  function handleChangeTaskType() {
    if (type === data.name && name === data.name) {
      onClose();
      return;
    }
    setLoading(true);
    serverRequest(
      "change_task_type",
      {...data, type: type, name: rename ? name : ""}
    ).then(resp => {
      if (resp.ok) enqueueSnackbar("Task type changed!", {variant: "success"});
      else {
        let reason = "";
        if (resp.error) reason = ` - ${resp.error}`;
        enqueueSnackbar(
          resp.msg || `Couldn't change task type${reason}.`,
          {variant: "error"}
        );
      }
      if (fn) fn();
      onClose();
      setType("");
      setName("");
      setLoading(false);
    });
  }

  const handleTaskChange = e => {
    const value = e.target.value;
    setType(prev => {
      if (!name || name === prev) setName(value);
      return value;
    });
  };

  return (
    <Modal open={open} onFormSubmit={handleChangeTaskType}
      focusRef={textFieldRef} title={`Changing task type of ${data.name}`}
      maxWidth="sm" closeButton onClose={onClose}
      buttons={[
        <LoadingButton
          key="confirm"
          type="submit"
          color="ignite"
          loading={loading}
        >
          Confirm
        </LoadingButton>
      ]}
    >
      <Stack direction="row" gap={1} style={{width: "100%"}}>
        <Box
          component={Icon}
          sx={{
            height: "30px",
            width: "30px",
            m: "auto",
            color: "lightgrey.main"
          }}
        />
        <TextField
          select
          sx={{minWidth: 100}}
          size="small"
          label="Type"
          value={type || ""}
          onChange={handleTaskChange}
        >
          {types?.map(data =>
            <MenuItem key={data[0]} value={data[0]} >{data[1]}</MenuItem>
          )}
        </TextField>
        <FormControlLabel
          sx={{ml: 1, mr: 0.25}}
          control={
            <Checkbox
              color="ignite"
              value={rename}
              onChange={e => setRename(e.target.checked)}
            />
          }
          label="Rename"
        />
        <TextField
          label="Name"
          variant="outlined"
          disabled={!rename}
          value={name || ""}
          onChange={e => setName(e.target.value)}
          size="small"
          fullWidth
        />
      </Stack>
    </Modal>
  );
}

export function CreateDir({data, open=false, onClose, enqueueSnackbar, fn}) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(false);
  }, [open]);

  const handleOnCreate = data => {
    setLoading(true);
    serverRequest("create_dirs", data).then((resp => {
      enqueueSnackbar(
        resp.msg || resp.text, {variant: resp.ok ? "success" : "error"}
      );
      if (fn) fn();
    }));
    setLoading(false);
  };

  return (
    <>
      <CreateDirModal
        open={open}
        data={data}
        onCreate={data => handleOnCreate(data)}
        onClose={onClose}
        loading={loading}
      />
    </>
  );
}
