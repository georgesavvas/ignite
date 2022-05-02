import React, { useState } from 'react';
import styles from "./Rules.module.css";
import DynamicList from "../../components/DynamicList";
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import {useXarrow} from "react-xarrows";
import { Divider } from '@mui/material';

function getRuleTypeField(ruleType, index, onModify, template) {
  switch (ruleType) {
    case "extract_info":
      return (
        <FormControl sx={{ m: "5px" }} size="small" style={{flexGrow: 1}} key="extract_target">
          <InputLabel id="label-extract_target">Extract from</InputLabel>
          <Select
            labelId="label-extract_target"
            id="select-extract_target"
            label="Extract from"
            defaultValue={template.extract_target}
            name={"extract_target-" + index}
            onChange={onModify}
          >
            <MenuItem value="entire_path">Entire path</MenuItem>
            <MenuItem value="directory">Directory</MenuItem>
            <MenuItem value="filename">Filename</MenuItem>
          </Select>
        </FormControl>
      )
    case "replace_value":
      return (
        <TextField sx={{ m: "5px" }} key="replace_target" label="Value to replace" style={{flexGrow: 1}} size="small" defaultValue={template.replace_target} name={"replace_target-" + index} onChange={onModify} />
      )
    case "set_value":
      return (
        <FormControl sx={{ m: "5px" }} size="small" style={{flexGrow: 1}} key="set_target">
          <InputLabel id="label-set_target">Field to set</InputLabel>
          <Select
            labelId="label-set_target"
            id="select-set_target"
            label="Field to set"
            defaultValue={template.set_target}
            name={"set_target-" + index}
            onChange={onModify}
          >
            <MenuItem value="name">Asset name</MenuItem>
            <MenuItem value="comp">Component name</MenuItem>
          </Select>
        </FormControl>
      )
  }
}

function Rule({index, template, onModify, id}) {
  const [ruleType, setRuleType] = useState(template.rule_type);
  
  return (
    <div className={styles.ruleContainer} key={index}>
      <div className={styles.ruleRow}>
      <FormControl sx={{ m: "5px", minWidth: 120 }} size="small">
        <InputLabel id="label-file_target_type">Target type</InputLabel>
        <Select
          labelId="label-file_target_type"
          id="select-file_target_type"
          label="Target type"
          defaultValue={template.file_target_type}
          name={"file_target_type-" + index}
          onChange={onModify}
        >
          <MenuItem value="entire_path">Entire path</MenuItem>
          <MenuItem value="directory">Directory</MenuItem>
          <MenuItem value="filename">Filename</MenuItem>
        </Select>
      </FormControl>
      <TextField sx={{ m: "5px", minWidth: 120 }} label="Target"
        defaultValue={template.file_target} size="small" style={{flexGrow: 1}}
        name={"file_target-" + index} onChange={onModify}
      />
      </div>
      <Divider />
      <TextField sx={{ m: "5px", minWidth: 120 }} label="Task"
        defaultValue={template.task} size="small" style={{flexGrow: 1}}
        name={"task-" + index} onChange={onModify}
      />
      <div className={styles.ruleRow}>
        <TextField sx={{ m: "5px", minWidth: 120 }} label="Asset name"
          defaultValue={template.name} size="small" style={{flexGrow: 1}}
          name={"name-" + index} onChange={onModify}
        />
        <TextField sx={{ m: "5px", minWidth: 120 }} label="Component name"
          defaultValue={template.comp} size="small" style={{flexGrow: 1}}
          name={"comp-" + index} onChange={onModify}
        />
      </div>
      <div className={styles.ruleRow}>
        <TextField sx={{ m: "5px", minWidth: 120 }} label="Rule"
          style={{flexGrow: 1}} size="small" defaultValue={template.rule}
          name={"rule-" + index} onChange={onModify}
        />
      </div>
      <div className={styles.ruleRow}>
        <TextField sx={{ m: "5px", minWidth: 120 }} label="Replace text"
          defaultValue={template.replace_target} size="small" style={{flexGrow: 1}}
          name={"replace_target-" + index} onChange={onModify}
        />
        <TextField sx={{ m: "5px", minWidth: 120 }} label="With"
          defaultValue={template.replace_value} size="small" style={{flexGrow: 1}}
          name={"replace_value-" + index} onChange={onModify}
        />
      </div>
      <div className={styles.connector} id={id} />
    </div>
  )
}

function Rules(props) {
  const updateXarrow = useXarrow();

  return (
    <div className={styles.container}>
      <Typography variant="h6">Ingest Rules</Typography>
      <DynamicList onAdd={() => props.onRulesChange(null, "add")} onScroll={updateXarrow} onRemove={() => props.onRulesChange(null, "remove", -1)}>
      {
        props.rules ? props.rules.map((child, index) => <Rule
          key={index} index={index} template={props.template} onModify={e => props.onRulesChange(e, "modify")} id={"rule-" + index}
        />) : null
      }
      </DynamicList>
    </div>
  )
}

export default Rules;
