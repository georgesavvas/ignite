import React from "react";
import Typography from '@mui/material/Typography';

const style = {
  width: "100%",
  height: "100%"
}

function DirectoryDetails(props) {
  const dir_kind = props.entity.dir_kind;
  const dir_kind_formatted = dir_kind.charAt(0).toUpperCase() + dir_kind.slice(1)

  return (
    <div style={style}>
      <div style={{margin: "10px", overflow: "hidden"}}>
        <Typography variant="h5">{dir_kind_formatted} Details</Typography>
        <Typography>{props.entity.name}</Typography>
        <Typography>{props.entity.path}</Typography>
      </div>
    </div>
  )
}

export default DirectoryDetails;
