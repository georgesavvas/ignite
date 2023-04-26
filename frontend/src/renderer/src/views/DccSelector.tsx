// Copyright 2023 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import LoadingButton from "@mui/lab/LoadingButton";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { ClickEvent, Dcc, Scene } from "@renderer/types/common";
import { useSnackbar } from "notistack";
import React, { useContext, useEffect, useState } from "react";

import { DCCINFO } from "../constants/dccInfo";
import { ConfigContext, ConfigContextType } from "../contexts/ConfigContext";
import { ContextContext, ContextContextType } from "../contexts/ContextContext";
import clientRequest from "../services/clientRequest";
import styles from "./DccSelector.module.css";

interface DccSelectorProps {
  scene: Scene;
  style: React.CSSProperties;
  onClose?: () => void;
  newScene?: boolean;
  task?: string;
}

const DccSelector = (props: DccSelectorProps) => {
  const { config } = useContext(ConfigContext) as ConfigContextType;
  const [selectedDcc, setSelectedDcc] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { refresh } = useContext(ContextContext) as ContextContextType;
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (!props.scene) setShowAll(true);
  }, [props.scene]);

  const handleDccClick = (e: ClickEvent) => {
    setSelectedDcc(e.currentTarget.id);
  };

  const getDcc = () => {
    for (const dcc of config.dccConfig) {
      if (dcc.name === selectedDcc) return dcc;
    }
  };

  const getDccIcon = (path: string) => {
    const defaultPath = "src/assets/dcc/unknown.png";
    const split = path.replaceAll("\\", "/").split("/").at(-1);
    if (!split) return defaultPath;
    const name = split.split(".")[0];
    const dcc = DCCINFO.find((dcc) =>
      dcc.keywords.some((keyword) => {
        return name.toLowerCase().replaceAll(" ", "").includes(keyword);
      })
    );

    if (dcc) return `src/assets/${dcc.icon}`;
    return defaultPath;
  };

  function formatDcc(dcc: Dcc, index: number) {
    const dccIcon = getDccIcon(dcc.path);
    const relevant =
      props.scene?.name &&
      (dcc.scenes.includes(props.scene?.extension) || dcc.exts.includes(props.scene?.extension));
    const containerStyle = {
      display: relevant || showAll ? null : "none",
      borderColor: dcc.name === selectedDcc ? "rgb(252, 140, 3)" : "rgb(70,70,70)",
    } as React.CSSProperties;

    return (
      <div
        className={styles.dccContainer}
        id={dcc.name}
        key={index}
        onClick={handleDccClick}
        style={containerStyle}
      >
        <div className={styles.dccIcon} style={{ backgroundImage: `url(${dccIcon}` }} />
        <Typography variant="subtitle1" className={styles.label}>
          {dcc.name}
        </Typography>
      </div>
    );
  }

  async function handleLaunchClick() {
    setIsLoading(true);
    const dcc = getDcc();
    const data = {
      dcc: dcc,
      scene: props.scene,
      new_scene: props.newScene,
      task: props.task,
    };
    const ok = await clientRequest("get_launch_cmd", data).then((resp) => {
      const data = resp.data;
      if (!data || data === null) return false;
      return window.api.launch_dcc(data.cmd, data.args, data.env);
    });

    if (ok) enqueueSnackbar(`${dcc.name} launched!`, { variant: "success" });
    else enqueueSnackbar("Failed launching scene.", { variant: "error" });
    refresh();
    if (props.onClose) props.onClose();
    setIsLoading(false);
  }

  let dccConfigSorted = config.dccConfig.filter((dcc: Dcc) => [dcc.name, dcc.path].every(Boolean));
  dccConfigSorted.sort((a: Dcc, b: Dcc) => a.name.localeCompare(b.name));

  return (
    <div className={styles.container} style={props.style}>
      <div className={styles.topBar}>
        <Typography variant="h5">Scene Launcher</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              color="ignite"
            />
          }
          label="Show all"
          labelPlacement="start"
          sx={{ visibility: props.scene ? "visible" : "hidden" }}
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
          marginTop: "20px",
        }}
      >
        <LoadingButton
          loading={isLoading}
          size="large"
          variant="outlined"
          color="ignite"
          startIcon={<RocketLaunchIcon />}
          style={{ width: "200px" }}
          onClick={handleLaunchClick}
          disabled={!selectedDcc}
        >
          Launch
        </LoadingButton>
      </div>
    </div>
  );
};

export default DccSelector;
