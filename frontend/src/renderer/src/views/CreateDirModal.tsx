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

import ClearIcon from "@mui/icons-material/Clear";
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectProps } from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import { InputChangeEvent } from "@renderer/types/common";
import { useEffect, useState } from "react";

import DynamicList from "../components/DynamicList";
import Modal from "../components/Modal";
import { DIRECTORYICONS, KINDTYPES } from "../constants";
import styles from "./CreateDirModal.module.css";

type DirType = {
  name: string;
  type: string;
};

interface DirProps {
  data: any;
  dir: DirType;
  index: number;
  id: string;
  onRemove: (index: number) => void;
  onChange: TextFieldProps["onChange"];
}

const Dir = (props: DirProps) => {
  const kind = props.data.kind as keyof typeof KINDTYPES;
  const types = KINDTYPES[kind]?.sort((a: string[], b: string[]) => a[1].localeCompare(b[1]));

  const dirKind = props.dir.type ? `${kind}_${props.dir.type}` : kind;
  const Icon = DIRECTORYICONS[dirKind as keyof typeof DIRECTORYICONS];

  return (
    <Stack direction="row" gap={1} style={{ width: "100%" }}>
      <Box
        component={ClearIcon}
        onClick={() => props.onRemove(props.index)}
        sx={{ width: "30px", height: "30px", m: "auto" }}
        className={styles.removeIcon}
      />
      {types ? (
        <FormControl sx={{ minWidth: 120 }} size="small">
          <InputLabel id="type">Type</InputLabel>
          <Select
            labelId="type"
            id={"type-" + props.index}
            label="Type"
            value={props.dir.type}
            name={"type-" + props.index}
            onChange={props.onChange as SelectProps["onChange"]}
          >
            {types.map((data: string[]) => (
              <MenuItem key={data[0]} value={data[0]}>
                {data[1]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : null}
      <TextField
        id={"name-" + props.index}
        name={"name-" + props.index}
        label="Name"
        variant="outlined"
        value={props.dir.name}
        onChange={props.onChange}
        size="small"
        fullWidth
      />
      <Box
        component={Icon}
        sx={{ height: "30px", width: "30px", m: "auto", color: "lightgrey.main" }}
      />
    </Stack>
  );
};

const dirTemplate = {
  type: "",
  name: "",
};
const kindDefaults = {
  task: {},
};

interface ShotRange {
  setDirList: (dirs: DirType[]) => void;
}

const ShotRange = (props: ShotRange) => {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [inc, setInc] = useState("");

  const handlePopulate = () => {
    const padding = start.length;
    const startInt = parseInt(start);
    const endInt = parseInt(end);
    const incInt = inc ? parseInt(inc) : 10;
    const amount = Math.floor((endInt - startInt) / incInt + 1);
    const range = [...Array(amount).keys()].map((index) => {
      return (index * incInt + startInt).toString().padStart(padding, "0");
    });
    if (range.at(-1) !== end) range.push(end);
    props.setDirList(range.map((n) => ({ type: "", name: n })));
  };

  const handleClear = () => {
    props.setDirList([{ ...dirTemplate }]);
  };

  return (
    <Stack gap="5px" direction="row" style={{ margin: "10px 0px" }}>
      <TextField
        id="rangex"
        label="First shot"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        placeholder="0010"
        size="small"
      />
      <TextField
        id="rangey"
        label="Last shot"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
        placeholder="0050"
        size="small"
      />
      <TextField
        id="step"
        label="Increment"
        value={inc}
        onChange={(e) => setInc(e.target.value)}
        placeholder="10"
        size="small"
      />
      <Button variant="outlined" color="ignite" onClick={handlePopulate} disabled={!start || !end}>
        Populate
      </Button>
      <Button variant="outlined" color="ignite" onClick={handleClear}>
        Clear
      </Button>
    </Stack>
  );
};

export interface CreateDirModalProps {
  data: any;
  open: boolean;
  loading: boolean;
  onCreate: (data: any) => void;
  onClose: () => void;
}

const CreateDirModal = (props: CreateDirModalProps) => {
  const [dirList, setDirList] = useState<DirType[]>([]);
  const kindOverrides = kindDefaults?.[props.data.kind as keyof typeof kindDefaults] ?? {};

  useEffect(() => {
    setDirList([{ ...dirTemplate, ...kindOverrides }]);
  }, [props.open]);

  const handleAdd = () => {
    setDirList((prev) => [...prev, { ...dirTemplate }]);
  };

  const handleRemove = (index = -1) => {
    setDirList((prev: DirType[]) => {
      const dirs = [...prev];
      if (index < 0) dirs.pop();
      else dirs.splice(index, 1);
      return dirs;
    });
  };

  const handleChange = (e: InputChangeEvent) => {
    const [field, id] = e.target.name.split("-");
    const id_ = parseInt(id);
    const value = e.target.value;
    setDirList((prev) => {
      const dirs = [...prev];
      const existingNames = dirs.map((d) => d.name).filter((name) => name.startsWith(value));
      const previousType = dirs[id_].type;
      dirs[id_][field as keyof DirType] = value;

      const name = dirs[id_].name;
      if (!name || name === previousType) {
        if (existingNames.includes(value)) {
          let suffix = 2;
          while (existingNames.includes(`${value}${suffix}`)) suffix++;
          dirs[id_].name = `${value}${suffix}`;
        } else {
          dirs[id_].name = value;
        }
      }
      return dirs;
    });
  };

  const handleCreate = () => {
    const data = { ...props.data };
    delete data.handleClick;
    data.dirs = dirList.map((dir) => ({
      dir_type: dir.type,
      dir_name: dir.name,
    }));
    props.onCreate(data);
    props.onClose();
  };

  const getDirList = (dirs: DirType[]) => {
    return dirs.map((dir, index) => (
      <Dir
        key={"dir-" + index}
        index={index}
        dir={dir}
        onRemove={handleRemove}
        onChange={handleChange}
        id={"dir-" + index}
        data={props.data}
      />
    ));
  };

  return (
    <Modal
      open={props.open}
      maxWidth="sm"
      onClose={props.onClose}
      title={`Create ${props.data.kind}`}
      buttons={[
        <LoadingButton key="create" color="ignite" onClick={handleCreate} loading={props.loading}>
          Create
        </LoadingButton>,
      ]}
    >
      {props.data.kind === "shot" ? <ShotRange setDirList={setDirList} /> : null}
      <div style={{ display: "flex", flexDirection: "column", height: "60vh" }}>
        <DynamicList onAdd={handleAdd} onRemove={() => handleRemove(-1)}>
          {getDirList(dirList)}
        </DynamicList>
      </div>
    </Modal>
  );
};

export default CreateDirModal;
