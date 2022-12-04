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


import React, {useState, useContext} from "react";

import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import SortIcon from "@mui/icons-material/Sort";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

import IgnButton from "../../components/IgnButton";
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";
import FilterField from "../../components/FilterField";
import GridViewIcon from "../../icons/GridViewIcon";
import RowViewIcon from "../../icons/RowViewIcon";
import {ContextContext} from "../../contexts/ContextContext";
import Ingest from "../Ingest/Ingest";
import ContextBar from "./ContextBar";
import NewAsset from "./NewAsset";

const style = { 
  display: "flex",
  justifyContent: "space-between",
  padding: "1px",
  alignItems: "center",
  gap: "5px"
};

function ExplorerBar(props) {
  const [ingestOpen, setIngestOpen] = useState(false);
  const [newAssetOpen, setNewAssetOpen] = useState(false);
  const [filterMenu, setFilterMenu] = useState(null);
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);
  const [filterValue, setFilterValue] = useState("");

  const handleResultTypeChange = (e, value) => {
    if (value !== null) props.onResultTypeChange(value);
  };

  const handleViewTypeChange = (e, value) => {
    if (value !== null) props.onViewTypeChange(value);
  };

  const handleGoBack = () => {
    setCurrentContext(currentContext.parent);
  };

  const handleFilterChange = value => {
    setFilterValue(value);
    props.onFilterChange(value);
  };

  const handleSortChange = (field, reverse, label) => {
    props.setQuery(prevState => ({...prevState, sort: {field: field, reverse: reverse, label: label}}));
  };

  const filterOptions = [
    {
      label: "Name (A-Z)",
      fn: () => handleSortChange("name", false, "Name (A-Z)"),
    },
    {
      label: "Name (Z-A)",
      fn: () => handleSortChange("name", true, "Name (Z-A)"),
    },
    {
      label: "Date (Newest first)",
      fn: () => handleSortChange("modification_ts", true, "Date (Newest first)"),
    },
    {
      label: "Date (Oldest first)",
      fn: () => handleSortChange("modification_ts", false, "Date (Oldest first)"),
    },
    {
      label: "Version (Higher first)",
      fn: () => handleSortChange("version", true, "Version (Higher first)"),
    },
    {
      label: "Version (Lowest first)",
      fn: () => handleSortChange("version", false, "Version (Lowest first)"),
    }
  ];

  const handleSortClicked = e => {
    handleContextMenu(e, filterMenu, setFilterMenu);
  };

  return (
    <div style={{padding: "0 5px 3px 5px", display: "flex", flexDirection: "column"}}>
      <ContextMenu items={filterOptions} contextMenu={filterMenu}
        setContextMenu={setFilterMenu}
      />
      <div style={style}>
        <Ingest open={ingestOpen} onClose={() => setIngestOpen(false)}
          enqueueSnackbar={props.enqueueSnackbar}
        />
        <NewAsset open={newAssetOpen} onClose={() => setNewAssetOpen(false)}
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
            <ToggleButton value="dynamic" style={{height: "34.25px"}}>
              <Typography variant="button">Dynamic</Typography>
            </ToggleButton>
            <ToggleButton value="tasks" style={{height: "34.25px"}}>
              <Typography variant="button">Tasks</Typography>
            </ToggleButton>
            <ToggleButton value="assets" style={{height: "34.25px"}}>
              <Typography variant="button">Assets</Typography>
            </ToggleButton>
            <ToggleButton value="scenes" style={{height: "34.25px"}}>
              <Typography variant="button">Scenes</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={props.viewType}
            onChange={handleViewTypeChange}
            exclusive
            size="small"
          >
            <ToggleButton value="grid" style={{height: "34.25px"}}>
              <GridViewIcon />
            </ToggleButton>
            <ToggleButton value="row" style={{height: "34.25px"}}>
              <RowViewIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <FilterField filterValue={filterValue} setFilterValue={handleFilterChange} />
        <IconButton onClick={handleSortClicked} style={{height: "34.25px"}}>
          <SortIcon />
        </IconButton>
        <FormControlLabel style={{height: "34.25px"}} control={<Checkbox defaultChecked onChange={props.onLatestChange} />} label="Latest" />
        <IgnButton variant="outlined" style={{minWidth: "90px"}} onClick={refreshContext}>Refresh</IgnButton>
      </div>
      <div style={style}>
        <IgnButton
          variant="outlined"
          onClick={handleGoBack}
          disabled={currentContext.dir_kind === "project"}
          size="small"
          style={{minWidth: "35px"}}
        >
          <ArrowUpwardIcon />
        </IgnButton>
        <ContextBar />
        <IgnButton
          style={{minWidth: "80px"}}
          color="ignite" 
          variant="outlined"
          disabled={currentContext.dir_kind !== "task"}
          onClick={() => setIngestOpen(true)}
        >
          Ingest
        </IgnButton>
        <IgnButton
          style={{minWidth: "120px"}}
          color="ignite" 
          variant="outlined"
          disabled={currentContext.dir_kind !== "task"}
          onClick={() => setNewAssetOpen(true)}
        >
          New Asset
        </IgnButton>
        <IgnButton
          style={{minWidth: "120px"}}
          color="ignite"
          variant="outlined"
          disabled={currentContext.dir_kind !== "task"}
          onClick={() => props.onNewScene()}
        >
          New Scene
        </IgnButton>
      </div>
    </div>
  );
}

export default ExplorerBar;
