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


import React, {useState, createContext, useContext, useEffect} from "react";

import BuildFileURL from "../services/BuildFileURL";
import serverRequest from "../services/serverRequest";
import { serverSocket } from "../services/serverWebSocket";
import { ConfigContext } from "./ConfigContext";


export const ContextContext = createContext();

const createAssetUpdatesSocket = (config, sessionID) => {
  return serverSocket("asset_updates", config, sessionID);
};

const destroySocket = socket => {
  if (!socket) return;
  if (socket.interval) socket.interval.clear();
  socket.close();
};

export const ContextProvider = props => {
  const [config] = useContext(ConfigContext);
  const [currentContext, setCurrentContext] = useState({update: 0});
  const [socket, setSocket] = useState();

  useEffect(() => {
    if (!config.serverDetails.address) return;
    const data = localStorage.getItem("context");
    const context = JSON.parse(data);
    if (!context || !context.path) return;
    setCurrentContext(context);
    if (socket) return;
    window.services.get_env("IGNITE_SESSION_ID").then(resp => {
      const ws = createAssetUpdatesSocket(config, resp);
      ws.onmessage = data => console.log("ASSET_UPDATES RECEIVED:", data);
      setSocket(ws);
    });
    return (() => {
      destroySocket(socket);
      setSocket();
    });
  }, [config.serverDetails]);

  useEffect(() => {
    if (!config.lostConnection) refresh();
  }, [config.lostConnection]);

  async function handleContextChange(path) {
    const path_processed = BuildFileURL(path, config, {reverse: true, pathOnly: true});
    let success = false;
    const resp = await serverRequest("get_context_info", {path: path_processed});
    let data = resp.data;
    if (!data) return false;
    if (!Object.keys(data).length) return false;
    for (const key of ["parent", "path", "posix", "project_path"]) {
      data[key] = BuildFileURL(data[key], config, {pathOnly: true});
    }
    data.posix = data.posix.replaceAll("\\", "/");
    data.update = 0;
    data.root = config.access.projectsDir;
    setCurrentContext(data);
    localStorage.setItem("context", JSON.stringify(data));
    success = true;
    return success;
  }

  function refresh() {
    setCurrentContext(prevState => ({...prevState, update: prevState.update + 1}));
  }

  return (
    <ContextContext.Provider value={[currentContext, handleContextChange, refresh]}>
      {props.children}
    </ContextContext.Provider>
  );
};

export const setProject = (project, setCurrentContext) => {
  setCurrentContext(project);
};
