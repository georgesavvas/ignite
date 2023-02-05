// Copyright 2022 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React from "react";

import Typography from "@mui/material/Typography";


const typeStyle = {
  color: "rgb(200, 200, 200)"
};

const DragOverlay = props => {

  const containerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: "100",
    position: "absolute",
    left: "20px",
    right: "20px",
    top: "20px",
    bottom: "20px",
    borderRadius: "20px",
    border: "3px dashed rgb(200, 200, 200)",
    boxSizing: "border-box",
    pointerEvents: "none",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    zIndex: 1
  };

  if (props.error) {
    containerStyle.backgroundColor = "rgba(255, 0, 0, 0.3)";
    containerStyle.borderColor = "rgb(200, 0, 0)";
    containerStyle.cursor = "no-drop";
  }

  return (
    <div style={{...containerStyle, ...props.style}}>
      <Typography variant={props.variant || "h3"} style={typeStyle}>
        {props.error || props.text}
      </Typography>
    </div>
  );
};

export default DragOverlay;
