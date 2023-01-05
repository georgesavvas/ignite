// Copyright 2022 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


// eslint-disable-next-line @typescript-eslint/no-var-requires
const {ipcRenderer, contextBridge} = require("electron");

contextBridge.exposeInMainWorld("api", {
  startDrag: fileName => {
    ipcRenderer.send("ondragstart", fileName);
  },
  storeData: async (filename, data) => {
    return await ipcRenderer.invoke("store_data", filename, data);
  },
  loadData: async (filename) => {
    return await ipcRenderer.invoke("load_data", filename);
  },
  checkPath: (filepath) => {
    return ipcRenderer.invoke("check_path", filepath);
  },
  fileInput: async properties => {
    return await ipcRenderer.invoke("file_input", properties);
  },
  dirInput: async properties => {
    return await ipcRenderer.invoke("dir_input", properties);
  },
  launch_dcc: async (cmd, args, env) => {
    return await ipcRenderer.invoke("launch_dcc", cmd, args, env);
  },
});

contextBridge.exposeInMainWorld("services", {
  client_progress: callback => ipcRenderer.on("client_progress", callback),
  onResourceUsage: callback => {
    ipcRenderer.removeAllListeners("resource_usage");
    ipcRenderer.on("resource_usage", callback);
  },
  onAutoUpdater: callback => {
    ipcRenderer.removeAllListeners("autoUpdater");
    ipcRenderer.on("autoUpdater", callback);
  },
  check_backend: () => {
    return ipcRenderer.invoke("check_backend");
  },
  get_env: env_name => {
    return ipcRenderer.invoke("get_env", env_name);
  },
  get_version: () => {
    return ipcRenderer.invoke("get_version");
  },
  uuid: () => {
    return ipcRenderer.invoke("uuid");
  },
  open_url: url => {
    return ipcRenderer.invoke("open_url", url);
  },
  set_env: (env_name, env_value) => {
    ipcRenderer.invoke("set_env", env_name, env_value);
  },
  set_envs: data => {
    ipcRenderer.invoke("set_envs", data);
  },
  get_port: () => {
    return ipcRenderer.invoke("get_port");
  }
});
