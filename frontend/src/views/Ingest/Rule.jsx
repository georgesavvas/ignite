import React, { useState, memo, useRef } from 'react';
import styles from "./Rules.module.css";
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { Button, Divider } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { useDrag, useDrop } from 'react-dnd'

export const Rule = memo(function Rule(props) {
  const ref = useRef(null)
  const index = props.index;
  const rule = props.rule;
  const id = props.id;
  const origIndex = rule.origIndex;
  const [{ isDragging }, drag] = useDrag({
    type: "rule",
    item: () => {
      return { id, index, origIndex }
    },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  })
  const [{ handlerId }, drop] = useDrop(
    () => ({
      accept: "rule",
      collect(monitor) {
        return {
          handlerId: monitor.getHandlerId(),
        }
      },
      hover(item, monitor) {
        if (!ref.current) {
          return
        }
        const dragIndex = item.origIndex;
        const hoverIndex = props.index;
        if (item.id === id) return;
        props.moveRule(dragIndex, hoverIndex);
        // const hoverBoundingRect = ref.current?.getBoundingClientRect();
      },
      drop(item, monitor) {
        if (!ref.current) {
          return;
        }
        props.moveRule(item.origIndex, index, true);
      }
    })
  )
  
  const handleChanged = e => props.onRulesChange(e, "modify");

  const style = {
    backgroundColor: rule.colour,
    opacity: isDragging ? 0 : 1,
    // border: isDragging ? "solid red 2px" : "none"
  }

  drag(drop(ref));

  return (
    <div ref={ref} className={styles.expand}>
      <div className={styles.ruleContainer} style={style}>
        <div className={styles.topBar}>
          <Typography variant="h6" style={{margin: "auto"}}>{"Rule " + (origIndex + 1)}</Typography>
          <Button className={styles.button}
            onClick={e => props.onRulesChange(e, "remove", origIndex)} color="lightgrey"
          >Remove</Button>
        </div>
        <div className={styles.ruleRow}>
        <FormControl sx={{ m: "5px", minWidth: 120 }} size="small">
          <InputLabel id="label-file_target_type">Target type</InputLabel>
          <Select
            labelId="label-file_target_type"
            id="select-file_target_type"
            label="Target type"
            value={rule.file_target_type || "filename"}
            name={"file_target_type-" + origIndex}
            onChange={handleChanged}
          >
            <MenuItem value="entire_path">Entire path</MenuItem>
            <MenuItem value="directory">Directory</MenuItem>
            <MenuItem value="filename">Filename</MenuItem>
          </Select>
        </FormControl>
        <TextField sx={{ m: "5px", minWidth: 120 }} label="Target"
          value={rule.file_target || ""} size="small" style={{flexGrow: 1}}
          name={"file_target-" + origIndex} onChange={handleChanged}
        />
        </div>
        <Divider />
        <TextField sx={{ m: "5px", minWidth: 120 }} label="Filepath structure"
          style={{flexGrow: 1}} size="small" value={rule.rule || ""}
          name={"rule-" + origIndex} onChange={handleChanged}
        />
        <TextField sx={{ m: "5px", minWidth: 120 }} label="Task"
          value={rule.task || ""} size="small" style={{flexGrow: 1}}
          name={"task-" + origIndex} onChange={handleChanged}
        />
        <div className={styles.ruleRow}>
          <TextField sx={{ m: "5px", minWidth: 120 }} label="Asset name"
            value={rule.name || ""} size="small" style={{flexGrow: 1}}
            name={"name-" + origIndex} onChange={handleChanged}
          />
          <TextField sx={{ m: "5px", minWidth: 120 }} label="Component name"
            value={rule.comp || ""} size="small" style={{flexGrow: 1}}
            name={"comp-" + origIndex} onChange={handleChanged}
          />
        </div>
        <div className={styles.ruleRow}>
          <TextField sx={{ m: "5px", minWidth: 120 }} label="Replace text"
            value={rule.replace_target || ""} size="small" style={{flexGrow: 1}}
            name={"replace_target-" + origIndex} onChange={handleChanged}
          />
          <TextField sx={{ m: "5px", minWidth: 120 }} label="With"
            value={rule.replace_value || ""} size="small" style={{flexGrow: 1}}
            name={"replace_value-" + origIndex} onChange={handleChanged}
          />
        </div>
        <div className={styles.connector} id={id} />
      </div>
    </div>
  )
})
