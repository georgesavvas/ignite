import React from "react";

import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

import DccSelector from "../DccSelector.jsx";


const style = {
  width: "100%",
  height: "100%"
};

function SceneDetails(props) {
  return (
    <div style={style}>
      <div style={{margin: "5px", overflow: "hidden"}}>
        <DccSelector scene={props.entity} style={{maxHeight: "75vh"}} />
        <Divider style={{margin: "20px 0 20px 0"}} />
        <Typography variant="h5">Scene Details</Typography>
        <Typography>{props.entity.dcc}</Typography>
        <Typography>{props.entity.path}</Typography>
        <Typography>{props.entity.scene}</Typography>
      </div>
    </div>
  );
}

export default SceneDetails;
