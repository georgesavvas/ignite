import React from 'react'
import styles from "./Tag.module.css";

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

export function TagContainer(props) {
  return (
    <div className={styles.container}>
      {props.children}
    </div>
  )
}

function Tag(props) {
  return (
    <div className={styles.tag} style={namedStyles[props.name]}>{props.name}</div>
  )
}

export default Tag;
