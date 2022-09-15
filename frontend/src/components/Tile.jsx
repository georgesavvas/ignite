import React, { useState, createRef, useContext } from "react";
import styles from "./Tile.module.css";
import ContextMenu, { handleContextMenu } from "./ContextMenu";
import BuildFileURL from "../services/BuildFileURL";
import { ConfigContext } from "../contexts/ConfigContext";
import { clamp } from "../utils/math";

function GridTile(props) {
  const [contextMenu, setContextMenu] = useState(null);
  const [config, setConfig] = useContext(ConfigContext);
  const [progress, setProgress] = useState(0);
  const hoverArea = createRef();
  let isStatic = props.thumbnail !== undefined;
  if (!isStatic && !props.entity.thumbnail.path.includes("####")) isStatic = true;

  const tileStyle = {
    borderColor: props.selected ? "rgb(252, 140, 3)" : "rgb(50, 50, 50)"
  }

  const thumbnailStyle = {
    width: props.thumbnailWidth || "100%"
  }

  const barStyle = {
    left: `${progress * 100}%`
  }

  const handleMouseMove = (e) => {
    const rect = hoverArea.current.getBoundingClientRect();
    const width = (e.clientX - rect.left) / rect.width;
    setProgress(clamp(width, 0, 1));
  }

  function getSeqThumbnail() {
    const thumbnail = props.entity.thumbnail
    const hasThumbnail = thumbnail && thumbnail !== {} || thumbnail.path === "";
    let thumbnailPath = thumbnail.path
    if (hasThumbnail && !thumbnail.static) {
      let frame = thumbnail.first_frame + (thumbnail.last_frame - thumbnail.first_frame) * progress;
      frame = clamp(Math.round(frame), thumbnail.first_frame, thumbnail.last_frame);
      thumbnailPath = thumbnailPath.replace("####", frame);
    }
    if (!hasThumbnail) return "";
    return BuildFileURL(thumbnailPath, config);
  }
  const thumbnailURL = props.thumbnail || getSeqThumbnail();

  const handleClick = e => {
    if (props.onClick) props.onClick(e);
    props.onSelected(props.entity);
  }

  const ThumbComp = props.thumbnailComp;

  return (
    <>
      <ContextMenu items={props.contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu}
      />
      <div className={styles.tile + " " + styles.gridTile} style={tileStyle} onClick={handleClick}
        onContextMenu={e => handleContextMenu(e, contextMenu, setContextMenu)}
      >
        {ThumbComp ? <ThumbComp sx={{ fontSize: props.size * 0.25 }} className={styles.thumbnail} /> : null}
        {!ThumbComp && thumbnailURL ?
          <img src={thumbnailURL} className={styles.thumbnail} style={thumbnailStyle} />
          : null}
        <div className={styles.hoverArea} onMouseMove={isStatic ? null : handleMouseMove} ref={hoverArea}>
          <div className={styles.overlay}>
            <div className={styles.topGrad} />
            <div className={styles.bottomGrad} />
            {props.children}
          </div>
          {isStatic ? null : <div className={styles.bar} style={barStyle} />}
        </div>
      </div>
    </>
  );
}

function RowTile(props) {
  const [contextMenu, setContextMenu] = useState(null);
  const [config, setConfig] = useContext(ConfigContext);
  const [progress, setProgress] = useState(0.5);
  const hoverArea = createRef();
  const isStatic = props.thumbnail !== undefined;

  const tileStyle = {
    borderColor: props.selected ? "rgb(252, 140, 3)" : "rgb(50, 50, 50)",
    height: `${props.size * 0.25}px`,
    flexDirection: "row"
  };

  const thumbnailStyle = {
    width: props.thumbnailWidth || "100%"
  }

  const thumbnailContainer = {
    // minWidth: props.size * 0.25,
    // height: props.size * 0.25 * 0.5625,
    // maxWidth: props.size * 0.25,
    height: "100%",
    aspectRatio: 16 / 9,
    position: "relative",
    borderRight: "solid 1px rgb(40, 40, 40)"
  }

  const barStyle = {
    left: props.size * progress
  }

  const handleMouseMove = (e) => {
    const rect = hoverArea.current.getBoundingClientRect();
    const width = (e.clientX - rect.left) / props.size;
    setProgress(clamp(width, 0, 1));
  }

  function getSeqThumbnail() {
    const thumbnail = props.entity.thumbnail
    let thumbnailPath = thumbnail.path || ""
    if (!thumbnail.static) {
      let frame = thumbnail.first_frame + (thumbnail.last_frame - thumbnail.first_frame) * progress;
      frame = clamp(Math.round(frame), thumbnail.first_frame, thumbnail.last_frame);
      thumbnailPath = thumbnailPath.replace("####", frame);
    }
    return thumbnailPath;
  }
  const thumbnailURL = isStatic ? props.thumbnail : BuildFileURL(getSeqThumbnail(), config);

  const handleClick = e => {
    if (props.onClick) props.onClick(e);
    props.onSelected(props.entity);
  }

  const ThumbComp = props.thumbnailComp;

  return (
    <>
      <ContextMenu items={props.contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu}
      />
      <div className={styles.tile} style={tileStyle} onClick={handleClick}
        onContextMenu={e => handleContextMenu(e, contextMenu, setContextMenu)}
      >
        <div style={thumbnailContainer}>
        {ThumbComp ? <ThumbComp sx={{ fontSize: props.size * 0.5 }} className={styles.thumbnail} /> : null}
        {!ThumbComp && thumbnailURL ?
          <img src={thumbnailURL} className={styles.thumbnail} style={thumbnailStyle} />
          : null}
        </div>
        <div className={styles.hoverArea} style={{"maxWidth": props.size}}
          onMouseMove={isStatic ? null : handleMouseMove} ref={hoverArea}
        >
          {isStatic ? null : <div className={styles.bar} style={barStyle} />}
        </div>
        <div style={{"paddingLeft": "6px"}}>
          {props.children}
        </div>
      </div>
    </>
  );
}

export default function Tile(props) {
  return (
    props.viewType === "grid" ? GridTile(props) : RowTile(props)
  );
}
