const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("api", {
  storeData: async (filename, data) => {
    return await ipcRenderer.invoke("store_data", filename, data);
  },
  loadData: async (filename) => {
    return await ipcRenderer.invoke("load_data", filename);
  },
  checkPath: (filepath) => {
    return ipcRenderer.invoke("check_path", filepath);
  },
  fileInput: async default_dir => {
    return await ipcRenderer.invoke("file_input", default_dir);
  },
  launch_dcc: async (cmd, args, env) => {
    return await ipcRenderer.invoke("launch_dcc", cmd, args, env);
  },
})

contextBridge.exposeInMainWorld("services", {
  client_progress: callback => ipcRenderer.on("client_progress", callback),
  onResourceUsage: callback => {
    ipcRenderer.removeAllListeners("resource_usage");
    ipcRenderer.on('resource_usage', callback);
  },
  get_env: env_name => {
    return ipcRenderer.invoke("get_env", env_name);
  },
  set_env: (env_name, env_value) => {
    ipcRenderer.invoke("set_env", env_name, env_value);
  },
  set_envs: data => {
    ipcRenderer.invoke("set_envs", data);
  }
})
