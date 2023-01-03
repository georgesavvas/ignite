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

import Container from "@mui/material/Container";
import Pagination from "@mui/material/Pagination";
import Slider from "@mui/material/Slider";

import IgnTextField from "./IgnTextField";


const style = {
  margin: "0px",
  padding: "5px",
  paddingLeft: "5px",
  paddingRight: "15px",
  maxHeight: "60px",
  maxWidth: "100%",
  width: "100%",
  display: "flex",
  flex: "1",
  justifyContent: "space-between",
  alignItems: "center"
};

function PageBar(props) {
  return (
    <Container style={style}>
      <div style={{width: "200px", display: "flex", justifyContent: "flex-start"}}>
        <IgnTextField id="tilesPerPage" inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, style: { textAlign: "center" }}} defaultValue={50} style={{width: 55}} variant="outlined" onChange={props.onTilesPerPageChange} />
      </div>
      <Pagination onChange={props.onChange} count={props.pages} variant="outlined" shape="rounded" />
      <div style={{width: "200px", height: "30px"}}>
        <Slider size="small" value={props.tileSize} step={1} marks min={3} max={10} onChange={props.onTileSizeChange} />
      </div>
    </Container>
  );
}

export default PageBar;
