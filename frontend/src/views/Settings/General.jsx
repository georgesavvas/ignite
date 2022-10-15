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


import React, {useEffect, useState, useContext} from "react";

import TextField from "@mui/material/TextField";
import {Divider, Typography} from "@mui/material";

import styles from "./General.module.css";
import {ConfigContext} from "../../contexts/ConfigContext";
import FileInput from "../../components/FileInput";
import IgnButton from "../../components/IgnButton";


const General = () => {
  const [config, setConfig] = useContext(ConfigContext);
  const [settings, setSettings] = useState({serverDetails: {}, access: {}});
  const [canSave, setCanSave] = useState(false);

  useEffect(() => {
    setSettings({
      serverDetails: {
        address: config.serverDetails.address,
        password: config.serverDetails.password
      },
      access: {
        projectsDir: config.access.projectsDir,
        serverProjectsDir: config.access.serverProjectsDir
      }
    });
  }, [config.serverDetails, config.access]);

  useEffect(() => {
    let changed = false;
    if (
      JSON.stringify(config.serverDetails) !==
      JSON.stringify(settings.serverDetails)
    ) changed = true;
    const configAccess = {...config.access};
    delete configAccess.remote;
    if (
      JSON.stringify(configAccess) !==
      JSON.stringify(settings.access)
    ) changed = true;
    setCanSave(changed);
  }, [settings]);

  const isServerLocal = settings.serverDetails.address &&
    settings.serverDetails.address.startsWith("localhost");

  const handleServerDetailsChange = (field, value) => {
    setSettings(prevState => {
      const existing = {...prevState};
      existing["serverDetails"][field] = value;
      return existing;
    });
  };

  const handleAccessChange = (field, value) => {
    setSettings(prevState => {
      const existing = {...prevState};
      existing["access"][field] = value;
      if (isServerLocal && field === "projectsDir") {
        existing["access"]["serverProjectsDir"] = value;
      }
      return existing;
    });
  };

  const handleSave = () => {
    setConfig("serverDetails", {...settings.serverDetails});
    setConfig("access", {...settings.access});
    setCanSave(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.serverDetails}>
        <Typography variant="h5" style={{marginBottom: "10px"}}>
          Server Details
        </Typography>
        <div className={styles.row}>
          <TextField
            margin="dense"
            id="server-address"
            size="small"
            label="Address"
            value={settings.serverDetails.address || ""}
            onChange={e => handleServerDetailsChange("address", e.target.value)}
          />
          <TextField
            margin="dense"
            id="server-password"
            label="Password"
            type="password"
            size="small"
            value={settings.serverDetails.password || ""}
            onChange={e => handleServerDetailsChange("password", e.target.value)}
          />
        </div>
      </div>
      <Divider flexItem style={{margin: "20px 0px"}} />
      <div className={styles.access}>
        <Typography variant="h5" style={{marginBottom: "10px"}}>
          Access
        </Typography>
        <FileInput
          margin="dense"
          id="projects-dir"
          label="Projects directory"
          size="small"
          fullWidth
          directory
          disabled={settings.access.remote}
          value={settings.access.projectsDir || ""}
          onChange={value => handleAccessChange("projectsDir", value)}
          buttonStyle={{marginTop: "4px"}}
        />
        <FileInput
          margin="dense"
          id="projects-dir"
          label="Server projects directory"
          size="small"
          fullWidth
          directory
          disabled={isServerLocal}
          value={settings.access.serverProjectsDir || ""}
          onChange={value => handleAccessChange("serverProjectsDir", value)}
          style={{alignSelf: "stretch"}}
          buttonStyle={{marginTop: "4px"}}
        />
      </div>
      <div className={styles.centered} style={{marginTop: "20px"}}>
        <IgnButton disabled={!canSave} color="ignite"
          onClick={() => handleSave()}
        >
          Save
        </IgnButton>
      </div>
    </div>
  );
};

export default General;
