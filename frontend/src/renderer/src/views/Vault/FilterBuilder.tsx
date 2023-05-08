// @ts-nocheck

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
import DeleteIcon from "@mui/icons-material/Delete";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { InputChangeEvent } from "@renderer/types/common";
import { useEffect, useRef, useState } from "react";

import DataPlaceholder from "../../components/DataPlaceholder";
import IgnButton from "../../components/IgnButton";
import Modal from "../../components/Modal";
import serverRequest from "../../services/serverRequest";
import styles from "./FilterBuilder.module.css";

const fields = [
  { label: "", value: "filter_string" },
  { label: "Name", value: "name" },
  { label: "Tags", value: "tags.ARRAY." },
  { label: "Project", value: "project" },
  { label: "Component name", value: "components.ARRAY.name" },
];

const getFieldFromValue = (value: string) => {
  if (!value) return fields[0];
  return fields.filter((f) => f.value === value)[0];
};

interface PlaceholderProps {
  filter?: boolean;
  name: string;
  onChange: (name: string, field: string, value: string) => void;
  disableDelete?: boolean;
}

const Placeholder = (props: PlaceholderProps) => {
  return (
    <div className={styles.placeholderContainer}>
      <div className={styles.placeholderOption}>
        {
          props.filter ? (
            <Tooltip title="Create group around filter">
              <GroupWorkIcon
                className={styles.icon}
                onClick={() => props.onChange(props.name, "group_filter", "")}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Insert filter">
              <FilterAltOutlinedIcon
                className={styles.icon}
                onClick={() => props.onChange(props.name, "insert_filter", "")}
              />
            </Tooltip>
          )
          // <GroupWorkIcon className={styles.icon} onClick={() => props.onChange(props.name, "insert_group", "")} />
        }
      </div>
      <Divider />
      <div className={styles.placeholderOption}>
        <Tooltip title={`Delete ${props.filter ? "filter" : "group"}`}>
          {props.disableDelete ? (
            <DeleteIcon style={{ color: "rgb(50, 50, 50)" }} />
          ) : (
            <DeleteIcon
              className={styles.icon}
              onClick={() => props.onChange(props.name, "delete", "")}
            />
          )}
        </Tooltip>
        {/* {
          props.filter ?
          <DeleteIcon className={styles.icon} onClick={() => props.onChange(props.name, "delete", "")} /> :
          <FilterAltOutlinedIcon className={styles.icon} onClick={() => props.onChange(props.name, "insert_filter", "")} />
        } */}
      </div>
    </div>
  );
};

interface FilterProps {
  field: string;
  name: string;
  value: string;
  onChange: (name: string, field: string, value: string) => void;
}

const Filter = (props: FilterProps) => {
  return (
    <div className={styles.filterContainer}>
      <div className={styles.fieldsContainer}>
        <Autocomplete
          id="combo-box-demo"
          options={fields}
          getOptionLabel={(option) => option.label}
          sx={{ width: "100%" }}
          value={getFieldFromValue(props.field)}
          onChange={(_, value) => props.onChange(props.name, "key", value ? value.value : "")}
          renderInput={(params) => <TextField {...params} placeholder="Everything" size="small" />}
        />
        <TextField
          size="small"
          placeholder="Value"
          value={props.value}
          onChange={(e) => props.onChange(props.name, "value", e.target.value)}
        />
      </div>
      <Placeholder filter {...props} />
    </div>
  );
};

interface GroupProps {
  name: string;
  condition: string;
  children: React.ReactNode[];
  onChange: (name: string, field: string, value: string) => void;
}

const Group = (props: GroupProps) => {
  const level = props.name.split(props.condition).length - 1;
  const style = {
    backgroundColor:
      props.condition === "and"
        ? `hsl(120, 40%, ${20 - level * 4}%)`
        : `hsl(240, 40%, ${20 - level * 4}%)`,
  };

  return (
    <div className={styles.groupContainer} style={style}>
      {props.children}
      <Placeholder disableDelete={!props.name.includes("-")} {...props} />
      <ToggleButtonGroup
        value={props.condition}
        onChange={(_, value) => props.onChange(props.name, "condition", value)}
        size="small"
        color="success"
        orientation="vertical"
        style={{ height: "100%" }}
      >
        <ToggleButton value="and">AND</ToggleButton>
        <ToggleButton value="or">OR</ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
};

const validateExpression = (expr: string) => {
  try {
    JSON.parse(expr);
    return true;
  } catch (error) {
    return;
  }
};

interface TemplateNameInputModalProps {
  onSubmit: (name: string) => void;
  open: boolean;
  onClose: () => void;
}

const TemplateNameInputModal = ({ onSubmit, open, onClose }: TemplateNameInputModalProps) => {
  const [name, setName] = useState("");
  const textfieldRef = useRef();

  const handleSubmit = () => {
    onSubmit(name);
    onClose();
    setName("");
  };

  return (
    <Modal
      maxWidth="xs"
      title="Filter template name"
      onFormSubmit={handleSubmit}
      open={open}
      onClose={onClose}
      buttons={[
        <IgnButton key="create" type="submit">
          Confirm
        </IgnButton>,
      ]}
      focusRef={textfieldRef}
    >
      <TextField
        fullWidth
        value={name}
        onChange={(e) => setName(e.target.value)}
        size="small"
        autoFocus
        label="Filter name"
        inputRef={textfieldRef}
      />
    </Modal>
  );
};

const safeJsonParse = (data: string) => {
  try {
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

const defaultExpr = '{ "condition": "and", "filters": [{ "": "" }, { "": "" }]}';

export type ExpressionType = {
  condition?: "and" | "or";
  filters?: ExpressionType[];
};

type TemplateType = {
  name: string;
  data: any;
};

interface FilterBuilderProps {
  default: string;
  expression?: ExpressionType;
  onChange: (expression: ExpressionType) => void;
}

export const FilterBuilder = (props: FilterBuilderProps) => {
  const [expression, setExpression] = useState(props.default);
  const [isValid, setIsValid] = useState(true);
  const [showExpr, setShowExpr] = useState(false);
  const [templates, setTemplates] = useState<TemplateType[]>([]);
  const [managerOpen, setManagerOpen] = useState(false);
  const [templateNameInputModalOpen, setTemplateNameInputModalOpen] = useState(false);
  const [templateSelectOpen, setTemplateSelectOpen] = useState(false);

  useEffect(() => {
    if (!isValid) return;
    props.onChange(safeJsonParse(expression));
  }, [expression]);

  useEffect(() => {
    setExpression(props.default);
  }, [props.expression]);

  const handleExpressionChange = (e: InputChangeEvent) => {
    const value = e.target.value;
    if (validateExpression(value)) setIsValid(true);
    else setIsValid(false);
    setExpression(value);
  };

  const findGroupOrFilter = (expr: ExpressionType, name: string) => {
    const indices = name.split("-");
    const amount = indices.length;
    let parent = {};
    let parent_index = 0;
    const block = indices.reduce((previous, current, index) => {
      const nameIndex = parseInt(current);
      if (!index && !Array.isArray(previous)) return previous;
      const block = Array.isArray(previous) ? previous : previous.filters;
      if (index === amount - 1) {
        parent = previous;
        parent_index = nameIndex;
      }
      if (!block) return previous;
      return block[nameIndex];
    }, expr);
    return [block, parent, parent_index];
  };

  const getTemplates = (fn?: () => void) => {
    serverRequest("get_filter_templates").then((resp) => {
      setTemplates(resp.data || []);
      if (fn) fn();
    });
  };

  const handleTemplateChange = (e: InputChangeEvent) => {
    const value = e.target.value;
    const template = templates.filter((template) => template.name === value)[0];
    setExpression(template.data);
  };

  const handleSaveCurrent = (name: string) => {
    serverRequest("add_filter_template", { data: expression, name: name });
  };

  const handleTemplateSelectOpen = () => {
    getTemplates(() => setTemplateSelectOpen(true));
  };

  const handleManagerOpen = () => {
    getTemplates(() => setManagerOpen(true));
  };

  const handleRemoveTemplate = (name: string) => {
    serverRequest("remove_filter_template", { data: name }).then((resp) => {
      setTemplates(resp.data);
    });
  };

  const handleChange = (name: string, change: string, value: string) => {
    setExpression((prevState) => {
      const expr = JSON.parse(prevState);
      const [block, parent, index] = findGroupOrFilter(expr, name) as [
        ExpressionType,
        ExpressionType,
        number
      ];
      const key = Object.keys(block)[0] as keyof typeof block;
      switch (change) {
        case "value":
          block[key] = value;
          break;
        case "condition":
          block["condition"] = value as "and" | "or";
          break;
        case "key":
          block[value] = block[key];
          delete block[key];
          break;
        case "insert_group":
          block.filters.push({ condition: "and", filters: [{ "": "" }] });
          break;
        case "insert_filter":
          block.filters.push({ "": "" });
          break;
        case "delete":
          if (!parent.filters) {
            console.log(name, "parent has no filter", parent);
            break;
          } else if (block.condition) {
            parent.filters.splice(index, 1);
            parent.filters = parent.filters.concat(block.filters);
            break;
          } else if (parent.filters.length > 1) {
            parent.filters.splice(index, 1);
            break;
          } else {
            // parent.filters.push(block.filters);
            console.log("nope can't");
            break;
          }
        case "group_filter":
          parent.filters[index] = { condition: "and", filters: [block] };
          break;
      }
      return JSON.stringify(expr);
    });
  };

  const renderFilters = (expr: string, prefix: string, disableDelete = true) => {
    if (Array.isArray(expr)) {
      return expr.map((f, i) => renderFilters(f, `${prefix}-${i}`, disableDelete));
    } else if (expr.condition) {
      const prefix_safe = prefix ? prefix + expr.condition : `0${expr.condition}`;
      const singleChild = expr.filters.length === 1;
      return (
        <Group
          key={prefix_safe}
          name={prefix_safe}
          condition={expr.condition}
          onChange={handleChange}
        >
          {renderFilters(expr.filters, `${prefix_safe}`, singleChild)}
        </Group>
      );
    } else {
      const filterData = Object.entries(expr);
      const [field, value] = filterData.length ? filterData[0] : ["", ""];
      return (
        <Filter
          key={prefix}
          name={prefix}
          field={field}
          value={value}
          onChange={handleChange}
          disableDelete={disableDelete}
        />
      );
    }
  };

  return (
    <div className={styles.container}>
      <TemplateNameInputModal
        open={templateNameInputModalOpen}
        onClose={() => setTemplateNameInputModalOpen(false)}
        onSubmit={handleSaveCurrent}
        buttons={[
          <IgnButton key="create" type="submit">
            Confirm
          </IgnButton>,
        ]}
      />
      <Modal
        maxWidth="xs"
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        title="Manage filter templates"
      >
        {templates.length ? (
          templates.map((template, index) => (
            <div className={styles.manageTemplatesContainer} key={index}>
              <Typography>{template.name}</Typography>
              <IconButton onClick={() => handleRemoveTemplate(template.name)}>
                <ClearIcon style={{ color: "red" }} />
              </IconButton>
            </div>
          ))
        ) : (
          <DataPlaceholder text="No filters saved yet" style={{ position: "relative" }} />
        )}
      </Modal>
      <div className={styles.topBar}>
        <Button variant="outlined" onClick={() => setExpression(defaultExpr)}>
          Reset Filters
        </Button>
        <FormControlLabel
          control={<Switch color="primary" onChange={(e) => setShowExpr(e.target.checked)} />}
          label="Show expression"
          labelPlacement="start"
          // style={{minWidth: "200px"}}
        />
        <FormControl sx={{ m: 1, minWidth: 250 }} size="small">
          <InputLabel id="template-select-label">Templates...</InputLabel>
          <Select
            labelId="template-label"
            id="template-select"
            value=""
            open={templateSelectOpen}
            onClose={() => setTemplateSelectOpen(false)}
            label="Templates..."
            placeholder="Templates..."
            onOpen={handleTemplateSelectOpen}
            onChange={handleTemplateChange}
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
        <Button variant="outlined" onClick={handleManagerOpen}>
          Manage
        </Button>
        <Button variant="outlined" onClick={() => setTemplateNameInputModalOpen(true)}>
          Save current
        </Button>
      </div>
      {showExpr ? (
        <TextField
          fullWidth
          placeholder="Filter expression"
          size="small"
          multiline
          value={expression}
          onChange={handleExpressionChange}
          color={isValid ? "success" : "error"}
        />
      ) : null}
      <div className={styles.filtersContainer}>
        {isValid ? renderFilters(safeJsonParse(expression), "") : null}
      </div>
    </div>
  );
};

export default FilterBuilder;
