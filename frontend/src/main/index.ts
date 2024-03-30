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

import { ChildProcess, spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

// require("v8-compile-cache");
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import axios from "axios";
import { BrowserWindow, Menu, Tray, app, dialog, ipcMain, protocol, shell } from "electron";
import { autoUpdater } from "electron-updater";
import getPort from "get-port";
import uuid4 from "uuid4";

autoUpdater.channel = "alpha";
const checkForUpdates = () => {
  autoUpdater.checkForUpdates();
};
// const updateTimer = setInterval(checkForUpdates, 1000 * 60 * 10);

type Success = true | false;

type Env = { [key: string]: string };

interface ClientResponse {
  ok: Success;
}

interface Platforms {
  win32: string;
  darwin: string;
  linux: string;
}

const backendPaths: Platforms = {
  win32: "IgniteBackend.exe",
  darwin: "IgniteBackend",
  linux: "IgniteBackend",
};

const sessionID = uuid4();
let platformName = process.platform as keyof Platforms;
let appPath = app.getAppPath();
if (platformName === "win32") {
  appPath = path.dirname(app.getPath("exe"));
} else if (appPath.endsWith("app.asar")) {
  appPath = path.dirname(app.getPath("exe"));
  appPath = path.join(appPath, "..");
}
process.env.IGNITE_SESSION_ID = sessionID;
let appQuitting = false;
let tray: Tray;
let window: BrowserWindow;
let backend: ChildProcess;
let backendLock = false;
let port = -1;
const isDev = is.dev;

console.log({ appPath, __dirname, dev: is.dev });

const publicPath = "public/";
const backendPathDev = "../backend/src/python/main.py";
const backendPath = path.join(
  appPath,
  process.env.NODE_ENV === "dev" ? backendPathDev : backendPaths[platformName],
);

const iconPaths: Platforms = {
  win32: "public/media/desktop_icon/win/icon.ico",
  darwin: "public/media/desktop_icon/mac/icon.icns",
  linux: "public/media/desktop_icon/linux/icon.png",
};

const clientRequest = async (method: string, data?: object): Promise<ClientResponse> => {
  console.log(`http://localhost:${port}/api/v1/${method}`);
  try {
    const resp = await axios({
      url: `http://localhost:${port}/api/v1/${method}`,
      method: !data ? "get" : "post",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
      data: JSON.stringify(data),
    });
    return await resp.data;
  } catch {
    console.log(`Client request "${method}" did not respond`);
  }
  return { ok: false };
};

const launchBackend = (): ChildProcess => {
  const backendCmd = {
    darwin: `sudo ${backendPath}`,
    linux: `sudo ${backendPath}`,
    win32: `${backendPath}`,
  }[platformName];
  console.log("Launching backend...", backendCmd);
  return spawn(backendCmd, {
    shell: true,
    stdio: "pipe",
    env: { IGNITE_CLIENT_ADDRESS: process.env.IGNITE_CLIENT_ADDRESS },
  });
};

const isPidAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return false;
  }
};

const checkBackend = async (): Promise<void> => {
  if (isDev) {
    console.log("checkBackend but is dev");
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
    existingPid = parseInt(fs.readFileSync(path.join(configPath, "ignite.pid"), "utf8"));
    // eslint-disable-next-line no-empty
  } catch (err) {}
  if (existingPid >= 0 && isPidAlive(existingPid)) {
    try {
      existingPort = parseInt(fs.readFileSync(path.join(configPath, "ignite.port"), "utf8"));
      // eslint-disable-next-line no-empty
    } catch (err) {}
  }
  if (existingPort >= 0) {
    console.log(`Found existing backend running at port ${existingPort}`);
    clientRequest("ping").then((resp) => {
      if (resp.ok) {
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
    port: getPort.makeRange(9070, 9999),
  });
  process.env.IGNITE_CLIENT_ADDRESS = `localhost:${port}`;
  backend = launchBackend();
  await new Promise((resolve) => setTimeout(resolve, 5000));
  backendLock = false;
};

const createWindow = (show = true): BrowserWindow => {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    show: show,
    icon: iconPaths[platformName],
    backgroundColor: "#141414",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/index.js"),
    },
  });

  if (isDev) {
    console.log("Loading development environment...");
    win.loadURL(process.env["ELECTRON_RENDERER_URL"] || "");
    win.webContents.openDevTools();
  } else {
    win.removeMenu();
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  win.on("close", (e) => {
    if (!appQuitting) {
      e.preventDefault();
      win.hide();
    }
  });

  ipcMain.handle("store_data", async (_, filename: string, data: string) => {
    const filepath = path.join(os.homedir(), ".ignite", filename);
    fs.promises.writeFile(filepath, data);
  });

  ipcMain.handle("load_data", async (_, filename: string) => {
    const filepath = path.join(os.homedir(), ".ignite", filename);
    return fs.promises.readFile(filepath);
  });

  ipcMain.handle("open_url", async (_, url: string) => {
    shell.openExternal(url);
  });

  ipcMain.handle("get_version", (): string => {
    return app.getVersion();
  });

  ipcMain.handle("check_path", async (_, filepath: string) => {
    let valid = true;
    try {
      await fs.promises.access(filepath);
    } catch (err) {
      valid = false;
    }
    return valid;
  });

  ipcMain.handle("dir_input", async (_, properties = []) => {
    const settings = { properties: ["openDirectory", ...properties] };
    return await dialog.showOpenDialog(win, settings);
  });

  ipcMain.handle("file_input", async (_, properties = []) => {
    const settings = { properties: ["openFile", ...properties] };
    return await dialog.showOpenDialog(win, settings);
  });

  ipcMain.handle("get_env", (_, env_name: string) => {
    return process.env[env_name];
  });

  ipcMain.handle("uuid", () => {
    return uuid4();
  });

  ipcMain.on("ondragstart", (e, filePath: string) => {
    e.sender.startDrag({
      file: path.join(__dirname, filePath),
      icon: "",
    });
  });

  ipcMain.handle("set_env", (_, env_name: string, env_value: string) => {
    process.env[env_name] = env_value;
  });

  ipcMain.handle("set_envs", (_, data: Env) => {
    for (const [env_name, env_value] of Object.entries(data)) {
      process.env[env_name] = env_value;
    }
  });

  ipcMain.handle("get_port", () => {
    console.log("get_port", port);
    return port;
  });

  return win;
};

const createSplash = (): BrowserWindow => {
  const win = new BrowserWindow({
    width: 600,
    height: 350,
    transparent: true,
    frame: false,
    backgroundColor: "#141414",
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/index.js"),
    },
    icon: iconPaths[platformName],
  });
  win.loadFile(`${publicPath}/splash.html`);
  autoUpdater.on("checking-for-update", () => {
    win.webContents.send("autoUpdater", { status: "Checking for updates..." });
  });
  autoUpdater.on("download-progress", (data) => {
    win.webContents.send("autoUpdater", {
      status: "Downloading update",
      progress: data.percent,
    });
  });
  autoUpdater.on("update-downloaded", () => {
    win.webContents.send("autoUpdater", { status: "Installing update..." });
    setTimeout(() => autoUpdater.quitAndInstall(), 2000);
  });
  return win;
};

const gotTheLock = app.requestSingleInstanceLock({ sessionID });

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (window) {
      if (window.isMinimized()) window.restore();
      window.show();
      window.focus();
    }
  });

  app.whenReady().then(async () => {
    electronApp.setAppUserModelId("georgesavvas.ignitevfx");
    app.on("browser-window-created", (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    const splash = createSplash();
    let isUpdating = false;
    let launched = false;

    window = createWindow(false);
    console.log("Checking for updates...");
    checkForUpdates();
    autoUpdater.once("update-available", () => (isUpdating = true));
    autoUpdater.once("update-not-available", () => {
      console.log("None available.");
      launched = true;
      checkBackend();
      window.once("ready-to-show", () => {
        splash.destroy();
        window.show();
      });
    });
    if (isDev) {
      checkBackend();
      window.once("ready-to-show", () => {
        splash.destroy();
        window.show();
      });
    }

    // Failsafe in case updater goes wrong
    setTimeout(() => {
      if (launched || isUpdating) return;
      console.log("Waiting 5s for update data but no answer, continuing...");
      checkBackend();
      splash.destroy();
      window.show();
    }, 5000);

    ipcMain.handle(
      "launch_dcc",
      async (_, cmd: string, args: string[], env: Env): Promise<Success> => {
        console.log("Running", cmd, args);
        console.log(env);
        const proc = spawn(cmd, args, {
          env: { ALLUSERSPROFILE: process.env.ALLUSERSPROFILE, ...env },
          detached: true,
        });
        if (proc) return true;
        return false;
      },
    );

    ipcMain.handle("check_backend", async (): Promise<void> => {
      if (isDev) {
        console.log("checkBackend but is dev");
        return;
      }
      checkBackend();
    });

    // TODO: Might have to disable tray on macos as it's not succeeding.
    console.log("tray", tray);
    if (!tray) {
      tray = new Tray(iconPaths[platformName]);
      const contextMenu = Menu.buildFromTemplate([
        { label: "Show", click: () => window.show() },
        {
          label: "Exit",
          click: () => {
            if (!isDev) {
              console.log("Attempting to kill backend...");
              if (backend) backend.kill("SIGINT");
              clientRequest("quit");
            } else console.log("not bye!");
            app.quit();
          },
        },
      ]);
      tray.setToolTip("Ignite");
      tray.setContextMenu(contextMenu);
      tray.on("click", () => window.show());
      tray.on("double-click", () => window.show());
    }
  });
}

app.on("ready", async () => {
  const protocolName = "ign";
  protocol.registerFileProtocol(protocolName, (request, callback) => {
    const url = request.url.replace(`${protocolName}://`, "");
    try {
      return callback(decodeURIComponent(url));
    } catch (error) {
      console.error(error);
    }
  });
});

if (isDev && process.platform !== "darwin") {
  app.on("window-all-closed", () => {
    console.log("isDev and all windows closed, quitting...");
    app.quit();
  });
}

app.on("before-quit", () => {
  appQuitting = true;
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    window = createWindow();
  }
});
