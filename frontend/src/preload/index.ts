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

import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";

type Env = { [key: string]: string };

const api = {
  startDrag: (fileName: string): void => {
    ipcRenderer.send("ondragstart", fileName);
  },
  storeData: async (filename: string, data: object): Promise<void> => {
    return await ipcRenderer.invoke("store_data", filename, data);
  },
  loadData: async (filename: string) => {
    return await ipcRenderer.invoke("load_data", filename);
  },
  checkPath: (filepath: string): Promise<boolean> => {
    return ipcRenderer.invoke("check_path", filepath);
  },
  fileInput: async (
    properties: string[]
  ): Promise<Electron.OpenDialogReturnValue> => {
    return await ipcRenderer.invoke("file_input", properties);
  },
  dirInput: async (
    properties: string[]
  ): Promise<Electron.OpenDialogReturnValue> => {
    return await ipcRenderer.invoke("dir_input", properties);
  },
  launch_dcc: async (cmd: string, args: string, env: Env): Promise<boolean> => {
    return await ipcRenderer.invoke("launch_dcc", cmd, args, env);
  }
};

const services = {
  onAutoUpdater: (callback: (event: Electron.IpcRendererEvent) => void) => {
    ipcRenderer.removeAllListeners("autoUpdater");
    ipcRenderer.on("autoUpdater", callback);
  },
  check_backend: () => {
    ipcRenderer.invoke("check_backend");
  },
  get_env: (env_name: string): Promise<string> => {
    return ipcRenderer.invoke("get_env", env_name);
  },
  get_version: (): Promise<string> => {
    return ipcRenderer.invoke("get_version");
  },
  uuid: (): Promise<string> => {
    return ipcRenderer.invoke("uuid");
  },
  open_url: (url: string) => {
    ipcRenderer.invoke("open_url", url);
  },
  set_env: (env_name: string, env_value: string) => {
    ipcRenderer.invoke("set_env", env_name, env_value);
  },
  set_envs: (data: Env) => {
    ipcRenderer.invoke("set_envs", data);
  },
  get_port: (): Promise<number> => {
    return ipcRenderer.invoke("get_port");
  }
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
    contextBridge.exposeInMainWorld("services", services);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
