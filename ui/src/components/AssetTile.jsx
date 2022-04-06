import React, {useEffect, useState, useContext, createRef} from "react";
import styles from "./AssetTile.module.css";
import Typography from '@mui/material/Typography';

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);



function AssetTileGrid(props) {
  const [progress, setProgress] = useState(0.5);
  const hoverArea = createRef();

  const tileStyle = {
    "borderStyle": "solid",
    "borderWidth": "2px",
    "borderColor": props.selected ? "rgb(252, 140, 3)" : "rgb(50, 50, 50)",
    "borderRadius": "12px",
    "width": props.size,
    "height": props.size * 0.5625,
    "display": "flex",
    "flexDirection": "column",
    "position": "relative"
  };

  const thumbnailStyle = {
    "borderRadius": "10px 10px 10px 10px",
    // "backgroundImage": "url(ign://" + props.asset.thumbnail + ")",
    "backgroundImage": "url(media/houdini.svg)",
    "backgroundSize": "cover",
    "backgroundPosition": "center",
    "width": "100%",
    "height": props.size * 0.5625,
    "maxWidth": props.size,
    "position": "relative"
  };

  const barStyle = {
    "left": props.size * progress
  }
  
  const handleMouseMove = (e) => {
    const rect = hoverArea.current.getBoundingClientRect();
    const width = (e.clientX - rect.left) / props.size;
    setProgress(clamp(width, 0, 1));
  }

  return (
    <div style={tileStyle} onClick={() => props.onSelected(props.asset)} >
      <div style={thumbnailStyle} />
      <div className={styles.hoverArea} onMouseMove={handleMouseMove} style={{"maxWidth": props.size}} ref={hoverArea}>
        <div className={styles.overlay}>
          <div className={styles.topGrad} />
          <div className={styles.bottomGrad} />
          <Typography style={{"position": "absolute", "top": "5px", "left": "5px"}}>{props.asset.context}</Typography>
          <Typography style={{"position": "absolute", "bottom": "5px", "left": "5px"}}>{props.asset.name}</Typography>
          <Typography style={{"position": "absolute", "bottom": "5px", "right": "5px"}}>{props.asset.version}</Typography>
        </div>
        <div className={styles.bar} style={barStyle} />
      </div>
    </div>
  );
}

function AssetTileRow(props) {
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
    "position": "relative"
  };

  const thumbnailStyle = {
    "borderRadius": "10px 0 0 10px",
    "backgroundImage": "url(ign://" + props.asset.thumbnail + ")",
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

  return (
    <div style={tileStyle} onClick={() => props.onSelected(props.asset)} >
      <div style={thumbnailStyle} />
      <div className={styles.hoverArea} onMouseMove={handleMouseMove} style={{"maxWidth": props.size}} ref={hoverArea}>
        <div className={styles.bar} style={barStyle} />
      </div>
      <div style={{"paddingLeft": "6px"}}>
        <Typography align="left">{props.asset.name}</Typography>
        <Typography align="left">{props.asset.version}</Typography>
        <Typography align="left">{props.asset.context}</Typography>
      </div>
    </div>
  );
}

export default function AssetTile(props) {
  return (
    props.viewType === "grid" ? AssetTileGrid(props) : AssetTileRow(props)
  );
}

export function HiddenTile(props) {
  return (
    <div style={{width: props.size, height: 0}} />
  );
}
