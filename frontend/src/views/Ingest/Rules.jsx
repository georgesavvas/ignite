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


import React, { useState, useEffect, useCallback } from "react";

import Typography from "@mui/material/Typography";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import {useXarrow} from "react-xarrows";
import Button from "@mui/material/Button";
import {DndProvider} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";
import {useDrop} from "react-dnd";
import IconButton from "@mui/material/IconButton";
import ClearIcon from "@mui/icons-material/Clear";

import serverRequest from "../../services/serverRequest";
import DataPlaceholder from "../../components/DataPlaceholder";
import Modal from "../../components/Modal";
import styles from "./Rules.module.css";
import DynamicList from "../../components/DynamicList";
import {Rule} from "./Rule";


const RuleNameInputModal = ({onSubmit, open, onClose}) => {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    onSubmit(name);
    onClose();
    setName("");
  };

  return (
    <Modal
      maxWidth="sm"
      title="Rule template name"
      onSubmit={handleSubmit}
      open={open}
      onClose={onClose}
      buttons={[<Button key="Confirm" type="submit">Create</Button>]}
    >
      <TextField fullWidth value={name} onChange={e => setName(e.target.value)} />
    </Modal>
  );
};

const RuleTemplates = props => {
  const [templates, setTemplates] = useState([]);
  const [managerOpen, setManagerOpen] = useState(false);
  const [ruleNameInputModalOpen, setRuleNameInputModalOpen] = useState(false);
  const [ruleTemplateSelectOpen, setRuleTemplateSelectOpen] = useState(false);

  const getRuleTemplates = (fn=undefined) => {
    serverRequest("get_rule_templates").then(resp => {
      setTemplates(resp.data || []);
      if (fn) fn();
    });
  };

  const handleChange = e => {
    const value = e.target.value;
    const template = templates.filter(template => template.name === value)[0];
    props.onTemplateSelect(template.data);
  };

  const handleSaveCurrent = ruleTemplateName => {
    props.onSaveCurrent(ruleTemplateName);
  };

  const handleRuleTemplateSelectOpen = () => {
    getRuleTemplates(setRuleTemplateSelectOpen(true));
  };

  const handleRemoveRule = name => {
    serverRequest("remove_rule_template", {data: name}).then(resp => {
      setTemplates(resp.data);
    });
  };

  return (
    <>
      <RuleNameInputModal
        open={ruleNameInputModalOpen}
        onClose={() => setRuleNameInputModalOpen(false)}
        onSubmit={handleSaveCurrent}
      />
      <Modal
        maxWidth="xs"
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        title="Manage rule templates"
      >
        {templates ? templates.map((template, index) => 
          <div className={styles.manageRuleContainer} key={index}>
            <Typography>{template.name}</Typography>
            <IconButton onClick={() => handleRemoveRule(template.name)}>
              <ClearIcon style={{color: "red"}} />
            </IconButton>
          </div>
        ) : <DataPlaceholder text="No templates saved yet" style={{position: "relative"}} />}
      </Modal>
      <div className={styles.ruleTemplatesBar}>
        <FormControl sx={{ m: 1, minWidth: 250 }} size="small">
          <InputLabel id="rules-select-label">Templates...</InputLabel>
          <Select
            labelId="rules-label"
            id="rules-select"
            value={""}
            open={ruleTemplateSelectOpen}
            onClose={() => setRuleTemplateSelectOpen(false)}
            label="Templates..."
            placeholder="Templates..."
            onOpen={handleRuleTemplateSelectOpen}
            onChange={handleChange}
          >
            {templates ? templates.map((template, index) => 
              <MenuItem
                value={template.name}
                data={template.data}
                key={index}
              >
                {template.name}
              </MenuItem>
            ) : null}
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={() => setManagerOpen(true)}>Manage</Button>
        <Button variant="outlined" onClick={() => setRuleNameInputModalOpen(true)}>Save current</Button>
      </div>
    </>
  );
};

function RuleList(props) {
  const updateXarrow = useXarrow();
  const [, drop] = useDrop(() => ({ accept: "rule" }));
  const [tempRules, setTempRules] = useState({rules: [], reorder: false});

  useEffect(() => {
    let rules = [];
    props.rules.forEach((rule, index) => {
      rules.push({...rule, origIndex: index});
    });
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
      });
    }, [tempRules]);

  const renderRule = useCallback((rule, index) => {
    return(
      <Rule
        key={"rule-" + rule.origIndex}
        index={index}
        rule={rule}
        onRulesChange={props.onRulesChange}
        id={"rule-" + rule.origIndex}
        moveRule={moveRule}
      />);
  }, []);

  return (
    <DynamicList innerRef={drop} onAdd={() => props.onRulesChange(null, "add")} onScroll={updateXarrow} onRemove={() => props.onRulesChange(null, "remove", -1)}>
      {tempRules.rules ? tempRules.rules.map((rule, index) => renderRule(rule, index)) : null}
    </DynamicList>
  );
}

function Rules(props) {

  const handleTemplateSelect = data => {
    props.onAddRules(data);
  };

  const handleSaveCurrent = name => {
    serverRequest("add_rule_template", {data: props.rules, name: name});
  };

  return (
    <div className={styles.container}>
      <Typography variant="h6">Ingest Rules</Typography>
      <RuleTemplates
        onTemplateSelect={handleTemplateSelect}
        onSaveCurrent={handleSaveCurrent}
      />
      <DndProvider backend={HTML5Backend}>
        <RuleList {...props} />
      </DndProvider>
    </div>
  );
}

export default Rules;
