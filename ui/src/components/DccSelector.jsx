import React, { useState, useEffect, useContext } from "react";
import styles from "./DccSelector.module.css";
import Typography from '@mui/material/Typography';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { Button } from "@mui/material";
import {EntityContext} from "../contexts/EntityContext";

const style = {
  width: "100%",
  height: "100%"
}

const dccNames = {
  houdini: ["hmaster", "hescape", "houdini", "houdinicore", "houdinifx"],
  maya: ["maya"],
  blender: ["blender"],
  nuke: ["nuke"]
}

const generic_env = {
  OCIO: "C:\\dev\\ignite\\cg\\config"
}

const dcc_envs = {
  houdini: {
    HOUDINI_MENU_PATH: "C:\\dev\\ignite\\cg\\houdini;&;",
    HOUDINI_OTLSCAN_PATH: "&;C:\\dev\\ignite\\cg\\houdini\\otls;",
  }
}

function DccSelector(props) {
  const dir_kind = props.entity.dir_kind;
  const dir_kind_formatted = dir_kind.charAt(0).toUpperCase() + dir_kind.slice(1)
  const [dccConfig, setDccConfig] = useState([]);
  const [selectedDcc, setSelectedDcc] = useState("");
  const [selectedEntity, setSelectedEntity] = useContext(EntityContext);

  // useEffect(() => {
  //   // const data = localStorage.getItem("dcc_config");
  //   fetch(`http://127.0.0.1:9091/api/v1/get_dcc_config`).then((resp) => {
  //     return resp.json();
  //   }).then((resp) => {
  //     setDccConfig(resp.data);
  //   });
  // }, [])

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
      if (dccNames[_dcc].includes(dcc)) return _dcc;
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
    const env = {
      ...generic_env,
      ...dcc_envs[dcc_name],
      PROJECT: selectedEntity.project,
      PHASE: selectedEntity.phase,
      CONTEXT: selectedEntity.context,
      TASK: selectedEntity.task,
      EXPORTS: selectedEntity.exports
    }
    window.api.launchDcc(dcc.path, [selectedEntity.scene], env);
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
        >
          Launch
        </Button>
      </div>
    </div>
  )
}

export default DccSelector;
