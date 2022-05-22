import React, { useEffect, useState } from 'react';
import DynamicList from "../components/DynamicList";
import Modal from "../components/Modal";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CancelIcon from '@mui/icons-material/Cancel';
import { DIRECTORYICONS } from "../constants";

const KINDTYPES = {
  task: [
    ["generic", "Generic"],
    ["model", "Model"],
    ["look", "Look"],
    ["light", "Light"],
    ["anim", "Anim"],
    ["rig", "Rig"],
    ["asset", "Asset"],
    ["fx", "FX"]
  ]
}

function Dir(props) {
  const kind = props.data.kind;
  const hasTypes = KINDTYPES.hasOwnProperty(kind);

  const Icon = DIRECTORYICONS[props.dir.type ? `${kind}_${props.dir.type}` : kind]

  return (
    <Stack direction="row" gap={1} style={{width: "100%"}}>
      <IconButton onClick={e => props.onRemove(props.index)}
        color="error" size="small" variant="outlined"
      ><CancelIcon /></IconButton>
      {hasTypes ?
        <FormControl sx={{ minWidth: 120 }} size="small">
          <InputLabel id="type">Type</InputLabel>
          <Select
            labelId="type"
            id={"type-" + props.index}
            label="Type"
            value={props.dir.type}
            name={"type-" + props.index}
            onChange={props.onChange}
          >
            {KINDTYPES[kind].map(data => <MenuItem key={data[0]} value={data[0]} >{data[1]}</MenuItem>)}
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
      <Box component={Icon} sx={{ height: "30px", width: "30px", m: "auto", color: "lightgrey.main" }} />
    </Stack>
  )
}

const dirTemplate = {
  "type": "",
  "name": ""
}

function CreateDirModal(props) {
  const [dirList, setDirList] = useState([]);

  useEffect(() => {
    setDirList([{...dirTemplate}]);
  }, [props.open])

  const handleAdd = () => {
    setDirList(prevState => [...prevState, {...dirTemplate}]);
  }

  const handleRemove = (index=-1) => {
    setDirList(prevState => {
      const dirs = [...prevState];
      if (index < 0) dirs.pop();
      else dirs.splice(index, 1);
      return dirs;
    })
  }

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
    })
  }

  const handleCreate = () => {
    const data = {...props.data};
    data.dirs = dirList.map(dir => ({
      dir_type: dir.type,
      dir_name: dir.name
    }))
    props.onCreate(data);
    props.onClose();
  }

  const getDirList = dirs => {
      return dirs.map((dir, index) => <Dir
        key={"dir-" + index} index={index} dir={dir} onRemove={handleRemove}
         onChange={handleChange} id={"dir-" + index} data={props.data}
      />)
  }

  return (
    <Modal open={props.open} maxWidth="xs" onClose={props.onClose} closeButton
      title={`Create ${props.data.kind}`} buttonLabel="Create" onButtonClicked={handleCreate}
      buttonProps={{color: "ignite"}}
    >
      <div style={{display: "flex", flexDirection: "column", height: "60vh"}}>
        <DynamicList onAdd={handleAdd} onRemove={() => handleRemove(-1)}>
          {getDirList(dirList)}
        </DynamicList>
      </div>
    </Modal>
  )
}

export default CreateDirModal;
