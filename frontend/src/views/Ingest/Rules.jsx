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

function Rule(index, rule, onModify) {
  return (
    <div className={styles.ruleContainer} key={index}>
      <div className={styles.ruleRow}>
      <FormControl sx={{ m: "5px", minWidth: 120 }} size="small">
        <InputLabel id="label-target-type">Target type</InputLabel>
        <Select
          labelId="label-target-type"
          id="select-target-type"
          label="Target type"
          defaultValue="entire_path"
          name={"file_target_type-" + index}
          onChange={onModify}
        >
          <MenuItem value="entire_path">Entire path</MenuItem>
          <MenuItem value="directory">Directory</MenuItem>
          <MenuItem value="filename">Filename</MenuItem>
        </Select>
      </FormControl>
      <TextField sx={{ m: "5px", minWidth: 120 }} label="Target" defaultValue="*" size="small" style={{flexGrow: 1}} name={"file_target_value-" + index} onChange={onModify} />
      </div>
      <Divider />
      <div className={styles.ruleRow}>
        <FormControl sx={{ m: "5px" }} size="small" style={{flexGrow: 1}}>
          <InputLabel id="label-rule-type">Rule type</InputLabel>
          <Select
            labelId="label-rule-type"
            id="select-rule-type"
            label="Rule type"
            defaultValue="extract_info"
            name={"rule_type-" + index}
            onChange={onModify}
          >
            <MenuItem value="extract_info">Extract info</MenuItem>
            <MenuItem value="set_value">Set value</MenuItem>
            <MenuItem value="replace_value">Replace value</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ m: "5px" }} size="small" style={{flexGrow: 1}}>
          <InputLabel id="label-rule-target">Rule type</InputLabel>
          <Select
            labelId="label-rule-target"
            id="select-rule-target"
            label="Rule target"
            defaultValue="filename"
            name={"rule_type-" + index}
            onChange={onModify}
          >
            <MenuItem value="entire_path">Entire path</MenuItem>
            <MenuItem value="directory">Directory</MenuItem>
            <MenuItem value="filename">Filename</MenuItem>
          </Select>
        </FormControl>
      </div>
      <div className={styles.ruleRow}>
        <TextField sx={{ m: "5px", minWidth: 120 }} label="Rule value" style={{flexGrow: 1}} size="small" name={"rule_value-" + index} onChange={onModify} />
      </div>
    </div>
  )
}

function Rules(props) {
  return (
    <div className={styles.container}>
      <Typography variant="h6">Ingest Rules</Typography>
      <DynamicList onAdd={() => props.onRulesChange(null, "add")} onRemove={() => props.onRulesChange(null, "remove")}>
        {
          props.rules ?
          props.rules.map((child, index) => Rule(
            index, child, e => props.onRulesChange(e, "modify")
          )) :
          null
        }
      </DynamicList>
    </div>
  )
}

export default Rules;
