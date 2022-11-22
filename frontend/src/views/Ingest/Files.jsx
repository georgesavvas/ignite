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


import React, {useState} from "react";

import Typography from "@mui/material/Typography";
import {useXarrow} from "react-xarrows";

import styles from "./Files.module.css";
import DynamicList from "../../components/DynamicList";
import IgnTextField from "../../components/IgnTextField";
import IgnButton from "../../components/IgnButton";
import { useEffect } from "react";


function File({filepath, id, number}) {
  const fileId = `[${number}] `;
  return (
    <div className={styles.fileContainer}>
      <Typography variant="caption">{fileId}{filepath}</Typography>
      <div className={styles.connector} id={id} />
    </div>
  );
}

function Files(props) {
  const updateXarrow = useXarrow();
  const [sources, setSources] = useState("");

  useEffect(() => {
    props.onDirsChange(sources);
  }, [sources]);

  const handleSourceChange = value => {
    const list = value.split("\n");
    setSources(list.join("\n"));
  };

  const handleAddFiles = async dir => {
    const resp = dir ?
      await window.api.dirInput() : await window.api.fileInput();
    if (resp.cancelled) return;
    const filePaths = resp.filePaths;
    if (!filePaths?.length) return;
    setSources(prev => {
      let existing = prev ? prev.split("\n") : [];
      existing = existing.concat(filePaths);
      const unique = Array.from(new Set(existing)).join("\n");
      return unique;
    });
  };

  return (
    <div className={styles.container}>
      <Typography variant="h6">Incoming files</Typography>
      <div style={{alignSelf: "stretch", display: "flex", flexDirection: "column", gap: "5px"}}>
        <div style={{display: "flex", gap: "5px"}}>
          <IgnButton variant="outlined" fullWidth
            onClick={() => handleAddFiles(true)}
          >
            Add dirs
          </IgnButton>
          <IgnButton variant="outlined" fullWidth
            onClick={() => handleAddFiles()}
          >
            Add files
          </IgnButton>
        </div>
        <IgnTextField
          placeholder="Paste files or directories..."
          fullWidth
          multiline
          maxRows={5}
          value={sources}
          onChange={e => handleSourceChange(e.target.value)}
          onBlur={e => handleSourceChange(e.target.value)}
        />
      </div>
      <DynamicList dense noButtons onScroll={updateXarrow}>
        {
          props.files ?
            props.files.map((child, index) =>
              <File
                filepath={child}
                key={index}
                number={index}
                id={"file-" + index}
              />
            )
            : null
        }
      </DynamicList>
    </div>
  );
}

export default Files;
