import React, { useState, createRef } from "react";
import styles from "./Tile.module.css";
import ContextMenu, { handleContextMenu } from "./ContextMenu";

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

function GridTile(props) {
  const [contextMenu, setContextMenu] = useState(null);
  const [progress, setProgress] = useState(0);
  const hoverArea = createRef();
  const isStatic = props.thumbnail !== undefined;

  const tileStyle = {
    "borderColor": props.selected ? "rgb(252, 140, 3)" : "rgb(50, 50, 50)",
  }

  const thumbnailStyle = {
    width: props.thumbnailWidth || "100%"
  }

  const barStyle = {
    "left": `${progress * 100}%`
  }
  
  const handleMouseMove = (e) => {
    const rect = hoverArea.current.getBoundingClientRect();
    const width = (e.clientX - rect.left) / rect.width;
    setProgress(clamp(width, 0, 1));
  }

  function getSeqThumbnail() {
    const thumbnail = props.entity.thumbnail
    let thumbnailPath = thumbnail.path || "media/no_icon.png"
    if (!thumbnail.static) {
      let frame = thumbnail.first + (thumbnail.last - thumbnail.first) * progress;
      frame = Math.round(frame);
      thumbnailPath = thumbnailPath.replace("####", frame);
    }
    return thumbnailPath;
  }
  const thumbnailURL = isStatic ? props.thumbnail : `ign://${getSeqThumbnail()}`;

  const handleClick = e => {
    if (props.onClick) props.onClick(e);
    props.onSelected(props.entity);
  }

  const contextItems = [
    {
      "label": "Copy URI",
      "fn": () =>  navigator.clipboard.writeText(props.entity.uri)
    },
    {
      "label": "Copy path",
      "fn": () =>  navigator.clipboard.writeText(props.entity.path),
      "divider": true
    },
    {
      "label": "Open in file explorer"
    },
  ]

  const _handleContextMenu = e => {
    handleContextMenu(e, contextMenu, setContextMenu);
  }

  return (
    <>
    <ContextMenu items={contextItems} contextMenu={contextMenu} setContextMenu={setContextMenu} />
      <div style={tileStyle} className={styles.tile} onClick={handleClick} onContextMenu={_handleContextMenu}>
        <img src={thumbnailURL} className={styles.thumbnail} style={thumbnailStyle} />
        <div className={styles.hoverArea} onMouseMove={isStatic ? null : handleMouseMove} ref={hoverArea}>
          <div className={styles.overlay}>
            <div className={styles.topGrad} />
            {props.children}
          </div>
          {isStatic ? null : <div className={styles.bar} style={barStyle} />}
        </div>
      </div>
    </>
  );
}

function RowTile(props) {
  const [progress, setProgress] = useState(0.5);
  const hoverArea = createRef();
  const isStatic = props.thumbnail !== undefined;

  const tileStyle = {
    "borderColor": props.selected ? "rgb(252, 140, 3)" : "rgb(50, 50, 50)",
    "height": props.size * 0.5625,
    "flexDirection": "row"
  };

  const thumbnailStyle = {
    "width": props.thumbnailWidth || "100%"
  }

  const thumbnailContainer = {
    minWidth: props.size,
    height: props.size * 0.5625,
    maxWidth: props.size,
    position: "relative",
    borderRight: "solid 1px rgb(40, 40, 40)"
  }

  const barStyle = {
    "left": props.size * progress
  }

  const handleMouseMove = (e) => {
    const rect = hoverArea.current.getBoundingClientRect();
    const width = (e.clientX - rect.left) / props.size;
    setProgress(clamp(width, 0, 1));
  }

  function getSeqThumbnail() {
    const thumbnail = props.entity.thumbnail
    let thumbnailPath = thumbnail.path || "media/no_icon.png"
    if (!thumbnail.static) {
      let frame = thumbnail.first + (thumbnail.last - thumbnail.first) * progress;
      frame = Math.round(frame);
      thumbnailPath = thumbnailPath.replace("####", frame);
    }
    return thumbnailPath;
  }
  const thumbnailURL = isStatic ? props.thumbnail : `ign://${getSeqThumbnail()}`;

  const handleClick = e => {
    if (props.onClick) props.onClick(e);
    props.onSelected(props.entity);
  }

  return (
    <div className={styles.tile} style={tileStyle} onClick={handleClick}>
      <div style={thumbnailContainer}>
        <img src={thumbnailURL} className={styles.thumbnail} style={thumbnailStyle} />
      </div>
      <div className={styles.hoverArea} onMouseMove={isStatic ? null : handleMouseMove} style={{"maxWidth": props.size}} ref={hoverArea}>
        {isStatic ? null : <div className={styles.bar} style={barStyle} />}
      </div>
      <div style={{"paddingLeft": "6px"}}>
        {props.children}
      </div>
    </div>
  );
}

export default function Tile(props) {
  return (
    props.viewType === "grid" ? GridTile(props) : RowTile(props)
  );
}
