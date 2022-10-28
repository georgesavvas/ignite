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


import React, {useState, useEffect, useContext} from "react";

import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

import clientRequest from "../../services/clientRequest";
import FilterField from "../../components/FilterField";
import styles from "./TaskManager.module.css";
import Task from "./Task";
import {clientSocket} from "../../services/clientWebSocket";
import {ConfigContext} from "../../contexts/ConfigContext";
import DataPlaceholder from "../../components/DataPlaceholder";


const createProcessesSocket = (config, sessionID, websocketConfig) => {
  return clientSocket("processes", config, sessionID, websocketConfig);
};

const destroySocket = socket => {
  if (!socket) return;
  socket.close();
};

// const defaultTasks = [
//   {
//     state: "running",
//     progress: 40,
//     name: "Create JPEGs",
//     entity: {path: "build/campfire/model/coal"}
//   },
//   {
//     state: "waiting",
//     name: "Create MP4",
//     entity: {path: "build/campfire/model/coal"}
//   },
//   {
//     state: "paused",
//     progress: 68,
//     name: "Upload to frameio",
//     entity: {path: "build/campfire/model/coal"}
//   },
//   {
//     state: "error",
//     name: "Convert to USD in houdini",
//     entity: {path: "build/campfire/model/coal"}
//   },
//   {
//     state: "finished",
//     name: "Convert to USD in houdini",
//     entity: {path: "build/campfire/model/coal"}
//   }
// ];

const taskStateOrder = ["running", "error", "paused", "waiting", "finished"];
const sortTasks = tasks => {
  const _tasks = [...tasks];
  _tasks.sort((a, b) => {
    const indexA = taskStateOrder.indexOf(a.state);
    const indexB = taskStateOrder.indexOf(b.state);
    return indexA - indexB;
  });
  return _tasks;
};

export default function TaskManager() {
  const [socket, setSocket] = useState();
  const [config] = useContext(ConfigContext);
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
      clientRequest("get_tasks", {session_id: resp}).then(resp2 => {
        if (!resp2) return;
        setTasks(prevState => {
          const incoming = resp2.data || [];
          const incomingIds = incoming.map(t => t.id);
          const existing = prevState.filter(t => !incomingIds.includes(t.id));
          return sortTasks([...existing, ...incoming]);
        });
      });
      if (!ws) return;
      setSocket(ws);
    });
    return (() => {
      destroySocket(socket);
      setSocket();
    });
  }, [config.serverDetails]);

  useEffect(() => {
    if (!autoClear) return;
    setTasks(prevState => prevState.filter(task => task.state !== "finished"));
  }, [autoClear]);

  const handleClear = taskID => {
    setTasks(prevState => prevState.filter(task => task.id !== taskID));
  };

  const handleKill = taskID => {
    setTasks(prevState => {
      const existing = [...prevState];
      const index = existing.findIndex(task => task.id === taskID);
      if (index < 0) return prevState;
      existing[index] = {...existing[index], state: "error"};
      return sortTasks(existing);
    });
  };

  return (
    <div className={styles.container}>
      <FilterField filterValue={filterValue} setFilterValue={setFilterValue}>
        <FormControlLabel 
          control={
            <Switch
              checked={autoClear}
              onChange={e => setAutoClear(e.target.checked)}
              color="ignite"
            />
          }
          label="Clear finished"
          labelPlacement="start"
          style={{minWidth: "150px", marginRight: "0px"}}
        />
      </FilterField>
      {!tasks.length ? <DataPlaceholder text="No Tasks" /> :
        <div className={styles.tasksContainer}>
          {tasks.map(task => {
            const filterString = `
              ${task.name}
              ${task.entity.name}
              ${task.entity.path}
              ${task.entity.dir_kind}
              ${task.entity.tags}
            `;
            const hide = filterValue && !filterString.includes(filterValue);
            return <Task key={task.id} task={task} onClear={handleClear}
              forceKill={handleKill} style={hide ? {display: "none"} : null}
            />;
          })}
        </div>
      }
    </div>
  );
}
