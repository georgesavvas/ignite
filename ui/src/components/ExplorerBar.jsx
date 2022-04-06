import React, {useEffect, useState, useContext} from "react";
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import GridViewIcon from "../icons/GridViewIcon";
import RowViewIcon from "../icons/RowViewIcon";
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import {ContextContext} from "../contexts/ContextContext";

const style = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px",
  paddingLeft: "20px",
  paddingRight: "20px",
  alignItems: "center",
  gap: "10px"
}

function ExplorerBar(props) {
  const [currentLocation, setCurrentLocation] = useState("");
  const [currentContext, setCurrentContext] = useContext(ContextContext);

  useEffect(() => {
    if (currentContext.path !== undefined) {
      setCurrentLocation(currentContext.path);
    }
  },[currentContext]);

  const handleChange = (e, value) => {
    if (value !== null) props.onResultTypeChange(value);
  };

  const handleViewTypeChange = (e, value) => {
    if (value !== null) props.onViewTypeChange(value);
  };
  
  const handleLocationChange = (event) => {
    setCurrentLocation(event.target.value);
  }

  return (
    <div>
      <div style={style}>
        <Stack direction="row" spacing={1} >
          <ToggleButtonGroup
            color="primary"
            value={props.resultType}
            exclusive
            size="small"
            onChange={handleChange}
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
          label="Filter"
          variant="outlined"
          onChange={props.onFilterChange}
          style={{flexGrow: 1}}
        />
        <FormControlLabel control={<Checkbox defaultChecked onChange={props.onLatestChange} />} label="Latest" />
        <Button variant="outlined" onClick={props.onRefresh}>Refresh</Button>
      </div>
      <div style={{padding: "20px", paddingTop: 0, paddingBottom: 10}}>
        <TextField
          id="outlined-basic"
          size="small"
          fullWidth={true}
          placeholder="Location"
          variant="outlined"
          value={currentLocation}
          onChange={handleLocationChange}
        />
      </div>
    </div>
  )
}

export default ExplorerBar;
