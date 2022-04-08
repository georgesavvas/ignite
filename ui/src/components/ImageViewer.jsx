import { grid } from "@mui/system";
import React from "react";

const style = {
  border: "solid red 1px",
  // aspectRatio: 16 / 9,
  position: "relative",
  display: grid
}

function ImageViewer(props) {
  const path = `ign://${props.entity.thumbnail}`;

  const thumbnailStyle = {
    display: "block",
    marginLeft: "auto",
    marginRight: "auto"
  };

  return (
    <div style={style}>
      <img src={path} style={thumbnailStyle} />
    </div>
  )
}

export default ImageViewer;
