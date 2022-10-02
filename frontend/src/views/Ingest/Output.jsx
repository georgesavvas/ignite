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
import {useXarrow} from "react-xarrows";
import Divider from "@mui/material/Divider";

import styles from "./Output.module.css";
import DynamicList from "../../components/DynamicList";


function Asset({data, id}) {
  return (
    <div className={styles.assetContainer}>
      <Typography variant="h6">{data.name}</Typography>
      <Typography variant="caption">Ingest in: {data.task}</Typography>
      <Divider textAlign="left" sx={{margin: "5px 0 5px 0"}}>Components</Divider>
      {data.comps.map((comp, index) => 
        <div className={styles.compContainer} key={index}>
          <Typography variant="caption">{comp.name}</Typography>
          <Typography variant="caption">{comp.file}</Typography>
        </div>
      )}
      <div className={styles.connector} id={id} />
    </div>
  );
}

function Output(props) {
  const updateXarrow = useXarrow();

  return (
    <div className={styles.container}>
      <Typography variant="h6">Output Preview</Typography>
      <DynamicList noButtons onScroll={updateXarrow} style={{marginTop: "34px"}}>
        {
          props.assets ?
            props.assets.map((child, index) => <Asset data={child} key={index} id={"asset-" + index} />) :
            null
        }
      </DynamicList>
    </div>
  );
}

export default Output;
