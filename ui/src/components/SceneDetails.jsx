import React from "react";
import Typography from '@mui/material/Typography';
import DccSelector from "./DccSelector.jsx";
import { Divider } from "@mui/material";

const style = {
  width: "100%",
  height: "100%"
}

function SceneDetails(props) {
  return (
    <div style={style}>
      <div style={{margin: "10px", overflow: "hidden"}}>
        <DccSelector entity={props.entity} />
        <Divider style={{margin: "20px 0 20px 0"}} />
        <Typography variant="h5">Scene Details</Typography>
        <Typography>{props.entity.dcc}</Typography>
        <Typography>{props.entity.path}</Typography>
        <Typography>{props.entity.scene}</Typography>
      </div>
    </div>
  )
}

export default SceneDetails;
