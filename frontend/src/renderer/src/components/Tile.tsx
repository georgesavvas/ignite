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

import { SvgIconProps } from "@mui/material";
import { ClickEvent, ContextItem, Directory, Entity } from "@renderer/types/common";
import { useContext, useRef, useState } from "react";

import { ConfigContext, ConfigContextType } from "../contexts/ConfigContext";
import BuildFileURL from "../services/BuildFileURL";
import { clamp } from "../utils/math";
import ContextMenu, { ContextMenuType, handleContextMenu } from "./ContextMenu";
import styles from "./Tile.module.css";

type TileProps = React.PropsWithChildren<{
  thumbnailComp?: React.ComponentType<SvgIconProps>;
  noOverlay?: boolean;
  thumbnail?: string;
  noBorder?: boolean;
  selected?: boolean;
  onSelected?: (entity: Entity) => void;
  thumbnailWidth: string;
  entity: Directory;
  onClick?: (e: ClickEvent) => void;
  contextItems: ContextItem[];
  noInfo?: boolean;
  onDragStart: (e: React.DragEvent) => void;
  draggable: boolean;
  noTopGradient?: boolean;
  noBottomGradient?: boolean;
  columnWidths?: string[];
}>;

export const Tile = (props: TileProps) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuType | null>(null);
  const { config } = useContext(ConfigContext) as ConfigContextType;
  const [progress, setProgress] = useState(0);
  const hoverArea = useRef<HTMLInputElement>(null);
  const ThumbComp = props.thumbnailComp;
  const overlay = props.noOverlay === undefined ? true : !props.noOverlay;

  let isStatic = props.thumbnail !== undefined || ThumbComp;
  if (!isStatic && !props.entity.thumbnail.path.includes("####")) isStatic = true;

  const tileStyle = {
    borderStyle: props.noBorder ? "none" : "solid",
    borderRightStyle: "solid" as React.CSSProperties["borderRightStyle"],
    borderRadius: props.noBorder ? 0 : "3px",
    borderColor: props.selected ? "rgb(252, 140, 3)" : "rgb(50, 50, 50)",
  };

  const thumbnailCompStyle = {
    width: props.thumbnailWidth || "100%",
    height: "100%",
  };

  const thumbnailStyle = {
    width: props.thumbnailWidth || "100%",
  };

  const barStyle = {
    left: `${progress * 100}%`,
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!hoverArea.current) return;
    const rect = hoverArea.current.getBoundingClientRect();
    const width = (e.clientX - rect.left) / rect.width;
    setProgress(clamp(width, 0, 1));
  };

  function getSeqThumbnail() {
    const thumbnail = props.entity.thumbnail;
    const hasThumbnail = thumbnail?.path;
    let thumbnailPath = thumbnail.path;
    if (hasThumbnail && !thumbnail.static) {
      const amount = thumbnail.frames.length;
      const sectionSize = 1 / amount;
      const section = clamp(Math.floor(progress / sectionSize), 0, amount - 1);
      const frame = thumbnail.frames[section];
      thumbnailPath = thumbnailPath.replace("####", frame);
    }
    if (!hasThumbnail) return "";
    return BuildFileURL(thumbnailPath, config);
  }
  const thumbnailURL = props.thumbnail || getSeqThumbnail();

  const handleClick = (e: ClickEvent) => {
    if (props.onClick) props.onClick(e);
    if (props.onSelected) props.onSelected(props.entity);
  };

  return (
    <>
      {props.contextItems ? (
        <ContextMenu
          items={props.contextItems}
          contextMenu={contextMenu}
          setContextMenu={setContextMenu}
          title={props.entity.name}
          subtitle={props.entity.dir_kind}
        />
      ) : null}
      <div
        className={styles.tile}
        style={tileStyle}
        onClick={handleClick}
        onContextMenu={(e) => handleContextMenu(e, contextMenu, setContextMenu)}
        draggable={props.draggable}
        onDragStart={props.onDragStart}
      >
        {ThumbComp ? <ThumbComp className={styles.thumbnail} style={thumbnailCompStyle} /> : null}
        {!ThumbComp && thumbnailURL ? (
          <img src={thumbnailURL} className={styles.thumbnail} style={thumbnailStyle} />
        ) : null}
        <div
          className={styles.hoverArea}
          onMouseMove={isStatic ? undefined : handleMouseMove}
          ref={hoverArea}
        >
          <div className={styles.overlay}>
            {!ThumbComp && thumbnailURL && overlay ? (
              <>
                {props.noTopGradient ? null : <div className={styles.topGrad} />}
                {props.noBottomGradient ? null : <div className={styles.bottomGrad} />}
              </>
            ) : null}
            {props.noInfo ? null : props.children}
          </div>
          {isStatic ? null : <div className={styles.bar} style={barStyle} />}
        </div>
      </div>
    </>
  );
};

export default Tile;
