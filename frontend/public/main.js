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

/* eslint-disable @typescript-eslint/no-var-requires */

const {app, BrowserWindow, protocol, ipcMain, dialog, Tray, Menu, shell} = require("electron");
const os = require("os");
const fs = require("fs").promises;
const path = require("path");
const {spawn} = require("child_process");
const getPort = require("get-port");
const axios = require("axios");
require("v8-compile-cache");
const uuid4 = require("uuid4");
const osu = require("node-os-utils");


const sessionID = uuid4();
const appPath = app.getAppPath();
process.env.IGNITE_SESSION_ID = sessionID;
let platformName = process.platform;
let appQuitting = false;
let tray = null;
let window = null;
let serverBackend = null;
let clientBackend = null;
const isDev = process.env.NODE_ENV === "dev";

const cpu = osu.cpu;
const mem = osu.mem;
const getResourceUsage = async () => {
  const cpu_data = await cpu.usage();
  const mem_data = await mem.info();
  const usage = {
    cpu: cpu_data,
    mem: mem_data.usedMemPercentage,
  };
  return usage;
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function clientRequest(port, method, data=undefined) {
  console.log(`http://localhost:${port}/api/v1/${method}`);
  try {
    const resp = await axios({
      url: `http://localhost:${port}/api/v1/${method}`,
      method: !data ? "get" : "post",
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json"
      },
      data: JSON.stringify(data)
    });
    return await resp.data;
  } catch {
    console.log(`Client request "${method}" did not respond`);
  }
}

async function clientLaunched(port) {
  let ok = false;
  while (!ok) {
    await sleep(1000);
    clientRequest(port, "ping").then(resp => {
      if (resp) {
        console.log("Client is up!");
        ok = true;
        return;
      } else console.log("Client not running, waiting...");
    });
  }
  return true;
}

const iconPaths = {
  "win32": "media/desktop_icon/win/icon.ico",
  "darwin": "media/desktop_icon/mac/icon.icns",
  "linux": "media/desktop_icon/linux/icon.png"
};

const serverPaths = {
  "win32": "IgniteServer.exe",
  "darwin": "IgniteServer",
  "linux": "IgniteServer"
};
const serverPathDev = "../backend/src/python/server_main.py";
const serverPath = path.join(
  appPath,
  process.env.NODE_ENV === "dev" ?
    serverPathDev :
    serverPaths[platformName]
);

const clientPaths = {
  "win32": "IgniteClientBackend.exe",
  "darwin": "IgniteClientBackend",
  "linux": "IgniteClientBackend"
};
const clientPathDev = "../backend/src/python/client_main.py";
const clientPath = path.join(
  appPath,
  process.env.NODE_ENV === "dev" ?
    clientPathDev :
    clientPaths[platformName]
);

function createWindow (port) {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    icon: path.join(__dirname, iconPaths[platformName]),
    backgroundColor: "#141414",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      enableBlinkFeatures: "CSSGridTemplatePropertyInterpolation"
    }
  });

  if (isDev) {
    console.log("Loading development environment...");
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools();
  } else {
    win.loadFile("build/index.html");
  }

  // setTimeout(function () {
  //   splash.close();
  //   win.show();
  // }, 7000);

  win.on("close", e => {
    if (!appQuitting) {
      e.preventDefault();
      win.hide();
    }
  });

  ipcMain.handle("store_data", async (e, filename, data) => {
    const filepath = path.join(os.homedir(), ".ignite", filename);
    fs.writeFile(filepath, data, (err) => {
      if (err) {
        throw err;
      }
      else return true;
    });
  });
  
  ipcMain.handle("load_data", async (e, filename) => {
    const filepath = path.join(os.homedir(), ".ignite", filename);
    fs.readFile(filepath, (err) => {
      if (err) throw err;
      return true;
    });
  });

  ipcMain.handle("open_url", async (e, url) => {
    shell.openExternal(url);
  });
  
  ipcMain.handle("check_path", async (e, filepath) => {
    let valid = true;
    try {
      await fs.access(filepath);
    } catch (err) {
      valid = false;
    }
    return valid;
  });
  
  ipcMain.handle("file_input", async (e, default_dir="") => {
    return dialog.showOpenDialog({properties: ["openFile"] });
  });
  
  ipcMain.handle("get_env", (e, env_name) => {
    return process.env[env_name];
  });
  
  ipcMain.handle("set_env", (e, env_name, env_value) => {
    process.env[env_name] = env_value;
    console.log("Setting", env_name, "to", env_value, "->", process.env[env_name]);
  });

  ipcMain.handle("set_envs", (e, data) => {
    for (const [env_name, env_value] of Object.entries(data)) {
      process.env[env_name] = env_value;
      console.log("Setting", env_name, "to", env_value, "->", process.env[env_name]);
    }
  });

  ipcMain.handle("get_port", () => {
    return port;
  });

  setInterval(async () => {
    const data = await getResourceUsage();
    win.webContents.send("resource_usage", data);
  }, 2000);

  return win;
}

function createSplash () {
  const win = new BrowserWindow({
    width: 600,
    height: 350,
    transparent: true,
    frame: false,
    backgroundColor: "#141414",
    alwaysOnTop: true,
    icon: path.join(__dirname, iconPaths[platformName])
  });
  win.loadFile("public/splash.html");
  return win;
}

app.whenReady().then(async () => {
  const splash = createSplash();

  const port = await getPort({
    port: getPort.makeRange(9071, 9999)
  });
  console.log("Registering client port", port);
  process.env.IGNITE_CLIENT_ADDRESS = `127.0.0.1:${port}`;

  window = createWindow(port);

  window.webContents.once("did-finish-load", () => {
    splash.destroy();
    window.show();
  });

  ipcMain.handle("launch_dcc", async (e, cmd, args, env) => {
    const proc = spawn(cmd, args, {env: env, detached: true});
    if (proc) return true;
  });

  if (isDev) {
    // backend = spawn(`python ${clientPath} ${port}`, { detached: true, shell: true, stdio: "inherit" });
  } else {
    const client_cmd = {
      darwin: `open -gj ${clientPath}`,
      linux: `${clientPath}`,
      win32: `start ${clientPath}`
    }[platformName];
    clientBackend = spawn(client_cmd, {shell: true, stdio: "pipe", env: {IGNITE_CLIENT_ADDRESS: process.env.IGNITE_CLIENT_ADDRESS}});
    clientLaunched(port).then(() => {
      clientRequest(port, "is_local_server_running").then(resp => {
        if (resp && resp.ok) {
          console.log("Found local Ignite server!");
          return;
        }
        console.log("Local Ignite server was not found, launching...");
        const server_cmd = {
          darwin: `open -gj ${serverPath}`,
          linux: `${serverPath}`,
          win32: `start ${serverPath}`
        }[platformName];
        serverBackend = spawn(server_cmd, {shell: true, stdio: "pipe", env: {IGNITE_CLIENT_ADDRESS: process.env.IGNITE_CLIENT_ADDRESS}});
      });
    });
  }

  if (tray === null) tray = new Tray("public/media/icon.png");
  const contextMenu = Menu.buildFromTemplate([
    { label: "Show", click: () => window.show() },
    { label: "Exit", click: () => {
      clientBackend.kill();
      clientRequest(port, "quit");
      app.quit();
    } },
  ]);
  tray.setToolTip("Ignite");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => window.show());
  tray.on("double-click", () => window.show());
});
app.on("ready", async () => {
  const protocolName = "ign";
  protocol.registerFileProtocol(protocolName, (request, callback) => {
    const url = request.url.replace(`${protocolName}://`, "");
    try {
      return callback(decodeURIComponent(url));
    }
    catch (error) {
      console.error(error);
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })

app.on("before-quit", e => {
  appQuitting = true;
});

app.on("activate", e => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  
  if (BrowserWindow.getAllWindows().length === 0) {
    window = createWindow();
  }
});
