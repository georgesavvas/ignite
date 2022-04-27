import React from 'react';
import styles from "./Rules.module.css";
import DynamicList from "../../components/DynamicList";
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';

function Rule(rule) {
  return (
    <div className={styles.ruleContainer}>
      <div>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value="Extract info"
          placeholder="Rule type"
        >
          <MenuItem value={10}>Extract info</MenuItem>
          <MenuItem value={20}>Replace value</MenuItem>
          <MenuItem value={30}>Set value</MenuItem>
        </Select>
        <TextField placeholder="Target" />
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
        >
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
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
