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
const fs = require("fs");
const path = require("path");
const {spawn} = require("child_process");
const getPort = require("get-port");
const axios = require("axios");
require("v8-compile-cache");
const uuid4 = require("uuid4");
const {autoUpdater} = require("electron-updater");
// const osu = require("node-os-utils");

autoUpdater.channel = "alpha";
const sessionID = uuid4();
let platformName = process.platform;
let appPath = app.getAppPath();
if (platformName === "win32") {
  appPath = path.dirname(app.getPath("exe"));
}
else if (appPath.endsWith("app.asar")) {
  appPath = path.dirname(app.getPath("exe"));
  appPath = path.join(appPath, "..");
}
console.log("appPath:", appPath);
process.env.IGNITE_SESSION_ID = sessionID;
let appQuitting = false;
let tray = null;
let window = null;
let backend = null;
let backendLock = false;
let port = -1;
const isDev = process.env.NODE_ENV === "dev";
const public = path.join(__dirname, "..", isDev ? "public" : "build");

const checkForUpdates = () => {
  autoUpdater.checkForUpdatesAndNotify();
};
checkForUpdates();
const updateTimer = setInterval(checkForUpdates, 1000 * 60 * 10);

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

async function clientRequest(method, data=undefined) {
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
    darwin: `${backendPath}`,
    linux: `${backendPath}`,
    win32: `${backendPath}`
  }[platformName];
  console.log("Launching backend...", backendCmd);
  return spawn(backendCmd, {
    shell: true,
    stdio: "pipe",
    env: {IGNITE_CLIENT_ADDRESS: process.env.IGNITE_CLIENT_ADDRESS}
  });
}

function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return false;
  }
}

async function checkBackend() {
  if (isDev) {
    process.env.IGNITE_CLIENT_ADDRESS = "localhost:9070";
    port = 9070;
    return;
  }
  if (backendLock) return;
  backendLock = true;
  let shouldLaunch = true;
  const configPath = path.join(os.homedir(), ".ignite");
  let existingPort = -1;
  let existingPid = -1;
  try {
    existingPid = fs.readFileSync(path.join(configPath, "ignite.pid"), "utf8");
    // eslint-disable-next-line no-empty
  } catch (err) { }
  if (existingPid >= 0 && isPidAlive(existingPid)) {
    try {
      existingPort = fs.readFileSync(path.join(configPath, "ignite.port"), "utf8");
    // eslint-disable-next-line no-empty
    } catch (err) { }
  }
  if (existingPort >= 0) {
    console.log(`Found existing backend running at port ${existingPort}`);
    clientRequest(existingPort, "ping").then(resp => {
      if (resp && resp.ok) {
        console.log("Successfully connected to existing backend");
        port = existingPort;
        process.env.IGNITE_CLIENT_ADDRESS = `localhost:${port}`;
        shouldLaunch = false;
      } else {
        console.log("Existing backend not responding, relaunching...");
      }
    });
  }
  if (!shouldLaunch) {
    backendLock = false;
    return;
  }
  port = await getPort({
    port: getPort.makeRange(9070, 9999)
  });
  process.env.IGNITE_CLIENT_ADDRESS = `localhost:${port}`;
  backend = launchBackend();
  await new Promise(resolve => setTimeout(resolve, 5000));
  backendLock = false;
}

function createWindow (show=true) {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    show: show,
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
    win.removeMenu();
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
    fs.promises.writeFile(filepath, data, (err) => {
      if (err) throw err;
      else return true;
    });
  });

  ipcMain.handle("load_data", async (e, filename) => {
    const filepath = path.join(os.homedir(), ".ignite", filename);
    fs.promises.readFile(filepath, (err) => {
      if (err) throw err;
      return true;
    });
  });

  ipcMain.handle("open_url", async (e, url) => {
    shell.openExternal(url);
  });

  ipcMain.handle("get_version", () => {
    return app.getVersion();
  });

  ipcMain.handle("check_path", async (e, filepath) => {
    let valid = true;
    try {
      await fs.promises.access(filepath);
    } catch (err) {
      valid = false;
    }
    return valid;
  });

  ipcMain.handle("dir_input", async (e, defaultDir) => {
    const settings = {properties: ["openDirectory"]};
    if (defaultDir) settings.defaultPath = defaultDir;
    return await dialog.showOpenDialog(win, settings);
  });

  ipcMain.handle("file_input", async (e, defaultDir) => {
    const settings = {properties: ["openFile"]};
    if (defaultDir) settings.defaultPath = defaultDir;
    return await dialog.showOpenDialog(win, settings);
  });

  ipcMain.handle("get_env", (e, env_name) => {
    // console.log(env_name, process.env[env_name]);
    return process.env[env_name];
  });

  ipcMain.handle("uuid", () => {
    return uuid4();
  });

  ipcMain.handle("set_env", (e, env_name, env_value) => {
    const prev = process.env[env_name];
    // console.log("Setting", env_name, "from", prev, "to", env_value);
    process.env[env_name] = env_value;
  });

  ipcMain.handle("set_envs", (e, data) => {
    for (const [env_name, env_value] of Object.entries(data)) {
      const prev = process.env[env_name];
      // console.log("Setting", env_name, "from", prev, "to", env_value);
      process.env[env_name] = env_value;
    }
  });

  ipcMain.handle("get_port", () => {
    console.log("get_port", port);
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

const gotTheLock = app.requestSingleInstanceLock(sessionID);

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    // Someone tried to run a second instance, we should focus our window.
    if (window) {
      if (window.isMinimized()) window.restore();
      window.show();
      window.focus();
    }
  });

  app.whenReady().then(async () => {
    checkBackend();
    const splash = createSplash();
    window = createWindow(false);

    window.webContents.once("did-finish-load", () => {
      splash.destroy();
      window.show();
    });

    ipcMain.handle("launch_dcc", async (e, cmd, args, env) => {
      console.log("Running", cmd, args);
      console.log(env);
      const proc = spawn(cmd, args, {
        env: {ALLUSERSPROFILE: process.env.ALLUSERSPROFILE, ...env},
        detached: true
      });
      if (proc) return true;
    });

    ipcMain.handle("check_backend", async () => {
      if (isDev) return;
      return checkBackend();
    });

    if (tray === null) tray = new Tray(`${public}/media/icon.png`);
    const contextMenu = Menu.buildFromTemplate([
      { label: "Show", click: () => window.show() },
      { label: "Exit", click: () => {
        if (!isDev) {
          console.log("Attempting to kill backend...");
          if (backend) backend.kill("SIGINT");
          clientRequest("quit");
        } else console.log("not bye!");
        app.quit();
      } },
    ]);
    tray.setToolTip("Ignite");
    tray.setContextMenu(contextMenu);
    tray.on("click", () => window.show());
    tray.on("double-click", () => window.show());
  });
}

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
