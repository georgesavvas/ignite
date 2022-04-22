import React from 'react'
import styles from "./AssetLabel.module.css";

const namedStyles = {
  locked: {
    backgroundColor: "rgb(40, 40, 100)"
  },
  approved: {
    backgroundColor: "rgb(40,100,40)"
  },
  deprecated: {
    backgroundColor: "rgb(5, 5, 5)"
  }
}

export function LabelContainer(props) {
  return (
    <div className={styles.container}>
      {props.children}
    </div>
  )
}

function AssetLabel(props) {
  return (
    <div className={styles.label} style={namedStyles[props.name]}>{props.name}</div>
  )
}

export default AssetLabel;
