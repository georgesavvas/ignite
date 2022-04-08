import React from "react";
import Typography from '@mui/material/Typography';

const style = {
  width: "100%",
  height: "100%"
}

function SceneDetails(props) {
  return (
    <div style={style}>
      <div style={{margin: "10px", overflow: "hidden"}}>
        <Typography variant="h5">Scene Details</Typography>
        <Typography>{props.entity.dir_kind}</Typography>
        <Typography>{props.entity.path}</Typography>
        <Typography>{props.entity.dcc}</Typography>
        <Typography>{props.entity.scene}</Typography>
      </div>
    </div>
  )
}

export default SceneDetails;
