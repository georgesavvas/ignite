import { Typography } from '@mui/material';
import React from 'react';

const containerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  height: "100%",
  flexGrow: "100",
  position: "absolute",
  width: "100%",
  boxSizing: "border-box",
  pointerEvents: "none"
}

const typeStyle = {
  color: "rgb(70, 70, 70)"
}

const DataPlaceholder = props => {
  return (
    <div style={containerStyle}>
      <Typography variant="h3" style={typeStyle}>{props.text || "Fetching data..."}</Typography>
    </div>
  )
}

export default DataPlaceholder
