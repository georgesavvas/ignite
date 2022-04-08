import React from "react";
import Typography from '@mui/material/Typography';
import ImageViewer from "./ImageViewer";

const style = {
  width: "100%",
  height: "100%"
}

function AssetDetails(props) {
  return (
    <div style={style}>
      <ImageViewer entity={props.entity} />
      <div style={{margin: "10px", overflow: "hidden"}}>
        <Typography variant="h5">Asset Details</Typography>
        <Typography>{props.entity.dir_kind}</Typography>
        <Typography>{props.entity.name}</Typography>
        <Typography>{props.entity.path}</Typography>
        <Typography>{props.entity.context}</Typography>
      </div>
    </div>
  )
}

export default AssetDetails;
