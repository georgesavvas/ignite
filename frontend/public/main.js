const { app, electron, BrowserWindow, protocol, ipcMain, dialog } = require('electron');
const os = require('os');
const fs = require('fs').promises;
const path = require("path");
const child_process = require("child_process");

function createWindow () {

  let platformName = process.platform;
  if (platformName === "win32") platformName = "win";
  else if (platformName === "darwin") platformName = "mac";
  else platformName = "linux";

  const iconPaths = {
    "win": "media/desktop_icon/win/ignite.ico",
    "mac": "media/desktop_icon/mac/ignite.icns",
    "linux": "media/desktop_icon/linux/ignite.png"
  }

  const splash = new BrowserWindow({
    width: 500, 
    height: 300, 
    transparent: true, 
    frame: false, 
    alwaysOnTop: true 
  });

  splash.loadFile("public/splash.html");
  splash.center();

  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    icon: path.join(__dirname, iconPaths[platformName]),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  })

  win.loadURL('http://localhost:3000');
  win.webContents.openDevTools();

  setTimeout(function () {
    splash.close();
    win.show();
  }, 7000);

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

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)
app.on('ready', async () => {
  // Name the protocol whatever you want.
  const protocolName = "ign";

  protocol.registerFileProtocol(protocolName, (request, callback) => {
    const url = request.url.replace(`${protocolName}://`, '');
    try {
      return callback(decodeURIComponent(url));
    }
    catch (error) {
      // Handle the error as needed
      console.error(error);
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.