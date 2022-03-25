import React, {useEffect, useState, useContext} from "react";
import styles from "./AssetTile.module.css";

export default function AssetTile(props) {
  const style = {
    "backgroundImage": "url(ign://" + props.asset.thumbnail + ")",
    "backgroundSize": "cover",
    "backgroundPosition": "center"
  };

  return (
    <div className={styles.container} style={style}>
      {/* <img src={"ign://" + props.asset.thumbnail} /> */}
    </div>
  );
}

export function HiddenTile() {
  return (
    <div className={styles.container}>

    </div>
  );
}
