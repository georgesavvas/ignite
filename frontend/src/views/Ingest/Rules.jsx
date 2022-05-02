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
import { Button, Divider } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
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

function Rule({index, rule, onRulesChange, id}) {
  const handleChanged = e => onRulesChange(e, "modify");

  const style = {
    backgroundColor: rule.colour
  }

  return (
    <Draggable draggableId={id} index={index}>
      {provided => (
        <div className={styles.expand} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
          <div className={styles.ruleContainer} style={style}>
            <div className={styles.topBar}>
              <Typography variant="h6" style={{margin: "auto"}}>{"Rule " + (index + 1)}</Typography>
              <Button className={styles.button}
                onClick={e => onRulesChange(e, "remove", index)} color="lightgrey"
              >Remove</Button>
            </div>
            <div className={styles.ruleRow}>
            <FormControl sx={{ m: "5px", minWidth: 120 }} size="small">
              <InputLabel id="label-file_target_type">Target type</InputLabel>
              <Select
                labelId="label-file_target_type"
                id="select-file_target_type"
                label="Target type"
                value={rule.file_target_type}
                name={"file_target_type-" + index}
                onChange={handleChanged}
              >
                <MenuItem value="entire_path">Entire path</MenuItem>
                <MenuItem value="directory">Directory</MenuItem>
                <MenuItem value="filename">Filename</MenuItem>
              </Select>
            </FormControl>
            <TextField sx={{ m: "5px", minWidth: 120 }} label="Target"
              value={rule.file_target} size="small" style={{flexGrow: 1}}
              name={"file_target-" + index} onChange={handleChanged}
            />
            </div>
            <Divider />
            <TextField sx={{ m: "5px", minWidth: 120 }} label="Filepath structure"
              style={{flexGrow: 1}} size="small" value={rule.rule}
              name={"rule-" + index} onChange={handleChanged}
            />
            <TextField sx={{ m: "5px", minWidth: 120 }} label="Task"
              value={rule.task} size="small" style={{flexGrow: 1}}
              name={"task-" + index} onChange={handleChanged}
            />
            <div className={styles.ruleRow}>
              <TextField sx={{ m: "5px", minWidth: 120 }} label="Asset name"
                value={rule.name} size="small" style={{flexGrow: 1}}
                name={"name-" + index} onChange={handleChanged}
              />
              <TextField sx={{ m: "5px", minWidth: 120 }} label="Component name"
                value={rule.comp} size="small" style={{flexGrow: 1}}
                name={"comp-" + index} onChange={handleChanged}
              />
            </div>
            <div className={styles.ruleRow}>
              <TextField sx={{ m: "5px", minWidth: 120 }} label="Replace text"
                value={rule.replace_target} size="small" style={{flexGrow: 1}}
                name={"replace_target-" + index} onChange={handleChanged}
              />
              <TextField sx={{ m: "5px", minWidth: 120 }} label="With"
                value={rule.replace_value} size="small" style={{flexGrow: 1}}
                name={"replace_value-" + index} onChange={handleChanged}
              />
            </div>
            <div className={styles.connector} id={id} />
          </div>
        </div>
      )}
    </Draggable>
  )
}

const RuleList = React.memo(function RuleList(props) {
  const updateXarrow = useXarrow();

  return <DynamicList innerRef={props.innerRef} onAdd={() => props.onRulesChange(null, "add")} onScroll={updateXarrow} onRemove={() => props.onRulesChange(null, "remove", -1)}>
    {
      props.rules ? props.rules.map((rule, index) => <Rule
        key={"rule-" + index} index={index} template={props.template} rule={rule} onRulesChange={props.onRulesChange} id={"rule-" + index}
      />) : null
    }
  </DynamicList>
});

function Rules(props) {

  function onDragEnd(result) {
    if (!result.destination) {
      props.setLoading(false);
      return;
    }

    if (result.destination.index === result.source.index) {
      props.setLoading(false);
      return;
    }

    props.onRulesChange(null, "swap", result.source.index, result.destination.index);
  }

  return (
    <div className={styles.container}>
      <Typography variant="h6">Ingest Rules</Typography>
      <DragDropContext onBeforeCapture={() => props.setLoading(true)} onDragEnd={onDragEnd}>
        <Droppable droppableId={"rules-" + props.rules.length}>
          {provided => (
            <RuleList {...props} innerRef={provided.innerRef} {...provided.droppableProps}>
              {provided.placeholder}
            </RuleList>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}

export default Rules;
