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


import React, {useState, useEffect, useContext} from "react";

import Typography from "@mui/material/Typography";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import LoadingButton from "@mui/lab/LoadingButton";
import {useSnackbar} from "notistack";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

import {DCCINFO} from "../constants/dccInfo";
import clientRequest from "../services/clientRequest";
import {ConfigContext} from "../contexts/ConfigContext";
import {ContextContext} from "../contexts/ContextContext";
import styles from "./DccSelector.module.css";


function DccSelector(props) {
  const [config] = useContext(ConfigContext);
  const [selectedDcc, setSelectedDcc] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [,, refreshContext] = useContext(ContextContext);
  const {enqueueSnackbar} = useSnackbar();

  useEffect(() => {
    if (!props.scene) setShowAll(true);
  }, [props.scene]);

  const handleDccClick = (e) => {
    setSelectedDcc(e.currentTarget.id);
  };

  const getDcc = () => {
    for(const dcc of config.dccConfig) {
      if (dcc.name === selectedDcc) return dcc;
    }
  };

  const getDccIcon = path => {
    const name = path.replaceAll("\\", "/").split("/").at(-1).split(".")[0];
    let icon = "media/dcc/unknown.png";
    DCCINFO.forEach(dcc => {
      dcc.keywords.forEach(keyword => {
        if (name.toLowerCase().replaceAll(" ", "").includes(keyword)) {
          icon = dcc.icon;
        }
      });
    });
    return `url(${icon})`;
  };

  function formatDcc(dcc, index) {
    const dccIcon = getDccIcon(dcc.path);
    const relevant = props.scene ?
      dcc.exts.includes(props.scene.extension) : true;
    const containerStyle = {
      display: relevant || showAll ? null : "none",
      borderColor: dcc.name === selectedDcc ?
        "rgb(252, 140, 3)" : "rgb(70,70,70)"
    };

    return (
      <div className={styles.dccContainer} id={dcc.name} key={index}
        onClick={handleDccClick} style={containerStyle}
      >
        <div className={styles.dccIcon} style={{backgroundImage: dccIcon}} />
        <Typography variant="subtitle1" className={styles.label}>
          {dcc.name}
        </Typography>
      </div>
    );
  }

  async function handleLaunchClick() {
    setIsLoading(true);
    const dcc = getDcc();
    // const dcc_name = getDccName(dcc.path);
    const data = {
      dcc: dcc,
      scene: props.scene,
      new_scene: props.newScene,
      task: props.task
    };
    const ok = await clientRequest("get_launch_cmd", data).then(resp => {
      const data = resp.data;
      if (!data || data === null) return false;
      return window.api.launch_dcc(data.cmd, data.args, data.env);
    });

    if (ok) enqueueSnackbar(`${dcc.name} launched!`, {variant: "success"});
    else enqueueSnackbar("Failed launching scene.", {variant: "error"});
    refreshContext();
    if (props.onClose) props.onClose();
    setIsLoading(false);
  }

  let dccConfigSorted = config.dccConfig.filter(
    dcc => [dcc.name, dcc.exts, dcc.path].every(Boolean)
  );
  dccConfigSorted.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={styles.container} style={props.style}>
      <div className={styles.topBar}>
        <Typography variant="h5">
          Scene Launcher
        </Typography>
        <FormControlLabel 
          control={
            <Switch
              checked={showAll}
              onChange={e => setShowAll(e.target.checked)}
              color="ignite"
            />
          }
          label="Show all"
          labelPlacement="start"
          sx={{visibility: props.scene ? "visible" : "hidden"}}
        />
      </div>
      <div className={styles.dccList}>
        {dccConfigSorted.map((dcc, index) => formatDcc(dcc, index))}
      </div>
      <div
        style={{
          width: "100%",
          display: "grid",
          justifyContent: "center",
          marginTop: "20px"
        }}
      >
        <LoadingButton
          loading={isLoading}
          size="large"
          variant="outlined"
          color="ignite"
          startIcon={<RocketLaunchIcon />}
          style={{width: "200px"}}
          onClick={handleLaunchClick}
          disabled={!selectedDcc}
        >
          Launch
        </LoadingButton>
      </div>
    </div>
  );
}

export default DccSelector;
