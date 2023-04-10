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

import Dialog, { DialogProps } from "@mui/material/Dialog";
import { FormEvent, MouseEventHandler, useState } from "react";

import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { TextFieldChangeEvent } from "@renderer/types/common";

const NewDirContent = (values: { string; string }, setValues: Function) => {
  const handleChange = (e: TextFieldChangeEvent, field: string) => {
    const data: { [key: string]: string } = {};
    data[field] = e.target.value;
    setValues((prevState: { [key: string]: string }) => ({
      ...prevState,
      ...data,
    }));
  };

  return (
    <DialogContent>
      <TextField
        autoFocus
        margin="dense"
        id="text_field"
        label="Name"
        fullWidth
        variant="standard"
        value={values.dir_name}
        onChange={(e) => handleChange(e, "dir_name")}
      />
    </DialogContent>
  );
};

const NewBuildContent = (values: { [key: string]: string }, setValues: Function) => {
  const handleChange = (e: TextFieldChangeEvent, field: string) => {
    const data: { [key: string]: string } = {};
    data[field] = e.target.value;
    setValues((prevState: { [key: string]: string }) => ({
      ...prevState,
      ...data,
    }));
  };

  return (
    <DialogContent>
      <TextField
        autoFocus
        margin="dense"
        id="text_field"
        label="Name"
        fullWidth
        variant="standard"
        value={values.dir_name}
        onChange={(e) => handleChange(e, "dir_name")}
      />
    </DialogContent>
  );
};

const NewTaskContent = (values: { [key: string]: string }, setValues: Function) => {
  const task_types = [
    {
      value: "generic",
      label: "Generic",
    },
    {
      value: "model",
      label: "Model",
    },
    {
      value: "layout",
      label: "Layout",
    },
    {
      value: "surface",
      label: "Surface",
    },
    {
      value: "light",
      label: "Light",
    },
    {
      value: "fx",
      label: "FX",
    },
    {
      value: "anim",
      label: "Anim",
    },
    {
      value: "rig",
      label: "Rig",
    },
  ];

  const handleChange = (e: TextFieldChangeEvent, field: string) => {
    const data: any = {};
    data[field] = e.target.value;
    setValues((prevState: { [key: string]: string }) => ({
      ...prevState,
      ...data,
    }));
  };

  return (
    <DialogContent>
      <TextField
        id="task_type"
        select
        label="Task type"
        value={values.task_type}
        onChange={(e) => handleChange(e, "task_type")}
        variant="standard"
      >
        {task_types.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        autoFocus
        margin="dense"
        id="dir_name"
        label="Name"
        fullWidth
        variant="standard"
        value={values.dir_name}
        onChange={(e) => handleChange(e, "dir_name")}
      />
    </DialogContent>
  );
};

const dialogueContents: { [key: string]: Function } = {
  directory: NewDirContent,
  build: NewBuildContent,
  sequence: NewDirContent,
  shot: NewDirContent,
  task: NewTaskContent,
};

interface CreateDialogueProps {
  meta: { dir_kind: string; modal_title: string };
  onCreate: Function;
  onClose: Function;
  open: boolean;
}

export const CreateDirDialogue = (props: CreateDialogueProps) => {
  const defaultFields = {
    dir_name: props.meta.dir_kind === "task" ? "main" : "",
    task_type: "generic",
    tasks: [],
  };
  const [values, setValues] = useState(defaultFields);

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    props.onCreate(values, props.meta);
    setValues(defaultFields);
    props.onClose();
  };

  return (
    <Dialog open={props.open} onClose={props.onClose as DialogProps["onClose"]}>
      <DialogTitle>{props.meta.modal_title}</DialogTitle>
      <form onSubmit={handleCreate}>
        {props.open ? dialogueContents[props.meta.dir_kind](values, setValues) : null}
        <DialogActions>
          <Button type="button" onClick={props.onClose as MouseEventHandler}>
            Cancel
          </Button>
          <Button type="submit">Create</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateDirDialogue;
