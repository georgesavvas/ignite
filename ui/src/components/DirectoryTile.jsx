import React, {useEffect, useState, useContext, createRef} from "react";
import styles from "./DirectoryTile.module.css";
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ScienceIcon from '@mui/icons-material/Science';
import CameraIcon from '@mui/icons-material/Camera';
import LocalMoviesIcon from '@mui/icons-material/LocalMovies';
import MovieIcon from '@mui/icons-material/Movie';
import ConstructionIcon from '@mui/icons-material/Construction';
import FolderIcon from '@mui/icons-material/Folder';
import FortIcon from '@mui/icons-material/Fort';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import {ContextContext} from "../contexts/ContextContext";

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const labelIcons = {
  directory: FolderIcon,
  phase: MovieIcon,
  build: ConstructionIcon,
  sequence: LocalMoviesIcon,
  shot: CameraIcon,
  task: AssignmentIcon,
  task_generic: AssignmentIcon,
  task_model: FortIcon,
  task_look: FormatPaintIcon,
  task_light: LightbulbIcon,
  task_anim: DirectionsRunIcon,
  task_rig: PrecisionManufacturingIcon,
  task_asset: UnarchiveIcon,
  task_fx: LocalFireDepartmentIcon,
  rnd: ScienceIcon,
}

function DirectoryTileGrid(props) {
  const [currentContext, setCurrentContext] = useContext(ContextContext);
  const [progress, setProgress] = useState(0.5);
  const hoverArea = createRef();

  const isScene = props.entity.dir_kind === "scene";

  const tileStyle = {
    "borderColor": props.selected ? "rgb(252, 140, 3)" : "rgb(50, 50, 50)",
  };

  const thumbnailStyle = {
    width: isScene ? "100%" : "50%",
    height: "auto",
    margin: "auto",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    position: "absolute"
  };

  const barStyle = {
    "left": `${progress * 100}%`
  }

  const handleMouseMove = (e) => {
    const rect = hoverArea.current.getBoundingClientRect();
    const width = (e.clientX - rect.left) / rect.width;
    setProgress(clamp(width, 0, 1));
  }

  const handleClick = (e) => {
    console.log(props.entity);
    if (e.detail === 2) {
      var path = props.entity.path;
      if (props.entity.hasOwnProperty("task")) {
        path = props.entity.task.path;
      }
      setCurrentContext({
        path: path,
        name: props.entity.name,
        kind: props.entity.dir_kind
      });
    };
    props.onSelected(props.entity);
  }

  function renderThumbnail(entity) {
    var path = "media/folder_icon.png";
    if (isScene) path = `media/dcc/${props.entity.dcc}.png`;
    return <img src={path} style={thumbnailStyle} />;
  }

  const name = isScene ? props.entity.dcc : props.entity.name;

  return (
    <div style={tileStyle} className={styles.tile} onClick={handleClick} >
      {renderThumbnail(props.entity)}
      <div className={styles.hoverArea} onMouseMove={handleMouseMove} ref={hoverArea}>
        <div className={styles.overlay}>
          <div className={styles.topGrad} />
          <div className={styles.bottomGrad} />
          <Typography variant="context" style={{"position": "absolute", "top": "5px", "left": "10px"}}>{props.entity.full_context}</Typography>
          <Typography style={{"position": "absolute", "bottom": "5px", "left": "10px"}}>{name}</Typography>
          <Typography style={{"position": "absolute", "bottom": "5px", "right": "10px"}}>{props.entity.version}</Typography>
        </div>
        <div className={styles.bar} style={barStyle} />
      </div>
    </div>
  );
}

function DirectoryTileRow(props) {
  const [currentContext, setCurrentContext] = useContext(ContextContext);
  const [progress, setProgress] = useState(0.5);
  const hoverArea = createRef();

  const tileStyle = {
    "borderStyle": "solid",
    "borderWidth": "2px",
    "borderColor": props.selected ? "rgb(252, 140, 3)" : "rgb(50, 50, 50)",
    "borderRadius": "12px",
    "width": "100%",
    "height": props.size * 0.5625,
    "display": "flex",
    "flexDirection": "row",
    "position": "relative",
    overflow: "clip"
  };

  const thumbnailStyle = {
    "backgroundImage": "url(media/dcc/" + props.entity.dcc + ".png)",
    "backgroundSize": "cover",
    "backgroundPosition": "center",
    "width": "100%",
    "height": props.size * 0.5625,
    "maxWidth": props.size,
  };

  const barStyle = {
    "left": props.size * progress
  }

  const handleMouseMove = (e) => {
    const rect = hoverArea.current.getBoundingClientRect();
    const width = (e.clientX - rect.left) / props.size;
    setProgress(clamp(width, 0, 1));
  }

  const handleClick = (e) => {
    if (e.detail === 2) {
      setCurrentContext({
        path: props.entity.path,
        name: props.entity.name,
        kind: props.entity.dir_kind
      });
    };
    props.onSelected(props.entity);
  }

  return (
    <div style={tileStyle} onClick={handleClick} >
      <div style={thumbnailStyle} />
      <div className={styles.hoverArea} onMouseMove={handleMouseMove} style={{"maxWidth": props.size}} ref={hoverArea}>
        <div className={styles.bar} style={barStyle} />
      </div>
      <div style={{"paddingLeft": "6px"}}>
        <Typography align="left">{props.entity.name}</Typography>
        <Typography align="left">{props.entity.version}</Typography>
        <Typography align="left">{props.entity.full_context}</Typography>
      </div>
    </div>
  );
}

export default function DirectoryTile(props) {
  return (
    props.viewType === "grid" ? DirectoryTileGrid(props) : DirectoryTileRow(props)
  );
}
