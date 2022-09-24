import React, { useState, useEffect } from 'react'
import styles from "./FilterBuilder.module.css"
import { Divider, IconButton, TextField, Typography, Button } from "@mui/material"
import GroupWorkIcon from '@mui/icons-material/GroupWork'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import DeleteIcon from '@mui/icons-material/Delete'
import Autocomplete from '@mui/material/Autocomplete'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import Tooltip from '@mui/material/Tooltip'
import serverRequest from '../../services/serverRequest'
import Modal from '../../components/Modal'
import ClearIcon from '@mui/icons-material/Clear'

const fields = [
  {label: "", value: "filter_string"},
  {label: "ID", value: "id"},
  {label: "Name", value: "name"},
  {label: "Description", value: "description"},
  {label: "Tags", value: "tags.ARRAY."},
  {label: "Project", value: "project"},
  {label: "Component name", value: "components.ARRAY.name"},
  {label: "Component source", value: "components.ARRAY.source"},
  {label: "Component filepath", value: "components.ARRAY.file"}
]

const getFieldFromValue = value => {
  if (!value) return fields[0]
  return fields.filter(f => f.value === value)[0]
}

const Placeholder = props => {

  // const style = {
  //   flexDirection: props.filter ? "column" : "row"
  // }

  return (
    <div className={styles.placeholderContainer}>
      <div className={styles.placeholderOption}>
        {
          props.filter ?
          <Tooltip title="Create group around filter">
            <GroupWorkIcon className={styles.icon} onClick={() => props.onChange(props.name, "group_filter", "")} />
          </Tooltip> :
          <Tooltip title="Insert filter">
            <FilterAltOutlinedIcon className={styles.icon} onClick={() => props.onChange(props.name, "insert_filter", "")} />
          </Tooltip>
          // <GroupWorkIcon className={styles.icon} onClick={() => props.onChange(props.name, "insert_group", "")} />
        }
      </div>
      <Divider />
      <div className={styles.placeholderOption}>
        <Tooltip title={`Delete ${props.filter ? "filter": "group"}`}>
          {
            props.disableDelete ?
            <DeleteIcon style={{color: "rgb(50, 50, 50)"}} /> :
            <DeleteIcon className={styles.icon} onClick={() => props.onChange(props.name, "delete", "")} />
          }
        </Tooltip>
        {/* {
          props.filter ?
          <DeleteIcon className={styles.icon} onClick={() => props.onChange(props.name, "delete", "")} /> :
          <FilterAltOutlinedIcon className={styles.icon} onClick={() => props.onChange(props.name, "insert_filter", "")} />
        } */}
      </div>
    </div>
  )
}

const Filter = props => {
  return (
    <div className={styles.filterContainer}>
      <div className={styles.fieldsContainer}>
        <Autocomplete
          id="combo-box-demo"
          options={fields}
          getOptionLabel={option => option.label}
          sx={{ width: "100%" }}
          value={getFieldFromValue(props.field)}
          onChange={(_, value) => props.onChange(props.name, "key", value ? value.value : "")}
          renderInput={params =>
            <TextField
              {...params}
              placeholder="Everything"
              size="small"
            />
          }
        />
        <TextField
          size="small"
          placeholder="Value"
          value={props.value}
          onChange={e => props.onChange(props.name, "value", e.target.value)}
        />
      </div>
      <Placeholder filter {...props} />
    </div>
  )
}

const Condition = props => {
  const [value, setValue] = useState("and")

  return (
    <div className={styles.conditionContainer}>
      <ToggleButtonGroup
        value={value}
        onChange={e => setValue(e.target.value)}
        size="small"
        color="success"
        orientation="vertical"
      >
        <ToggleButton value="and">AND</ToggleButton>
        <ToggleButton value="or">OR</ToggleButton>
      </ToggleButtonGroup>
    </div>
  )
}

const Group = props => {

  const level = props.name.split(props.condition).length - 1
  const style = {
    backgroundColor: props.condition === "and" ? `hsl(120, 40%, ${20 - level * 4}%)` : `hsl(240, 40%, ${20 - level * 4}%)`
  }

  return (
    <div className={styles.groupContainer} style={style}>
      {props.children}
      <Placeholder disableDelete={!props.name.includes("-")} {...props} />
      <ToggleButtonGroup
        value={props.condition}
        onChange={e => props.onChange(props.name, "condition", e.target.value)}
        size="small"
        color="success"
        orientation="vertical"
        style={{height: "100%"}}
      >
        <ToggleButton value="and">AND</ToggleButton>
        <ToggleButton value="or">OR</ToggleButton>
      </ToggleButtonGroup>
    </div>
  )
}

const openStyle = {
  // height: "100%",
  minHeight: "fit-content",
  maxHeight: "500px"
}

const closedStyle = {
  minHeight: 0,
  maxHeight: 0
}

const validateExpression = expr => {
  try {
    JSON.parse(expr)
    return true
  } catch (error) {
    return
  }
}

const TemplateNameInputModal = ({onSubmit, open, onClose}) => {
  const [name, setName] = useState("")

  const handleSubmit = () => {
    onSubmit(name)
    onClose()
    setName("")
  }

  return (
    <Modal
      maxWidth="sm"
      title="Filter template name"
      buttonLabel="Submit"
      onButtonClicked={handleSubmit}
      open={open}
      onClose={onClose}
    >
      <TextField fullWidth value={name} onChange={e => setName(e.target.value)} />
    </Modal>
  )
}

const safeJsonParse = data => {
  try {
    return JSON.parse(data)
  } catch (error) {
    return {}
  }
}

const defaultExpr = '{ "condition": "and", "filters": [{ "": "" }, { "": "" }]}'

export default function FilterBuilder(props) {
  const [expression, setExpression] = useState(props.default)
  const [isValid, setIsValid] = useState(true)
  const [showExpr, setShowExpr] = useState(false)
  const [templates, setTemplates] = useState([])
  const [managerOpen, setManagerOpen] = useState(false)
  const [templateNameInputModalOpen, setTemplateNameInputModalOpen] = useState(false)
  const [templateSelectOpen, setTemplateSelectOpen] = useState(false)

  useEffect(() => {
    if (!isValid) return
    props.onChange(safeJsonParse(expression))
  }, [expression])

  useEffect(() => {
    setExpression(props.default)
  }, [props.expression])

  const handleExpressionChange = e => {
    const value = e.target.value
    if (validateExpression(value)) setIsValid(true)
    else setIsValid(false)
    setExpression(value)
  }

  const findGroupOrFilter = (expr, name) => {
    const indices = name.split("-")
    const amount = indices.length
    let parent = {}
    let parent_index = 0
    const block = indices.reduce((previous, current, index) => {
      const nameIndex = parseInt(current)
      if (!index && !Array.isArray(previous)) return previous
      const block = Array.isArray(previous) ? previous : previous.filters
      if (index === amount - 1) {
        parent = previous
        parent_index = nameIndex
      }
      return(block[nameIndex])
    }, expr)
    return [block, parent, parent_index]
  }

  const getTemplates = (fn=undefined) => {
    serverRequest("get_filter_templates").then(resp => {
      setTemplates(resp.data || [])
      if (fn) fn()
    })
  }

  const handleTemplateChange = e => {
    const value = e.target.value
    const template = templates.filter(template => template.name === value)[0]
    setExpression(template.data)
  }

  const handleSaveCurrent = name => {
    serverRequest("add_filter_template", {data: expression, name: name})
  }

  const handleTemplateSelectOpen = () => {
    getTemplates(setTemplateSelectOpen(true))
  }

  const handleManagerOpen = () => {
    getTemplates(setManagerOpen(true))
  }

  const handleRemoveTemplate = name => {
    serverRequest("remove_filter_template", {data: name}).then(resp => {
      setTemplates(resp.data)
    })
  }

  const handleChange = (name, change, value) => {
    setExpression(prevState => {
      const expr = JSON.parse(prevState)
      const [block, parent, index] = findGroupOrFilter(expr, name)
      const key = Object.keys(block)[0]
      switch (change) {
        case "value": block[key] = value; break
        case "condition": block["condition"] = value; break
        case "key": 
          block[value] = block[key]
          delete block[key]
          break;
        case "insert_group": block.filters.push({condition: "and", filters: [{"": ""}]}); break
        case "insert_filter": block.filters.push({"": ""}); break
        case "delete":
          if (!parent.filters) {console.log(name, "parent has no filter", parent); break}
          else if (block.condition) {
            parent.filters.splice(index, 1)
            parent.filters = parent.filters.concat(block.filters)
            break;
          }
          else if (parent.filters.length > 1) {
            parent.filters.splice(index, 1)
            break;
          }
          else {
            // parent.filters.push(block.filters);
            console.log("nope can't")
            break
          }
        case "group_filter": parent.filters[index] = {condition: "and", filters: [block]}; break
      }
      return JSON.stringify(expr)
    })
  }

  const renderFilters = (expr, preffix, disableDelete=true) => {
    if (Array.isArray(expr)) {
      return (
        expr.map((f, i) => renderFilters(f, `${preffix}-${i}`, disableDelete))
      )
    } else if (expr.condition) {
      const preffix_safe = preffix ? preffix + expr.condition : `0${expr.condition}`
      const singleChild = expr.filters.length === 1
      return (
        <Group key={preffix_safe} name={preffix_safe} condition={expr.condition} onChange={handleChange}>
          {renderFilters(expr.filters, `${preffix_safe}`, singleChild)}
        </Group>
      )
    } else {
      const filterData = Object.entries(expr)
      const [field, value] = filterData.length ? filterData[0] : ["", ""]
      return (
        <Filter
          key={preffix}
          name={preffix}
          field={field}
          value={value}
          onChange={handleChange}
          disableDelete={disableDelete}
        />
      )
    }
  }

  return (
    <div className={styles.container}>
      <TemplateNameInputModal
        open={templateNameInputModalOpen}
        onClose={() => setTemplateNameInputModalOpen(false)}
        onSubmit={handleSaveCurrent}
      />
      <Modal
        maxWidth="xs"
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        title="Manage filter templates"
        closeButton
      >
        {templates ? templates.map((template, index) => 
          <div className={styles.manageTemplatesContainer} key={index}>
            <Typography>{template.name}</Typography>
            <IconButton onClick={() => handleRemoveTemplate(template.name)}>
              <ClearIcon style={{color: "red"}} />
            </IconButton>
          </div>
        ) : null}
      </Modal>
      <div className={styles.topBar}>
        <Button variant="outlined" onClick={() => setExpression(defaultExpr)}>Reset Filters</Button>
        <FormControlLabel
          control={<Switch color="primary" onChange={e => setShowExpr(e.target.checked)} />}
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
        <Button variant="outlined" onClick={handleManagerOpen}>Manage</Button>
        <Button variant="outlined" onClick={() => setTemplateNameInputModalOpen(true)}>Save current</Button>
      </div>
      {showExpr ?
        <TextField
          fullWidth
          placeholder="Filter expression"
          size="small"
          multiline
          value={expression}
          onChange={handleExpressionChange}
          color={isValid ? "success" : "error"}
        /> :
      null}
      <div className={styles.filtersContainer}>
        {isValid ? renderFilters(safeJsonParse(expression), "") : null}
      </div>
    </div>
  )
}
