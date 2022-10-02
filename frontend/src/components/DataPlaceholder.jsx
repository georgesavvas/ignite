// Copyright 2022 George Savvas

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
};

const typeStyle = {
  color: "rgb(70, 70, 70)"
};

const DataPlaceholder = props => {
  return (
    <div style={{...containerStyle, ...props.style}}>
      <Typography variant="h4" style={typeStyle}>{props.text || "Fetching data..."}</Typography>
    </div>
  );
};

export default DataPlaceholder;
