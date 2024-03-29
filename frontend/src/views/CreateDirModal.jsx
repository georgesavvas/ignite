// Copyright 2022 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, {useEffect, useState} from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import Button from "@mui/material/Button";
import ClearIcon from "@mui/icons-material/Clear";

import {DIRECTORYICONS} from "../constants";
import styles from "./CreateDirModal.module.css";
import DynamicList from "../components/DynamicList";
import Modal from "../components/Modal";


const KINDTYPES = {
  task: [
    ["generic", "Generic"],
    ["model", "Model"],
    ["layout", "Layout"],
    ["surface", "Surface"],
    ["light", "Light"],
    ["anim", "Anim"],
    ["rig", "Rig"],
    ["asset", "Asset"],
    ["fx", "FX"]
  ]
};

function Dir(props) {
  const kind = props.data.kind;
  const types = KINDTYPES[kind];

  const Icon = DIRECTORYICONS[props.dir.type ? `${kind}_${props.dir.type}` : kind];

  return (
    <Stack direction="row" gap={1} style={{width: "100%"}}>
      <Box component={ClearIcon} onClick={() => props.onRemove(props.index)} sx={{width: "30px", height: "30px", m: "auto"}} className={styles.removeIcon} />
      {types ?
        <FormControl sx={{minWidth: 120}} size="small">
          <InputLabel id="type">Type</InputLabel>
          <Select
            labelId="type"
            id={"type-" + props.index}
            label="Type"
            value={props.dir.type}
            name={"type-" + props.index}
            onChange={props.onChange}
          >
            {types.map(data => <MenuItem key={data[0]} value={data[0]} >{data[1]}</MenuItem>)}
          </Select>
        </FormControl>
        : null}
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
      <Box component={Icon} sx={{height: "30px", width: "30px", m: "auto", color: "lightgrey.main"}} />
    </Stack>
  );
}

const dirTemplate = {
  type: "",
  name: ""
};
const kindDefaults = {
  task: {}
};

const ShotRange = props => {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [inc, setInc] = useState("");

  const handlePopulate = () => {
    const padding = start.length;
    const startInt = parseInt(start);
    const endInt = parseInt(end);
    const incInt = inc ? parseInt(inc) : 10;
    const amount = Math.floor((endInt - startInt) / incInt + 1);
    const range = [...Array(amount).keys()].map(index => {
      return (index * incInt + startInt).toString().padStart(padding, "0");
    });
    if (range.at(-1) !== end) range.push(end);
    props.setDirList(range.map(n => ({type: "", name: n})));
  };

  const handleClear = () => {
    props.setDirList([{...dirTemplate}]);
  };

  return (
    <Stack gap="5px" direction="row" style={{margin: "10px 0px"}}>
      <TextField
        id="rangex"
        label="First shot"
        value={start}
        onChange={e => setStart(e.target.value)}
        placeholder="0010"
        size="small"
      />
      <TextField
        id="rangey"
        label="Last shot"
        value={end}
        onChange={e => setEnd(e.target.value)}
        placeholder="0050"
        size="small"
      />
      <TextField
        id="step"
        label="Increment"
        value={inc}
        onChange={e => setInc(e.target.value)}
        placeholder="10"
        size="small"
      />
      <Button variant="outlined" color="ignite" onClick={handlePopulate}
        disabled={!start || !end}
      >
        Populate
      </Button>
      <Button variant="outlined" color="ignite" onClick={handleClear}>
        Clear
      </Button>
    </Stack>
  );
};

function CreateDirModal(props) {
  const [dirList, setDirList] = useState([]);
  const kindOverrides = kindDefaults?.[props.data.kind] ?? {};

  useEffect(() => {
    setDirList([{...dirTemplate, ...kindOverrides}]);
  }, [props.open]);

  const handleAdd = () => {
    setDirList(prevState => [...prevState, {...dirTemplate}]);
  };

  const handleRemove = (index=-1) => {
    setDirList(prevState => {
      const dirs = [...prevState];
      if (index < 0) dirs.pop();
      else dirs.splice(index, 1);
      return dirs;
    });
  };

  const handleChange = e => {
    const [field, id] = e.target.name.split("-");
    const value = e.target.value;
    setDirList(prevState => {
      const dirs = [...prevState];
      const previousType = dirs[id].type;
      dirs[id][field] = value;

      const name = dirs[id].name;
      if (!name || name === previousType) dirs[id].name = value;

      return dirs;
    });
  };

  const handleCreate = () => {
    const data = {...props.data};
    delete data.handleClick;
    data.dirs = dirList.map(dir => ({
      dir_type: dir.type,
      dir_name: dir.name
    }));
    props.onCreate(data);
    props.onClose();
  };

  const getDirList = dirs => {
    return dirs.map((dir, index) => <Dir
      key={"dir-" + index} index={index} dir={dir} onRemove={handleRemove}
      onChange={handleChange} id={"dir-" + index} data={props.data}
    />);
  };

  return (
    <Modal open={props.open} maxWidth="sm" onClose={props.onClose}
      title={`Create ${props.data.kind}`}
      buttons={[
        <Button key="create" color="ignite" onClick={handleCreate}>
          Create
        </Button>
      ]}
    >
      {props.data.kind === "shot" ?
        <ShotRange setDirList={setDirList} /> :
        null}
      <div style={{display: "flex", flexDirection: "column", height: "60vh"}}>
        <DynamicList onAdd={handleAdd} onRemove={() => handleRemove(-1)}>
          {getDirList(dirList)}
        </DynamicList>
      </div>
    </Modal>
  );
}

export default CreateDirModal;
