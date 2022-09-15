import React, {useEffect, useState, useContext} from "react";
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import GridViewIcon from "../../icons/GridViewIcon";
import RowViewIcon from "../../icons/RowViewIcon";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import {ContextContext} from "../../contexts/ContextContext";
import DccSelector from "../DccSelector";
import Ingest from "../Ingest/Ingest";
import ContextBar from "./ContextBar";
import Modal from "../../components/Modal";
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import { IconButton } from "@mui/material";
import IgnTextField from "../../components/IgnTextField";
import IgnButton from "../../components/IgnButton";
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";

const style = { 
  display: "flex",
  justifyContent: "space-between",
  padding: "5px",
  alignItems: "center",
  gap: "5px"
}

function ExplorerBar(props) {
  const [newSceneOpen, setNewSceneOpen] = useState(false);
  const [ingestOpen, setIngestOpen] = useState(false);
  const [filterMenu, setFilterMenu] = useState(null);
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);
  const [filterValue, setFilterValue] = useState("");

  const handleResultTypeChange = (e, value) => {
    if (value !== null) props.onResultTypeChange(value);
  };

  const handleViewTypeChange = (e, value) => {
    if (value !== null) props.onViewTypeChange(value);
  };

  const handleGoBack = e => {
    setCurrentContext(currentContext.parent);
  }

  const handleFilterChange = e => {
    const value = e.target.value;
    setFilterValue(value);
    props.onFilterChange(value);
  }

  const handleSortChange = (field, reverse) => {
    props.setQuery(prevState => ({...prevState, sort: {field: field, reverse: reverse}}));
  }

  const filterOptions = [
    {
      label: "Name (A-Z)",
      fn: () => handleSortChange("name", false),
    },
    {
      label: "Name (Z-A)",
      fn: () => handleSortChange("name", true),
    },
    {
      label: "Date (Newest first)",
      fn: () => handleSortChange("date", true),
    },
    {
      label: "Date (Oldest first)",
      fn: () => handleSortChange("date", false),
    },
    {
      label: "Version (Higher first)",
      fn: () => handleSortChange("version", true),
    },
    {
      label: "Version (Lowest first)",
      fn: () => handleSortChange("version", false),
    }
  ]

  const handleSortClicked = e => {
    handleContextMenu(e, filterMenu, setFilterMenu);
  }

  return (
    <div>
      <ContextMenu items={filterOptions} contextMenu={filterMenu}
        setContextMenu={setFilterMenu}
      />
      <div style={style}>
        <Modal open={newSceneOpen} onClose={() => setNewSceneOpen(false)} maxWidth="xs">
          <DccSelector newScene={true} task={currentContext.path}
            onClose={() => setNewSceneOpen(false)}
          />
        </Modal>
        <Ingest open={ingestOpen} onClose={() => setIngestOpen(false)}
          enqueueSnackbar={props.enqueueSnackbar}
        />
        <Stack direction="row" spacing={1} >
          <ToggleButtonGroup
            color="primary"
            value={props.resultType}
            exclusive
            onChange={handleResultTypeChange}
            size="small"
          >
            <ToggleButton value="dynamic">Dynamic</ToggleButton>
            <ToggleButton value="assets">Assets</ToggleButton>
            <ToggleButton value="scenes">Scenes</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={props.viewType}
            onChange={handleViewTypeChange}
            exclusive
            size="small"
          >
            <ToggleButton value="grid">
              <GridViewIcon />
            </ToggleButton>
            <ToggleButton value="row">
              <RowViewIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <IgnTextField
          id="filterField"
          placeholder="Filter"
          fullWidth
          variant="outlined"
          value={filterValue}
          error={filterValue !== ""}
          onChange={handleFilterChange}
        />
        <IconButton onClick={handleSortClicked}>
          <SortIcon />
        </IconButton>
        <FormControlLabel control={<Checkbox defaultChecked onChange={props.onLatestChange} />} label="Latest" />
        <IgnButton variant="outlined" style={{minWidth: "90px"}} onClick={refreshContext}>Refresh</IgnButton>
      </div>
      <div style={{...style, padding: "0 5px 5px 5px"}}>
        <IgnButton
            style={{maxWidth: "35px"}}
            variant="outlined"
            onClick={handleGoBack}
            disabled={currentContext.dir_kind === "project"}
          >
            <ArrowUpwardIcon />
        </IgnButton>
        <ContextBar />
        <IgnButton
          style={{minWidth: "80px"}}
          color="ignite" 
          variant="outlined"
          onClick={() => setIngestOpen(true)}
        >
          Ingest
        </IgnButton>
        <IgnButton
          style={{minWidth: "120px"}}
          color="ignite"
          variant="outlined"
          disabled={currentContext.dir_kind !== "task"}
          onClick={() => setNewSceneOpen(true)}
        >
          New Scene
        </IgnButton>
      </div>
    </div>
  )
}

export default ExplorerBar;
