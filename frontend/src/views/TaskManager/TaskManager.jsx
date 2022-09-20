import React, { useState, useEffect, useContext } from "react";
import styles from "./TaskManager.module.css";
import Task from "./Task";
import SystemResources from "./SystemResources";
import { clientSocket } from "../../services/clientWebSocket";
import { ConfigContext } from "../../contexts/ConfigContext";
import DataPlaceholder from "../../components/DataPlaceholder";
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { Divider } from "@mui/material";
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';

const createProcessesSocket = (config, sessionID, websocketConfig) => {
  return clientSocket("processes", config, sessionID, websocketConfig);
}

const destroySocket = socket => {
  if (!socket) return;
  socket.close();
}

const defaultTasks = [
  {
    state: "running",
    progress: 40,
    name: "Create JPEGs",
    entity: {path: "build/campfire/model/coal"}
  },
  {
    state: "waiting",
    name: "Create MP4",
    entity: {path: "build/campfire/model/coal"}
  },
  {
    state: "paused",
    progress: 68,
    name: "Upload to frameio",
    entity: {path: "build/campfire/model/coal"}
  },
  {
    state: "error",
    name: "Convert to USD in houdini",
    entity: {path: "build/campfire/model/coal"}
  },
  {
    state: "finished",
    name: "Convert to USD in houdini",
    entity: {path: "build/campfire/model/coal"}
  }
]

const taskStateOrder = ["running", "error", "paused", "waiting", "finished"]
const sortTasks = tasks => {
  const _tasks = [...tasks];
  _tasks.sort((a, b) => {
    const indexA = taskStateOrder.indexOf(a.state);
    const indexB = taskStateOrder.indexOf(b.state);
    return indexA - indexB;
  })
  return _tasks;
}

export default function TaskManager(props) {
  const [socket, setSocket] = useState();
  const [config, setConfig] = useContext(ConfigContext);
  const [tasks, setTasks] = useState([]);
  const [autoClear, setAutoClear] = useState(false);
  const [filterValue, setFilterValue] = useState("");

  useEffect(() => {
    if (!config.serverDetails.address) return;
    if (socket) return;
    window.services.get_env("IGNITE_SESSION_ID").then(resp => {
      const websocketConfig = {
        onmessage: e => {
          const data = JSON.parse(e.data).data;
          setTasks(prevState => {
            const existing = [...prevState];
            const index = existing.findIndex(task => task.id === data.id);
            if (index >= 0) existing[index] = {...existing[index], ...data};
            else if (data.name && data.entity) existing.push(data);
            return sortTasks(existing);
          });
        }
      };
      const ws = createProcessesSocket(config, resp, websocketConfig);
      if (!ws) return;
      setSocket(ws);
    })
    return (() => {
      destroySocket(socket);
      setSocket();
    })
  }, [config.serverDetails])

  useEffect(() => {
    if (!autoClear) return;
    setTasks(prevState => prevState.filter(task => task.state !== "finished"))
  }, [autoClear])

  const handleClear = taskID => {
    setTasks(prevState => prevState.filter(task => task.id !== taskID))
  }

  const handleKill = taskID => {
    setTasks(prevState => {
      const existing = [...prevState];
      const index = existing.findIndex(task => task.id === taskID);
      if (index < 0) return prevState;
      existing[index] = {...existing[index], state: "error"};
      return sortTasks(existing);
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.filterBar}>
        <FormControl fullWidth>
          <OutlinedInput
            id="outlined-basic"
            size="small"
            fullWidth
            placeholder="Filter"
            value={filterValue}
            onChange={e => setFilterValue(e.target.value || "")}
          />
        </FormControl>
        <FormControlLabel 
          control={
            <Switch checked={autoClear} onChange={e => setAutoClear(e.target.checked)} />
          }
          label="Clear finished"
          labelPlacement="start"
          style={{minWidth: "150px"}}
        />
      </div>
        {!tasks.length ? <DataPlaceholder text="No Tasks" /> :
          <div className={styles.tasksContainer}>
            {tasks.map(task =>
              <Task key={task.id} task={task} onClear={handleClear} forceKill={handleKill} />
            )}
          </div>
        }
    </div>
  )
}
