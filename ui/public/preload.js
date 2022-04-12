const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("api", {
  launchDcc: async (filepath, args, env) => {
    ipcRenderer.send("launch_dcc", filepath, args, env);
  },
  storeData: async (filename, data) => {
    return await ipcRenderer.invoke("store_data", filename, data);
  },
  loadData: async (filename) => {
    return await ipcRenderer.invoke("load_data", filename);
  },
  checkPath: (filepath) => {
    return ipcRenderer.invoke("check_path", filepath);
  }
})
