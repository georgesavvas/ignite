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

import styles from "./Files.module.css";
import FileInput from "../../components/FileInput";
import DynamicList from "../../components/DynamicList";


function File({filepath, id}) {
  return (
    <div className={styles.fileContainer}>
      <Typography variant="caption">{filepath}</Typography>
      <div className={styles.connector} id={id} />
    </div>
  );
}

function Files(props) {
  const updateXarrow = useXarrow();

  return (
    <div className={styles.container}>
      <Typography variant="h6">Incoming files</Typography>
      <FileInput size="small" fullWidth multiline maxRows={5} placeholder="Paste files or directories..."
        onChange={props.onDirsChange} style={{alignSelf: "stretch"}}
      />
      <DynamicList dense noButtons onScroll={updateXarrow}>
        {
          props.files ?
            props.files.map((child, index) => <File filepath={child} key={index} id={"file-" + index} />) :
            null
        }
      </DynamicList>
    </div>
  );
}

export default Files;
