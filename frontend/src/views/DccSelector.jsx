import React, { useState, useEffect, useContext } from "react";
import styles from "./DccSelector.module.css";
import Typography from '@mui/material/Typography';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { Button } from "@mui/material";
import {DccContext} from "../contexts/DccContext";
import {ContextContext} from "../contexts/ContextContext";
import { useSnackbar } from 'notistack';
import clientRequest from "../services/clientRequest";

const style = {
  width: "100%",
  height: "100%"
}

const dccNames = {
  houdini: ["hmaster", "hescape", "houdini"],
  maya: ["maya"],
  blender: ["blender"],
  nuke: ["nuke"]
}

function DccSelector(props) {
  // const dir_kind = props.entity.dir_kind;
  // const dir_kind_formatted = dir_kind.charAt(0).toUpperCase() + dir_kind.slice(1)
  const [dccConfig, setDccConfig] = useContext(DccContext);
  const [selectedDcc, setSelectedDcc] = useState("");
  const [currentContext, setCurrentContext] = useContext(ContextContext);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const handleDccClick = (e) => {
    setSelectedDcc(e.currentTarget.id);
  }

  const getDcc = () => {
    for(const dcc of dccConfig) {
      if (dcc.name === selectedDcc) return dcc;
    }
  }

  const getDccName = (dcc) => {
    for(const _dcc of Object.keys(dccNames)) {
        for(const dcc_keyword of dccNames[_dcc]) {
          if (dcc.toLowerCase().includes(dcc_keyword)) return _dcc;
        }
    }
    return "unknown";
  }

  function formatDcc(dcc, index) {
    const dcc_name = getDccName(dcc.path.split("/").at(-1).split("\\").at(-1).split(".")[0]);
    const dccIcon = `url(media/dcc/${dcc_name}.png)`;
    const containerStyle = {
      borderColor: dcc.name === selectedDcc ? "rgb(252, 140, 3)" : "rgb(70,70,70)"
    }

    return (
      <div className={styles.dccContainer} id={dcc.name} key={index} onClick={handleDccClick} style={containerStyle}>
        <div className={styles.dccIcon} style={{backgroundImage: dccIcon}} />
        <Typography variant="subtitle1" className={styles.label}>{dcc.name}</Typography>
      </div>
    )
  }

  const handleLaunchClick = (e) => {
    const dcc = getDcc();
    const dcc_name = getDccName(dcc.path.split("/").at(-1).split("\\").at(-1).split(".")[0]);
    const data = {
      dcc: dcc_name,
      dcc_name: dcc.name,
      task: props.task,
      scene: props.scene,
      new_scene: props.newScene
    };
    clientRequest("launch_dcc", data).then((resp) => {
      if (resp.ok) enqueueSnackbar("Launched!", {variant: "success"});
      else enqueueSnackbar("Failed launching scene.", {variant: "error"});
      setCurrentContext(prevState => {
        const cc = {...prevState};
        cc.update += 1;
        return cc
      });
    });
  }

  return (
    <div style={style}>
      <div style={{margin: "10px", overflow: "hidden"}}>
        <Typography variant="h5" style={{marginBottom: "10px"}}>Scene Launcher</Typography>
        {dccConfig.map((dcc, index) => formatDcc(dcc, index))}
        <Button
          size="large"
          variant="outlined"
          color="ignite"
          startIcon={<RocketLaunchIcon />}
          style={{width: "100%", marginTop: "10px"}}
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
