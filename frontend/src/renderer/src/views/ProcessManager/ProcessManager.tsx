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

import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { useContext, useEffect, useState } from "react";
import Sockette from "sockette";

import DataPlaceholder from "../../components/DataPlaceholder";
import FilterField from "../../components/FilterField";
import { Config, ConfigContext, ConfigContextType } from "../../contexts/ConfigContext";
import clientRequest from "../../services/clientRequest";
import { clientSocket } from "../../services/clientWebSocket";
import Process, { ProcessType } from "./Process";
import styles from "./ProcessManager.module.css";

const createProcessesSocket = (config: Config, sessionID: string, websocketConfig: {}) => {
  return clientSocket("processes", config, sessionID, websocketConfig);
};

const destroySocket = (socket: WebSocket) => {
  if (!socket) return;
  socket.close();
};

// const defaultProcesses = [
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

const processStateOrder = ["running", "error", "paused", "waiting", "finished"];
const sortProcesses = (processes: ProcessType[]) => {
  const _processes = [...processes];
  _processes.sort((a, b) => {
    const indexA = processStateOrder.indexOf(a.state);
    const indexB = processStateOrder.indexOf(b.state);
    return indexA - indexB;
  });
  return _processes;
};

export const ProcessManager = () => {
  const [socket, setSocket] = useState<Sockette | undefined>(undefined);
  const { config } = useContext(ConfigContext) as ConfigContextType;
  const [processes, setProcesses] = useState<ProcessType[]>([]);
  const [autoClear, setAutoClear] = useState(false);
  const [filterValue, setFilterValue] = useState("");

  useEffect(() => {
    if (!config.clientAddress) return;
    if (socket) return;
    window.services.get_env("IGNITE_SESSION_ID").then((resp: any) => {
      const websocketConfig = {
        onmessage: (e) => {
          const data = JSON.parse(e.data).data;
          setProcesses((prev) => {
            const existing = [...prev];
            const index = existing.findIndex((process) => process.id === data.id);
            if (index >= 0) existing[index] = { ...existing[index], ...data };
            else if (data.name && data.entity) existing.push(data);
            return sortProcesses(existing);
          });
        },
      };
      const ws = createProcessesSocket(config, resp, websocketConfig);
      clientRequest("get_processes", { session_id: resp }).then((resp2) => {
        if (!resp2) return;
        setProcesses((prev) => {
          const incoming = resp2.data || [];
          const incomingIds = incoming.map((t: ProcessType) => t.id);
          const existing = prev.filter((t) => !incomingIds.includes(t.id));
          return sortProcesses([...existing, ...incoming]);
        });
      });
      if (!ws) return;
      setSocket(ws);
    });
    return () => {
      if (!socket) return;
      destroySocket(socket);
      setSocket(undefined);
    };
  }, [config.clientAddress]);

  useEffect(() => {
    if (!autoClear) return;
    setProcesses((prev) => prev.filter((process) => process.state !== "finished"));
  }, [autoClear]);

  const handleClear = (processID: string) => {
    setProcesses((prev) => prev.filter((process) => process.id !== processID));
  };

  const handleKill = (processID: string) => {
    setProcesses((prev) => {
      const existing = [...prev];
      const index = existing.findIndex((process) => process.id === processID);
      if (index < 0) return prev;
      existing[index] = { ...existing[index], state: "error" };
      return sortProcesses(existing);
    });
  };

  return (
    <div className={styles.container}>
      <FilterField filterValue={filterValue} setFilterValue={setFilterValue}>
        <FormControlLabel
          control={
            <Switch
              checked={autoClear}
              onChange={(e) => setAutoClear(e.target.checked)}
              color="ignite"
            />
          }
          label="Clear finished"
          labelPlacement="start"
          style={{ minWidth: "150px", marginRight: "0px" }}
        />
      </FilterField>
      {!processes.length ? (
        <DataPlaceholder text="No Processes" />
      ) : (
        <div className={styles.processesContainer}>
          {processes.map((process) => {
            const filterString = `
              ${process.name}
              ${process.entity.name}
              ${process.entity.path}
              ${process.entity.dir_kind}
              ${process.entity.tags}
            `;
            const hide = filterValue && !filterString.includes(filterValue);
            return (
              <Process
                key={process.id}
                process={process}
                onClear={handleClear}
                forceKill={handleKill}
                style={hide ? { display: "none" } : {}}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProcessManager;
