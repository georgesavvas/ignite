import React, { useState, useEffect, useContext } from "react";
import styles from "./DccSelector.module.css";
import Typography from '@mui/material/Typography';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { Button } from "@mui/material";
import {ConfigContext} from "../contexts/ConfigContext";
import {ContextContext} from "../contexts/ContextContext";
import { useSnackbar } from 'notistack';
import clientRequest from "../services/clientRequest";
import {DCCINFO} from "../constants/dccInfo";
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

const style = {
  width: "100%",
  height: "100%"
}

function DccSelector(props) {
  const [config, setConfig] = useContext(ConfigContext);
  const [selectedDcc, setSelectedDcc] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  useEffect(() => {
    if (!props.scene) setShowAll(true);
  }, [props.scene]);

  const handleDccClick = (e) => {
    setSelectedDcc(e.currentTarget.id);
  }

  const getDcc = () => {
    for(const dcc of config.dccConfig) {
      if (dcc.name === selectedDcc) return dcc;
    }
  }

  const getDccName = path => {
    const name = path.replaceAll("\\", "/").split("/").at(-1).split(".")[0]
    let dcc_name = "unknown";
    DCCINFO.forEach(dcc => {
      dcc.keywords.forEach(keyword => {
        if (name.toLowerCase().includes(keyword)) dcc_name = dcc.name;
      });
    });
    return dcc_name;
  }

  const getDccIcon = path => {
    const name = path.replaceAll("\\", "/").split("/").at(-1).split(".")[0]
    let icon = "media/dcc/unknown.png";
    DCCINFO.forEach(dcc => {
      dcc.keywords.forEach(keyword => {
        if (name.toLowerCase().replaceAll(" ", "").includes(keyword)) icon = dcc.icon;
      });
    });
    return `url(${icon})`;
  }

  function formatDcc(dcc, index) {
    const dccIcon = getDccIcon(dcc.path);
    const relevant = props.scene ? dcc.exts.includes(props.scene.extension) : true;
    const containerStyle = {
      display: relevant || showAll ? null : "none",
      borderColor: dcc.name === selectedDcc ? "rgb(252, 140, 3)" : "rgb(70,70,70)"
    }

    return (
      <div className={styles.dccContainer} id={dcc.name} key={index} onClick={handleDccClick} style={containerStyle}>
        <div className={styles.dccIcon} style={{backgroundImage: dccIcon}} />
        <Typography variant="subtitle1" className={styles.label}>{dcc.name}</Typography>
      </div>
    )
  }

  async function handleLaunchClick(e) {
    const dcc = getDcc();
    const dcc_name = getDccName(dcc.path);
    const data = {
      dcc: dcc_name,
      dcc_name: dcc.name,
      scene: props.scene,
      new_scene: props.newScene,
      task: props.task
    };
    const ok = await clientRequest("get_launch_cmd", data).then(resp => {
      const data = resp.data;
      return window.api.launch_dcc(data.cmd, data.args, data.env);
    });

    if (ok) enqueueSnackbar(`${dcc.name} launched!`, {variant: "success"});
    else enqueueSnackbar("Failed launching scene.", {variant: "error"});
    refreshContext();
    if (props.onClose) props.onClose();
  }

  let dccConfigSorted = config.dccConfig;
  dccConfigSorted.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <Typography variant="h5">
          Scene Launcher
        </Typography>
        <FormControlLabel 
          control={
            <Switch checked={showAll} onChange={e => setShowAll(e.target.checked)} />
          }
          label="Show all"
          labelPlacement="start"
          disabled={!props.scene}
        />
      </div>
      <div className={styles.dccList}>
        {dccConfigSorted.map((dcc, index) => formatDcc(dcc, index))}
      </div>
      <div style={{width: "100%", display: "grid", justifyContent: "center", marginTop: "20px"}}>
        <Button
          size="large"
          variant="outlined"
          color="ignite"
          startIcon={<RocketLaunchIcon />}
          style={{width: "200px"}}
          onClick={handleLaunchClick}
          disabled={!selectedDcc}
        >
          Launch
        </Button>
      </div>
    </div>
  )
}

export default DccSelector;
