import React, { useState, useEffect, useCallback } from 'react';
import styles from "./Rules.module.css";
import DynamicList from "../../components/DynamicList";
import { Rule } from "./Rule";
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import {useXarrow} from "react-xarrows";
import { Button, Divider } from '@mui/material';
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useDrag, useDrop } from 'react-dnd'
import IconButton from '@mui/material/IconButton';
import RemoveIcon from '@mui/icons-material/Remove';

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
            defaultValue={template.extract_target || ""}
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
            defaultValue={template.set_target || ""}
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

function RuleList(props) {
  const updateXarrow = useXarrow();
  const [, drop] = useDrop(() => ({ accept: "rule" }));
  const [tempRules, setTempRules] = useState({rules: [], reorder: false});

  useEffect(() => {
    let rules = [];
    props.rules.forEach((rule, index) => {
      rules.push({...rule, origIndex: index})
    })
    setTempRules({rules: rules, reorder: false});
  }, [props.rules]);

  useEffect(() => {
    if (!tempRules.reorder) return;
    props.setRules(tempRules.rules);
    setTempRules(prevState => ({...prevState, reorder: false}));
  }, [tempRules.reorder]);

  const moveRule = useCallback(
    (index, index2, dropped=false) => {
      if (dropped) {
        setTempRules(prevState => ({...prevState, reorder: true}));
      } else setTempRules(prevState => {
        const rules = [...prevState.rules];
        const ruleToMove = rules.splice(index, 1)[0];
        rules.splice(index2, 0, ruleToMove);
        return {rules: rules, reorder: false};
      })
    }, [tempRules])

  const renderRule = useCallback((rule, index) => {
    return(
      <Rule
        key={"rule-" + rule.origIndex}
        index={index}
        rule={rule}
        onRulesChange={props.onRulesChange}
        id={"rule-" + rule.origIndex}
        moveRule={moveRule}
      />)
  }, [])

  return (
    <DynamicList innerRef={drop} onAdd={() => props.onRulesChange(null, "add")} onScroll={updateXarrow} onRemove={() => props.onRulesChange(null, "remove", -1)}>
      {tempRules.rules ? tempRules.rules.map((rule, index) => renderRule(rule, index)) : null}
    </DynamicList>
  )
}

function Rules(props) {
  return (
    <div className={styles.container}>
      <Typography variant="h6">Ingest Rules</Typography>
      <DndProvider backend={HTML5Backend}>
        <RuleList {...props} />
      </DndProvider>
    </div>
  )
}

export default Rules;
