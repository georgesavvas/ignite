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

import Button from "@mui/material/Button";
import Dialog, { DialogProps } from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { TextFieldChangeEvent } from "@renderer/types/common";
import { FormEvent, MouseEventHandler, useState } from "react";

const taskTypes = [
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

interface IgniteDirectory {
  dirName?: string;
}
type setIgniteDirectory = React.Dispatch<React.SetStateAction<IgniteDirectory>>;

interface IgniteTaskDirectory extends IgniteDirectory {
  taskType?: string;
  tasks?: string[];
}
type setIgniteTaskDirectory = React.Dispatch<React.SetStateAction<IgniteTaskDirectory>>;

const NewDirContent = (setDirData: setIgniteDirectory, dirData: IgniteDirectory) => {
  const handleChange = (e: TextFieldChangeEvent, field: string) => {
    const data: { [key: string]: string } = {};
    data[field] = e.target.value;
    setDirData((prev) => ({
      ...prev,
      ...data,
    }));
  };

  return (
    <DialogContent>
      <TextField
        autoFocus
        margin="dense"
        label="Name"
        fullWidth
        value={dirData.dirName}
        onChange={(e: TextFieldChangeEvent) => handleChange(e, "dirName")}
      />
    </DialogContent>
  );
};

const NewBuildContent = (setDirData: setIgniteTaskDirectory, dirData: IgniteTaskDirectory) => {
  const handleChange = (e: TextFieldChangeEvent, field: string) => {
    const data: { [key: string]: string } = {};
    data[field] = e.target.value;
    setDirData((prev) => ({
      ...prev,
      ...data,
    }));
  };

  return (
    <DialogContent>
      <TextField
        autoFocus
        margin="dense"
        label="Name"
        fullWidth
        value={dirData.dirName || ""}
        onChange={(e: TextFieldChangeEvent) => handleChange(e, "dirName")}
      />
    </DialogContent>
  );
};

const NewTaskContent = (
  setDirData: setIgniteTaskDirectory,
  dirData: IgniteTaskDirectory = { dirName: "main" }
) => {
  const handleChange = (e: TextFieldChangeEvent, field: string) => {
    const data: any = {};
    data[field] = e.target.value;
    setDirData((prev) => ({
      ...prev,
      ...data,
    }));
  };

  return (
    <DialogContent>
      <TextField
        select
        label="Task type"
        value={dirData.taskType}
        onChange={(e: TextFieldChangeEvent) => handleChange(e, "taskType")}
      >
        {taskTypes.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        autoFocus
        margin="dense"
        label="Name"
        fullWidth
        value={dirData.dirName}
        onChange={(e: TextFieldChangeEvent) => handleChange(e, "dirName")}
      />
    </DialogContent>
  );
};

const dialogueContents = {
  directory: NewDirContent,
  build: NewBuildContent,
  sequence: NewDirContent,
  shot: NewDirContent,
  task: NewTaskContent,
};

interface CreateDialogueProps {
  meta: { dirKind: string; modalTitle: string };
  onCreate: Function;
  onClose: Function;
  open: boolean;
}

export const CreateDirDialogue = (props: CreateDialogueProps) => {
  const [dirData, setDirData] = useState<IgniteDirectory>({});
  const dirKind = props.meta.dirKind;

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    props.onCreate(dirData, props.meta);
    setDirData({});
    props.onClose();
  };

  return (
    <Dialog open={props.open} onClose={props.onClose as DialogProps["onClose"]}>
      <DialogTitle>{props.meta.modalTitle}</DialogTitle>
      <form onSubmit={handleCreate}>
        {props.open
          ? dialogueContents[dirKind as keyof typeof dialogueContents](setDirData, dirData)
          : null}
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
