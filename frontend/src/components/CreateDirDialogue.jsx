// Copyright 2022 George Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, {useState} from "react";

import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";


const NewDirContent = (values, setValues) => {
  const handleChange = (e, field) => {
    const data = {};
    data[field] = e.target.value;
    setValues(prevState => ({...prevState, ...data}));
  };

  return (
    <DialogContent>
      {/* <DialogContentText>
        {props.info}
      </DialogContentText> */}
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

const NewBuildContent = (values, setValues) => {
  // const [checked, setChecked] = useState([1]);

  const handleChange = (e, field) => {
    const data = {};
    data[field] = e.target.value;
    setValues(prevState => ({...prevState, ...data}));
  };

  return (
    <DialogContent>
      {/* <List dense sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {[0, 1, 2, 3].map((value) => {
          const labelId = `checkbox-list-secondary-label-${value}`;
          return (
            <ListItem
              key={value}
              secondaryAction={
                <Checkbox
                  edge="end"
                  onChange={handleChange(value, "tasks")}
                  checked={values.tasks.indexOf(value) !== -1}
                  inputProps={{ 'aria-labelledby': labelId }}
                />
              }
              disablePadding
            >
              <ListItemButton>
                <ListItemText id={labelId} primary={`Line item ${value + 1}`} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List> */}
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

const NewTaskContent = (values, setValues) => {
  // const [checked, setChecked] = useState([1]);

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

  const handleChange = (e, field) => {
    const data = {};
    data[field] = e.target.value;
    setValues(prevState => ({...prevState, ...data}));
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

const dialogueContents = {
  "directory": NewDirContent,
  "build": NewBuildContent,
  "sequence": NewDirContent,
  "shot": NewDirContent,
  "task": NewTaskContent
};

export default function CreateDirDialogue(props) {
  const fields = {
    dir_name: "",
    task_type: "generic",
    tasks: []
  };
  const [values, setValues] = useState(fields);

  const handleCreate = (e) => {
    e.preventDefault();
    props.onCreate(values, props.meta);
    setValues("");
    props.onClose();
  };
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>{props.meta.modal_title}</DialogTitle>
      <form onSubmit={handleCreate}>
        {props.open ? dialogueContents[props.meta.dir_kind](values, setValues) : null}
        <DialogActions>
          <Button onClick={props.onClose}>Cancel</Button>
          <Button type="submit">Create</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
