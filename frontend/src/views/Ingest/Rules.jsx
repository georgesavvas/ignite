import React from 'react';
import styles from "./Rules.module.css";
import DynamicList from "../../components/DynamicList";
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { Divider } from '@mui/material';

function Rule(rule) {
  return (
    <div className={styles.ruleContainer}>
      <div>
      <FormControl sx={{ m: "5px", minWidth: 120 }} size="small">
        <InputLabel id="demo-select-small">Target type</InputLabel>
        <Select
          labelId="demo-select-small"
          id="demo-select-small"
          label="Target type"
        >
          <MenuItem value="Entire path">Entire path</MenuItem>
          <MenuItem value="Directory">Directory</MenuItem>
          <MenuItem value="Filename">Filename</MenuItem>
        </Select>
      </FormControl>
      <TextField sx={{ m: "5px", minWidth: 120 }} label="Target" size="small" />
      </div>
      <Divider />
      <div>
      <FormControl sx={{ m: "5px", minWidth: 120 }} size="small">
        <InputLabel id="demo-select-small1">Rule type</InputLabel>
        <Select
          labelId="demo-select-small1"
          id="demo-select-small1"
          label="Rule type"
        >
          <MenuItem value="Extract info">Extract info</MenuItem>
          <MenuItem value="Set value">Set value</MenuItem>
          <MenuItem value="Replace value">Replace value</MenuItem>
        </Select>
      </FormControl>
      <TextField sx={{ m: "5px", minWidth: 120 }} label="Rule value" size="small" />
      </div>
    </div>
  )
}

function Rules(props) {
  return (
    <div className={styles.container}>
      <Typography variant="h6">Ingest Rules</Typography>
      <DynamicList>
        {
          props.data ?
          props.data.map((child) => Rule(child)) :
          null
        }
      </DynamicList>
    </div>
  )
}

export default Rules;
