import React, {useEffect, useState, useContext} from "react";
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
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
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";

const style = { 
  display: "flex",
  justifyContent: "space-between",
  padding: "10px",
  alignItems: "center",
  gap: "10px"
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

  const filterOptions = [
    {
      label: "Name (A-Z)",
      fn: () => {},
    },
    {
      label: "Name (Z-A)",
      fn: () => {}
    },
    {
      label: "Date (Newest first)",
      fn: () => {}
    },
    {
      label: "Date (Oldest first)",
      fn: () => {}
    },
    {
      label: "Version (Higher first)",
      fn: () => {}
    },
    {
      label: "Version (Lowest first)",
      fn: () => {}
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
          <DccSelector task={currentContext.path} newScene={true}
            onClose={() => setNewSceneOpen(false)}
          />
        </Modal>
        <Ingest open={ingestOpen} onClose={() => setIngestOpen(false)}
          refresh={props.onRefresh} task={currentContext.path}
          enqueueSnackbar={props.enqueueSnackbar}
        />
        <Stack direction="row" spacing={1} >
          <ToggleButtonGroup
            color="primary"
            value={props.resultType}
            exclusive
            size="small"
            onChange={handleResultTypeChange}
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
        <TextField
          id="filterField"
          size="small"
          placeholder="Filter"
          variant="outlined"
          value={filterValue}
          error={filterValue !== ""}
          onChange={handleFilterChange}
          style={{flexGrow: 1}}
        />
        <IconButton onClick={handleSortClicked}>
          <SortIcon />
        </IconButton>
        <FormControlLabel control={<Checkbox defaultChecked onChange={props.onLatestChange} />} label="Latest" />
        <Button variant="outlined" onClick={props.onRefresh}>Refresh</Button>
      </div>
      <div style={{...style, padding: "0 10px 10px 10px"}}>
        <Button
            style={{maxWidth: "35px"}}
            variant="outlined"
            onClick={handleGoBack}
            disabled={currentContext.dir_kind === "project"}
          >
            <ArrowUpwardIcon />
        </Button>
        <ContextBar />
        <Button
          style={{minWidth: "120px"}}
          color="ignite" 
          variant="outlined"
          onClick={() => setIngestOpen(true)}
        >
          Ingest
        </Button>
        <Button
          style={{minWidth: "120px"}}
          color="ignite"
          variant="outlined"
          disabled={currentContext.dir_kind !== "task"}
          onClick={() => setNewSceneOpen(true)}
        >
          New Scene
        </Button>
      </div>
    </div>
  )
}

export default ExplorerBar;
