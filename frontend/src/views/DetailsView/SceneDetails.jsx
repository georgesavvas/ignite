import React from "react";

import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

import DccSelector from "../DccSelector.jsx";
import Path from "../../components/Path.jsx";


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
        <Typography variant="h5">Scene Details ({props.entity.dcc})</Typography>
        <Path path={props.entity.path} />
        <Path path={props.entity.scene} />
      </div>
    </div>
  );
}

export default SceneDetails;
