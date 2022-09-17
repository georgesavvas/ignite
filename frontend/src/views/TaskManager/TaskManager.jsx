import React, { useState, useEffect, useContext } from "react";
import styles from "./TaskManager.module.css";
import Task from "./Task";
import SystemResources from "./SystemResources";
import { clientSocket } from "../../services/clientWebSocket";
import { ConfigContext } from "../../contexts/ConfigContext";

const createProcessesSocket = (config, sessionID) => {
  return clientSocket("processes", config, sessionID);
}

const destroySocket = socket => {
  if (!socket) return;
  if (socket.interval) clearInterval(socket.interval);
  socket.close();
}

export default function TaskManager(props) {
  const [socket, setSocket] = useState();
  const [config, setConfig] = useContext(ConfigContext);

  // useEffect(() => {
  //   if (!config.serverDetails.address) return;
  //   if (socket) return;
  //   window.services.get_env("IGNITE_SESSION_ID").then(resp => {
  //     const ws = createProcessesSocket(config, resp);
  //     if (!ws) return;
  //     ws.onmessage = data => console.log("PROCESSES RECEIVED:", data);
  //     ws.interval = setInterval(() => ws.send("ping"), 2000);
  //     setSocket(ws);
  //   })
  //   return (() => {
  //     destroySocket(socket);
  //     setSocket();
  //   })
  // }, [config.serverDetails])

  return (
    <div>
      {/* <SystemResources /> */}
      <div className={styles.container}>
        {/* <Task state="running" />
        <Task state="running" progress={0.4} />
        <Task state="running" progress={0.1} />
        <Task state="queued" />
        <Task state="pending" /> */}
        {/* <div className={styles.fade} /> */}
      </div>
    </div>
  )
}
