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
    return await ipcRenderer.invoke("fileInput", default_dir);
  },
})
