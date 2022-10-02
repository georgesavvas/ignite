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
