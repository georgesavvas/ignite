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

import { WebSocketWithInterval } from "@renderer/types/common";
import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";

import BuildFileURL from "../services/BuildFileURL";
import serverRequest from "../services/serverRequest";
import { serverSocket } from "../services/serverWebSocket";
import { ConfigContext, ConfigContextType } from "./ConfigContext";

type Context = {
  root: string;
  name: string;
  path: string;
  posix: string;
  path_nr: string;
  dir_kind: string;
  project: string;
  parent: string;
  ancestor_kinds: { [key: string]: string };
};

export type ContextContextType = {
  currentContext: Context;
  setCurrentContext: (path: string) => Promise<boolean>;
  refresh: () => void;
};

export const ContextContext = createContext<ContextContextType | undefined>(undefined);

const createAssetUpdatesSocket = (sessionID: string, address: string) => {
  return serverSocket("asset_updates", sessionID, address);
};

const destroySocket = (socket: WebSocketWithInterval) => {
  if (!socket) return;
  if (socket.interval) clearInterval(socket.interval);
  socket.close();
};

export const ContextProvider = ({ children }: PropsWithChildren) => {
  const { config } = useContext(ConfigContext) as ConfigContextType;
  const [currentContext, setCurrentContext] = useState({ update: 0 });
  const [socket, setSocket] = useState<WebSocket | undefined>();

  useEffect(() => {
    const data = localStorage.getItem("context");
    if (data === null) return;
    const context = JSON.parse(data);
    if (!context || !context.path) return;
    setCurrentContext(context);
    if (!config.ready) return;
    if (socket) return;
    const sessionID = window.services.get_env("IGNITE_SESSION_ID");
    const serverAddress = window.services.get_env("IGNITE_SERVER_ADDRESS");
    Promise.all([sessionID, serverAddress]).then((resp) => {
      const ws = createAssetUpdatesSocket(resp[0], resp[1]);
      ws.onmessage = (data: string) => console.log("ASSET_UPDATES RECEIVED:", data);
      setSocket(ws);
    });
    return () => {
      if (!socket) return;
      destroySocket(socket);
      setSocket(undefined);
    };
  }, [config.serverDetails, config.ready]);

  useEffect(() => {
    if (config.connection) refresh();
  }, [config.connection]);

  const handleContextChange = async (path: string) => {
    if (!path) return false;
    let path_processed = path;
    if (!path_processed.startsWith("ign:"))
      path_processed = BuildFileURL(path, config, { reverse: true, pathOnly: true });
    let success = false;
    const resp = await serverRequest("get_context_info", { path: path_processed });
    let data = resp.data;
    if (!data) return false;
    if (!Object.keys(data).length) return false;
    for (const key of ["parent", "path", "posix", "project_path"]) {
      data[key] = BuildFileURL(data[key], config, { pathOnly: true });
    }
    data.posix = data.posix.replaceAll("\\", "/");
    data.update = 0;
    data.root = config.access.projectsDir;
    setCurrentContext(data);
    localStorage.setItem("context", JSON.stringify(data));
    success = true;
    return success;
  };

  const refresh = () => {
    setCurrentContext((prevState) => ({ ...prevState, update: prevState.update + 1 }));
  };

  return (
    <ContextContext.Provider
      value={{ currentContext, setCurrentContext: handleContextChange, refresh }}
    >
      {children}
    </ContextContext.Provider>
  );
};

export const setProject = (project: string, setCurrentContext: (path: string) => void) => {
  setCurrentContext(project);
};
