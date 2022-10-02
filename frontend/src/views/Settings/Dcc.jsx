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


import React, {useContext} from "react";

import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import IconButton from "@mui/material/IconButton";
import Clear from "@mui/icons-material/Clear";
import TextField from "@mui/material/TextField";

import clientRequest from "../../services/clientRequest";
import styles from "./Dcc.module.css";
import {ConfigContext} from "../../contexts/ConfigContext";


const Dcc = () => {
  const [config, setConfig] = useContext(ConfigContext);

  const handleDccConfigChange = (e) => {
    const s = e.currentTarget.id.split("-");
    const target_id = s[1];
    const target_field = s[0];
    const data = {
      index: target_id,
      field: target_field,
      value: e.target.value
    };
    window.api.checkPath(data.value).then(exists => {
      data.valid = exists;
      return setConfig("dccConfig", data, "modify");
    });
  };

  const handleRemoveDcc = (e) => {
    const target_id = e.currentTarget.id.split("-")[1];
    const data = {index: target_id};
    setConfig("dccConfig", data, "remove");
  };

  const handleFileInput = e => {
    window.api.fileInput().then(resp => {
      if (resp.cancelled) return;
      onFileSelected(e, resp.filePaths[0]);
    });
  };

  const onFileSelected = (e, filepath) => {
    const s = e.target.id.split("-");
    const target_id = s[1];
    const data = {
      index: target_id,
      field: "path",
      value: filepath
    };
    setConfig("dccConfig", data, "modify");
  };

  const handleAddDcc = () => {
    setConfig("dccConfig", [], "add");
  };

  const handleDiscoverDcc = () => {
    clientRequest("discover_dcc").then(resp => {
      const new_config = resp.data;
      let existing_paths = [];
      config.dccConfig.forEach(config => {
        existing_paths.push(config.path);
      });
      const filtered = new_config.filter(
        config => !existing_paths.includes(config.path)
      );
      console.log(
        `Previously had ${existing_paths.length} configs,
        discovered ${new_config.length}, adding ${filtered.length}`
      );
      setConfig("dccConfig", filtered, "add");
    });
  };

  function renderDcc(dcc, index) {
    if (dcc.valid === undefined) dcc.valid = false;
    return (
      <ListItem key={index}>
        <IconButton
          color="primary"
          component="span"
          id={"remove-" + index}
          onClick={handleRemoveDcc}
        >
          <Clear style={{color: "red", fontSize: "2rem"}} />
        </IconButton>
        <Divider flexItem orientation="vertical" />
        <div className={styles.gridContainer}>
          <div className={styles.gridItemPath}>
            <TextField
              margin="dense"
              id={"path-" + index}
              label="Executable"
              fullWidth
              variant="outlined"
              value={dcc.path}
              size="small"
              color={dcc.valid ? "success" : "warning"}
              onChange={handleDccConfigChange}
              className={styles.textField}
              InputProps={{
                className: styles.input
              }}
            />
            <Button id={"file-" + index} variant="outlined" className={styles.browse} onClick={handleFileInput}>...</Button>
          </div>
          <div className={styles.gridItemName}>
            <TextField
              margin="dense"
              id={"name-" + index}
              label="Name"
              variant="outlined"
              fullWidth
              value={dcc.name}
              size="small"
              onChange={handleDccConfigChange}
              className={styles.textField}
              InputProps={{
                className: styles.input
              }}
            />
          </div>
          <div className={styles.gridItemExts}>
            <TextField
              margin="dense"
              id={"exts-" + index}
              label="Extensions"
              fullWidth
              variant="outlined"
              value={dcc.exts}
              size="small"
              onChange={handleDccConfigChange}
              className={styles.textField}
              InputProps={{
                className: styles.input
              }}
            />
          </div>
        </div>
      </ListItem>
    );
  }

  return (
    <div className={styles.container}>
      <Stack direction="row" alignItems="center" spacing={2}
        style={{alignSelf: "flex-end"}}
      >
        <Button variant="outlined" onClick={handleAddDcc}>Add</Button>
        <Button variant="outlined" onClick={handleDiscoverDcc}>Discover</Button>
      </Stack>
      <List sx={{width: "100%"}}>
        {config.dccConfig.map((dcc, index) => renderDcc(dcc, index))}
      </List>
    </div>
  );
};

export default Dcc;
