const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  launcherAPI: {
    launch(filepath, args, env) {
      ipcRenderer.send("launch_dcc", filepath, args, env);
    }
  }
})
