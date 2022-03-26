import React from "react";
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import GridViewIcon from "../icons/GridViewIcon";
import RowViewIcon from "../icons/RowViewIcon";

const style = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px",
  paddingLeft: "20px",
  paddingRight: "20px",
  alignItems: "center"
}

function FilterBar(props) {

  const handleChange = (e, value) => {
    if (value !== null) props.onResultTypeChange(value);
  };

  const handleViewTypeChange = (e, value) => {
    if (value !== null) props.onViewTypeChange(value);
  };
  
  return (
    <div style={style}>
      <Stack direction="row" spacing={2} >
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
      <TextField id="filterField" size="small" label="Filter" variant="outlined" onChange={props.onFilterChange} />
      <Button variant="outlined">Refresh</Button>
    </div>
  )
}

export default FilterBar;
