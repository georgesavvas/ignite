// Copyright 2023 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import ClearIcon from "@mui/icons-material/Clear";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useXarrow } from "react-xarrows";

import DataPlaceholder from "../../components/DataPlaceholder";
import DynamicList from "../../components/DynamicList";
import IgnTextField from "../../components/IgnTextField";
import Modal from "../../components/Modal";
import serverRequest from "../../services/serverRequest";
import { RuleType } from "./Ingest";
import { Rule } from "./Rule";
import styles from "./Rules.module.css";

interface RuleNameINputModalProps {
  onSubmit: (name: string) => void;
  open: boolean;
  onClose: () => void;
}

const RuleNameInputModal = ({ onSubmit, open, onClose }: RuleNameINputModalProps) => {
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
      onFormSubmit={handleSubmit}
      open={open}
      onClose={onClose}
      buttons={[
        <Button key="Confirm" type="submit">
          Create
        </Button>,
      ]}
    >
      <IgnTextField
        placeholder="Template Name"
        fullWidth
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </Modal>
  );
};

type RuleTemplateType = {
  name: string;
  data: RuleType;
};

interface RuleTemplatesProps {
  onTemplateSelect: (data: RuleTemplateType["data"]) => void;
  onSaveCurrent: (templateName: string) => void;
}

const RuleTemplates = (props: RuleTemplatesProps) => {
  const [templates, setTemplates] = useState<RuleTemplateType[]>([]);
  const [managerOpen, setManagerOpen] = useState(false);
  const [ruleNameInputModalOpen, setRuleNameInputModalOpen] = useState(false);
  const [ruleTemplateSelectOpen, setRuleTemplateSelectOpen] = useState(false);

  const getRuleTemplates = (fn?: () => void) => {
    serverRequest("get_rule_templates").then((resp) => {
      setTemplates(resp.data || []);
      if (fn) fn();
    });
  };

  const handleChange = (e) => {
    const value = e.target.value;
    const template = templates.filter((template) => template.name === value)[0];
    props.onTemplateSelect(template.data);
  };

  const handleSaveCurrent = (ruleTemplateName: string) => {
    props.onSaveCurrent(ruleTemplateName);
  };

  const handleRuleTemplateSelectOpen = () => {
    getRuleTemplates(() => setRuleTemplateSelectOpen(true));
  };

  const handleRemoveRule = (name: string) => {
    serverRequest("remove_rule_template", { data: name }).then((resp) => {
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
        {templates ? (
          templates.map((template, index) => (
            <div className={styles.manageRuleContainer} key={index}>
              <Typography>{template.name}</Typography>
              <IconButton onClick={() => handleRemoveRule(template.name)}>
                <ClearIcon style={{ color: "red" }} />
              </IconButton>
            </div>
          ))
        ) : (
          <DataPlaceholder text="No templates saved yet" style={{ position: "relative" }} />
        )}
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
            {templates
              ? templates.map((template, index) => (
                  <MenuItem value={template.name} data={template.data} key={index}>
                    {template.name}
                  </MenuItem>
                ))
              : null}
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={() => setManagerOpen(true)}>
          Manage
        </Button>
        <Button
          variant="outlined"
          style={{ minWidth: "130px" }}
          onClick={() => setRuleNameInputModalOpen(true)}
        >
          Save current
        </Button>
      </div>
    </>
  );
};

interface RuleListProps {
  rules: RuleType[];
  setRules: (rules: RuleType[]) => void;
  onRulesChange: () => void;
}

const RuleList = (props: RuleListProps) => {
  const updateXarrow = useXarrow();
  const [, drop] = useDrop(() => ({ accept: "rule" }));
  const [tempRules, setTempRules] = useState({ rules: [] as RuleType[], reorder: false });

  useEffect(() => {
    let rules = [] as RuleType[];
    props.rules.forEach((rule, index) => {
      rules.push({ ...rule, origIndex: index });
    });
    setTempRules({ rules: rules, reorder: false });
  }, [props.rules]);

  useEffect(() => {
    if (!tempRules.reorder) return;
    props.setRules(tempRules.rules);
    setTempRules((prevState) => ({ ...prevState, reorder: false }));
  }, [tempRules.reorder]);

  const moveRule = useCallback(
    (index: number, index2: number, dropped = false) => {
      if (dropped) {
        setTempRules((prevState) => ({ ...prevState, reorder: true }));
      } else
        setTempRules((prevState) => {
          const rules = [...prevState.rules];
          const ruleToMove = rules.splice(index, 1)[0];
          rules.splice(index2, 0, ruleToMove);
          return { rules: rules, reorder: false };
        });
    },
    [tempRules]
  );

  const renderRule = (rule: RuleType, index: number) => {
    return (
      <Rule
        key={"rule-" + rule.origIndex}
        index={index}
        rule={rule}
        onRuleChange={props.onRuleChange}
        id={"rule-" + rule.origIndex}
        moveRule={moveRule}
        setRules={props.setRules}
      />
    );
  };

  return (
    <DynamicList
      innerRef={drop}
      onAdd={() => props.onRulesChange(null, "add")}
      onScroll={updateXarrow}
      onRemove={() => props.onRulesChange(null, "remove", -1)}
    >
      {tempRules.rules ? tempRules.rules.map((rule, index) => renderRule(rule, index)) : null}
    </DynamicList>
  );
};

interface RulesProps {
  rules: RuleType[];
  onAddRules: (data: RuleTemplateType["data"]) => void;
  setRules: (rules: RuleType[]) => void;
  onRulesChange: () => void;
}

const Rules = (props: RulesProps) => {
  const handleTemplateSelect = (data: RuleTemplateType["data"]) => {
    props.onAddRules(data);
  };

  const handleSaveCurrent = (name: string) => {
    serverRequest("add_rule_template", { data: props.rules, name: name });
  };

  return (
    <div className={styles.container}>
      <Typography variant="h6">Ingest Rules</Typography>
      <RuleTemplates onTemplateSelect={handleTemplateSelect} onSaveCurrent={handleSaveCurrent} />
      <DndProvider backend={HTML5Backend}>
        <RuleList {...props} />
      </DndProvider>
    </div>
  );
};

export default Rules;
