// Copyright 2022 George Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, {useState, createRef, useContext} from "react";

import styles from "./Tile.module.css";
import ContextMenu, { handleContextMenu } from "./ContextMenu";
import BuildFileURL from "../services/BuildFileURL";
import {ConfigContext} from "../contexts/ConfigContext";
import {clamp} from "../utils/math";


export default function Tile(props) {
  const [contextMenu, setContextMenu] = useState(null);
  const [config] = useContext(ConfigContext);
  const [progress, setProgress] = useState(0);
  const hoverArea = createRef();
  const ThumbComp = props.thumbnailComp;

  let isStatic = props.thumbnail !== undefined || ThumbComp;
  if (!isStatic && !props.entity.thumbnail.path.includes("####")) isStatic = true;

  const tileStyle = {
    borderStyle: props.noBorder ? "none" : "solid",
    borderRightStyle: "solid",
    borderRadius: props.noBorder ? 0 : "3px",
    borderColor: props.selected ? "rgb(252, 140, 3)" : "rgb(50, 50, 50)"
  };

  const thumbnailCompStyle = {
    width: props.thumbnailWidth || "100%",
    height: "100%"
  };

  const thumbnailStyle = {
    width: props.thumbnailWidth || "100%"
  };

  const barStyle = {
    left: `${progress * 100}%`
  };

  const handleMouseMove = (e) => {
    const rect = hoverArea.current.getBoundingClientRect();
    const width = (e.clientX - rect.left) / rect.width;
    setProgress(clamp(width, 0, 1));
  };

  function getSeqThumbnail() {
    const thumbnail = props.entity.thumbnail;
    const hasThumbnail = thumbnail && (thumbnail !== {} || thumbnail.path === "");
    let thumbnailPath = thumbnail.path;
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
    if (props.onSelected) props.onSelected(props.entity);
  };

  return (
    <>
      {props.contextItems ? <ContextMenu items={props.contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu}
      /> : null}
      <div className={styles.tile} style={tileStyle} onClick={handleClick}
        onContextMenu={e => handleContextMenu(e, contextMenu, setContextMenu)}
      >
        {ThumbComp ? <ThumbComp className={styles.thumbnail} style={thumbnailCompStyle} /> : null}
        {!ThumbComp && thumbnailURL ?
          <img src={thumbnailURL} className={styles.thumbnail} style={thumbnailStyle} />
          : null
        }
        <div className={styles.hoverArea} onMouseMove={isStatic ? null : handleMouseMove} ref={hoverArea}>
          <div className={styles.overlay}>
            {!ThumbComp && thumbnailURL ?
              <>
                {props.noTopGradient ? null : <div className={styles.topGrad} />}
                {props.noBottomGradient ? null : <div className={styles.bottomGrad} />}
              </>
              : null
            }
            {props.noInfo ? null : props.children}
          </div>
          {isStatic ? null : <div className={styles.bar} style={barStyle} />}
        </div>
      </div>
    </>
  );
}
