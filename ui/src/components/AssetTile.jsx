import React, {useEffect, useState, useContext} from "react";
import styles from "./AssetTile.module.css";

export default function AssetTile(props) {

  const tileStyle = {
    "border": "1px rgb(50, 50, 50) solid",
    "borderRadius": "10px",
    "width": props.viewType === "grid" ? props.size : "100%",
    "height": props.size * 0.5625
  };

  const thumbnailStyle = {
    "borderRadius": props.viewType === "grid" ? "10px 10px 10px 10px" : "10px 0 0 10px",
    "backgroundImage": "url(ign://" + props.asset.thumbnail + ")",
    "backgroundSize": "cover",
    "backgroundPosition": "center",
    "width": "100%",
    "maxWidth": props.size,
    "height": props.size * 0.5625
  };

  return (
    <div style={tileStyle}>
      <div style={thumbnailStyle}>
      </div>
    </div>
  );
}

export function HiddenTile(props) {
  return (
    <div style={{width: props.size, height: 0}} />
  );
}
