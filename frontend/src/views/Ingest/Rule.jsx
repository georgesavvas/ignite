// Copyright 2022 George Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, {memo, useRef, useState} from "react";

import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import { Button, Divider, IconButton, Switch } from "@mui/material";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import {useDrag, useDrop} from "react-dnd";
import ClearIcon from "@mui/icons-material/Clear";
import FormControlLabel from "@mui/material/FormControlLabel";

import styles from "./Rules.module.css";
import { useEffect } from "react";


export const Rule = props => {
  const [rule, setRule] = useState(props.rule || {});

  const ref = useRef(null);
  const index = props.index;
  const id = props.id;
  const origIndex = rule.origIndex;
  const [{ isDragging }, drag] = useDrag({
    type: "rule",
    item: () => {
      return { id, index, origIndex };
    },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });
  const [, drop] = useDrop(
    () => ({
      accept: "rule",
      collect(monitor) {
        return {
          handlerId: monitor.getHandlerId(),
        };
      },
      hover(item) {
        if (!ref.current) {
          return;
        }
        const dragIndex = item.origIndex;
        const hoverIndex = props.index;
        if (item.id === id) return;
        props.moveRule(dragIndex, hoverIndex);
        // const hoverBoundingRect = ref.current?.getBoundingClientRect();
      },
      drop(item) {
        if (!ref.current) {
          return;
        }
        props.moveRule(item.origIndex, index, true);
      }
    })
  );
  
  useEffect(() => {
    props.setRules(prev => {
      const existing = [...prev];
      existing[props.index] = rule;
      return existing;
    });
  }, [rule]);

  // const handleChanged = e => props.onRulesChange(e, "modify");
  const handleChanged = e => {
    const [field] = e.target.name.split("-");
    const value = e.target.type === "checkbox" ?
      e.target.checked : e.target.value;
    setRule(prevState => {
      const existing = {...prevState};
      existing[field] = value;
      return existing;
    });
  };

  const style = {
    backgroundColor: rule.colour,
    opacity: isDragging ? 0 : 1,
    overflow: "clip"
  };

  drag(drop(ref));

  return (
    <div ref={ref} className={styles.expand}>
      <div className={styles.ruleContainer} style={style}>
        <div className={styles.topBar}>
          <FormControlLabel 
            control={
              <Switch
                checked={rule.show_connections ?? true}
                name={"show_connections-" + origIndex}
                onChange={handleChanged}
                color="ignite"
              />
            }
            label="Show connections"
            labelPlacement="end"
          />
          <Typography variant="h6" style={{margin: "auto"}}>{"Rule " + (origIndex + 1)}</Typography>
          <IconButton
            className={styles.button}
            size="small"
            name="delete"
            onClick={e => props.onRulesChange(null, "remove", origIndex)}
            color="lightgrey"
          >
            <ClearIcon />
          </IconButton>
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
  );
};
