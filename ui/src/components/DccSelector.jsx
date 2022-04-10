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

const envs = {
  houdini: {
    HOUDINI_MENU_PATH: "C:\\dev\\ignite\\cg\\houdini;&;",
    HOUDINI_OTLSCAN_PATH: "&;C:\\dev\\ignite\\cg\\houdini\\otls;",
    OCIO: "C:\\dev\\ignite\\cg\\config"
  }
}

function DccSelector(props) {
  const dir_kind = props.entity.dir_kind;
  const dir_kind_formatted = dir_kind.charAt(0).toUpperCase() + dir_kind.slice(1)
  const [dccConfig, setDccConfig] = useState([]);
  const [selectedDcc, setSelectedDcc] = useState("");
  const [selectedEntity, setSelectedEntity] = useContext(EntityContext);

  useEffect(() => {
    const data = localStorage.getItem("dcc_config");
    setDccConfig(JSON.parse(data));
  }, [])

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
    const env = envs[dcc_name];
    window.electron.launcherAPI.launch(dcc.path, [selectedEntity.scene], env);
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
