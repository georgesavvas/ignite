import React from "react";
import styles from "./TaskManager.module.css";
import Task from "./Task";

export default function TaskManager(props) {
  return (
    <div className={styles.layoutHelper}>
      <div className={styles.container}>
        <Task state="running" />
        <Task state="running" progress={0.4} />
        <Task state="running" progress={0.1} />
        <Task state="queued" />
        <Task state="pending" />
        {/* <div className={styles.fade} /> */}
      </div>
    </div>
  )
}
