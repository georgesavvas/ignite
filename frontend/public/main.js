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
require("update-electron-app")();
// const osu = require("node-os-utils");

const sessionID = uuid4();
let appPath = app.getAppPath();
if (appPath.endsWith("app.asar")) appPath = path.dirname(app.getPath("exe"));
process.env.IGNITE_SESSION_ID = sessionID;
let platformName = process.platform;
let appQuitting = false;
let tray = null;
let window = null;
let backend = null;
let backendLock = true;
const isDev = process.env.NODE_ENV === "dev";
const public = path.join(__dirname, "..", isDev ? "public" : "build");

// const cpu = osu.cpu;
// const mem = osu.mem;
// const getResourceUsage = async () => {
//   const cpu_data = await cpu.usage();
//   const mem_data = await mem.info();
//   const usage = {
//     cpu: cpu_data,
//     mem: mem_data.usedMemPercentage,
//   };
//   return usage;
// };

const iconPaths = {
  "win32": "media/desktop_icon/win/icon.ico",
  "darwin": "media/desktop_icon/mac/icon.icns",
  "linux": "media/desktop_icon/linux/icon.png"
};

console.log("platformName", platformName);

const backendPaths = {
  "win32": "IgniteBackend.exe",
  "darwin": "IgniteBackend",
  "linux": "IgniteBackend"
};
const backendPathDev = "../backend/src/python/main.py";
const backendPath = path.join(
  appPath,
  process.env.NODE_ENV === "dev" ?
    backendPathDev :
    backendPaths[platformName]
);
console.log("clientPath", backendPath);

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

function launchBackend() {
  const backendCmd = {
    darwin: `open -gj ${backendPath}`,
    linux: `${backendPath}`,
    win32: `start ${backendPath}`
  }[platformName];
  console.log("Launching backend...", backendCmd);
  return spawn(backendCmd, {
    shell: true,
    stdio: "pipe",
    env: {IGNITE_CLIENT_ADDRESS: process.env.IGNITE_CLIENT_ADDRESS}
  });
}

async function waitForBackend(port) {
  let ok = false;
  while (!ok) {
    await sleep(1000);
    clientRequest(port, "ping").then(resp => {
      if (resp) {
        console.log("Client is up!");
        ok = true;
        return;
      } else console.log("Backend not running, waiting...");
    });
  }
  return true;
}

async function checkBackend(port, attempt=0) {
  backendLock = true;
  clientRequest(port, "ping").then(resp => {
    if (resp && resp.ok) {
      console.log(`Check backend - all good! (attempt ${attempt})`);
      backendLock = false;
      return true;
    }
    console.log(`Check backend - not responding... (attempt ${attempt})`);
    if (attempt == 3 && !isDev) {
      backend = launchBackend();
      return true;
    } else setTimeout(checkBackend, 3000, port, attempt += 1);
  });
}

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

  win.on("close", e => {
    if (!appQuitting) {
      e.preventDefault();
      win.hide();
    }
  });

  ipcMain.handle("store_data", async (e, filename, data) => {
    const filepath = path.join(os.homedir(), ".ignite", filename);
    fs.writeFile(filepath, data, (err) => {
      if (err) throw err;
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

  ipcMain.handle("dir_input", async () => {
    return dialog.showOpenDialog({properties: ["openFile"] });
  });

  ipcMain.handle("file_input", async () => {
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

  // setInterval(async () => {
  //   const data = await getResourceUsage();
  //   win.webContents.send("resource_usage", data);
  // }, 2000);

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
  win.loadFile(`${public}/splash.html`);
  return win;
}

app.whenReady().then(async () => {
  const splash = createSplash();

  const port = await getPort({
    port: getPort.makeRange(9070, 9999)
  });

  process.env.IGNITE_CLIENT_ADDRESS = `localhost:${port}`;

  window = createWindow(port);

  window.webContents.once("did-finish-load", () => {
    splash.destroy();
    window.show();
  });

  ipcMain.handle("launch_dcc", async (e, cmd, args, env) => {
    const proc = spawn(cmd, args, {env: env, detached: true});
    if (proc) return true;
  });

  ipcMain.handle("check_backend", async () => {
    if (backendLock || isDev) return;
    return checkBackend(port);
  });

  if (!isDev) {
    backend = launchBackend();
    backendLock = true;
    setTimeout(() => checkBackend(port), 5000);
  }

  if (tray === null) tray = new Tray(`${public}/media/icon.png`);
  const contextMenu = Menu.buildFromTemplate([
    { label: "Show", click: () => window.show() },
    { label: "Exit", click: () => {
      if (!isDev) {
        if (backend) backend.kill();
        clientRequest(port, "quit");
      }
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

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })

app.on("before-quit", () => {
  appQuitting = true;
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    window = createWindow();
  }
});
