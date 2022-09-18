import React, { useState, useEffect, useContext } from "react";
import styles from "./TaskManager.module.css";
import Task from "./Task";
import SystemResources from "./SystemResources";
import { clientSocket } from "../../services/clientWebSocket";
import { ConfigContext } from "../../contexts/ConfigContext";

const createProcessesSocket = (config, sessionID, websocketConfig) => {
  return clientSocket("processes", config, sessionID, websocketConfig);
}

const destroySocket = socket => {
  if (!socket) return;
  if (socket.interval) clearInterval(socket.interval);
  socket.close();
}

const defaultTasks = [
  {
    state: "running",
    progress: 40,
    name: "Create JPEGs",
    asset: {name: "beauty", context: "build/campfire/model/coal"},
    component: {name: "render_acescg.####.exr"}
  },
  {
    state: "waiting",
    name: "Create MP4",
    asset: {name: "beauty", context: "build/campfire/model/coal"},
    component: {name: "render_acescg.####.exr"}
  },
  {
    state: "paused",
    progress: 68,
    name: "Upload to frameio",
    asset: {name: "beauty", context: "build/campfire/model/coal"},
    component: {name: "render_acescg.####.exr"}
  },
  {
    state: "error",
    name: "Convert to USD in houdini",
    asset: {name: "beauty", context: "build/campfire/model/coal"},
    component: {name: "render_acescg.####.exr"}
  },
  {
    state: "finished",
    name: "Convert to USD in houdini",
    asset: {name: "beauty", context: "build/campfire/model/coal"},
    component: {name: "render_acescg.####.exr"}
  }
]

const taskStateOrder = ["running", "error", "paused", "waiting", "finished"]
defaultTasks.sort((a, b) => {
  const indexA = taskStateOrder.indexOf(a.state);
  const indexB = taskStateOrder.indexOf(b.state);
  return indexA - indexB;
})

export default function TaskManager(props) {
  const [socket, setSocket] = useState();
  const [config, setConfig] = useContext(ConfigContext);
  const [tasks, setTasks] = useState(defaultTasks);

  useEffect(() => {
    if (!config.serverDetails.address) return;
    if (socket) return;
    window.services.get_env("IGNITE_SESSION_ID").then(resp => {
      const websocketConfig = {
        onmessage: e => console.log(JSON.parse(e.data))
      };
      const ws = createProcessesSocket(config, resp, websocketConfig);
      if (!ws) return;
      ws.interval = setInterval(() => {
        ws.send("ping");
      }, 1000)
      setSocket(ws);
    })
    return (() => {
      destroySocket(socket);
      setSocket();
    })
  }, [config.serverDetails])

  return (
    <div>
      {/* <SystemResources /> */}
      <div className={styles.container}>
        {tasks.map((task, index) =>
          <Task key={index} progress={0.4} task={task} />
        )}
      </div>
    </div>
  )
}
