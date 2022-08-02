const { app, BrowserWindow, protocol, ipcMain, dialog, Tray, Menu } = require('electron');
const os = require('os');
const fs = require('fs').promises;
const path = require("path");
const child_process = require("child_process");

let platformName = process.platform;
let appQuitting = false;
let tray = null;
let window = null;
let backend = null;

const backendPaths = {
  "win32": "resources/app/build/IgniteClientBackend.exe",
  "darwin": "resources/app/build/IgniteClientBackend",
  "linux": "resources/app/build/IgniteClientBackend"
}
const backendPathsDev = {
  "win32": "../backend/dist/IgniteClientBackend.exe",
  "darwin": "../backend/dist/IgniteClientBackend",
  "linux": "../backend/dist/IgniteClientBackend"
}
const backendPath = path.join(
  process.cwd(),
  process.env.NODE_ENV === "dev" ?
    backendPathsDev[platformName] :
    backendPaths[platformName]
)
backend = child_process.execFile(
  backendPath, {windowsHide: false}, (err, stdout, stderr) => {
  if (err) {
    console.log("Client:", err);
  }
  if (stdout) {
    console.log("Client:", stdout);
  }
  if (stderr) {
    console.log("Client:", stderr);
  }
})

function createWindow () {

  if (platformName === "win32") platformName = "win";
  else if (platformName === "darwin") platformName = "mac";
  else platformName = "linux";

  const iconPaths = {
    "win": "media/desktop_icon/win/icon.ico",
    "mac": "media/desktop_icon/mac/icon.icns",
    "linux": "media/desktop_icon/linux/icon.png"
  }

  // const splash = new BrowserWindow({
  //   width: 500, 
  //   height: 300, 
  //   // transparent: true, 
  //   frame: false, 
  //   alwaysOnTop: true
  // });

  // splash.loadFile("public/splash.html");
  // splash.center();

  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    // show: false,
    icon: path.join(__dirname, iconPaths[platformName]),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  })

  if (process.env.NODE_ENV === "dev") {
    console.log("Loading development environment...");
    win.loadURL("http://localhost:3000");
    // win.webContents.openDevTools();
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

  return win;
}

app.whenReady().then(() => {
  window = createWindow();
  tray = new Tray("public/media/icon.png")
  const contextMenu = Menu.buildFromTemplate([
    { label: "Show", click: () => window.show() },
    { label: "Exit", click: () => {
      backend.kill();
      app.quit();
    } },
  ])
  tray.setToolTip("Ignite")
  tray.setContextMenu(contextMenu)
  tray.on("click", () => window.show())
  tray.on("double-click", () => window.show())
})
app.on('ready', async () => {
  const protocolName = "ign";
  protocol.registerFileProtocol(protocolName, (request, callback) => {
    const url = request.url.replace(`${protocolName}://`, '');
    try {
      return callback(decodeURIComponent(url));
    }
    catch (error) {
      console.error(error);
    }
  })
})

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

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  
  if (BrowserWindow.getAllWindows().length === 0) {
    window = createWindow()
  }
})

ipcMain.handle("store_data", async (event, filename, data) => {
  const filepath = path.join(os.homedir(), ".ignite", filename);
  fs.writeFile(filepath, data, (err) => {
    if (err) {
      throw err;
    }
    else return true
  });
});

ipcMain.handle("load_data", async (event, filename) => {
  const filepath = path.join(os.homedir(), ".ignite", filename);
  fs.readFile(filepath, (err) => {
    if (err) throw err;
    return true;
  });
});

ipcMain.handle("check_path", async (event, filepath) => {
  let valid = true;
  try {
    await fs.access(filepath);
  } catch (err) {
    valid = false;
  }
  return valid;
});

ipcMain.handle("launch_dcc", async (event, cmd, args, env) => {
  const proc = child_process.spawn(cmd, args, {env: env, detached: true});
  if (proc) return true;
});

ipcMain.handle("fileInput", async (default_dir="") => {
  return dialog.showOpenDialog({properties: ['openFile'] });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.