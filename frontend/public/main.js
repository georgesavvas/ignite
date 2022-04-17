const { app, electron, BrowserWindow, protocol, ipcMain } = require('electron');
const os = require('os');
const fs = require('fs').promises;
const path = require("path");

function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    icon: path.join(__dirname, "media/desktop_icon.ico"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  })
  //load the index.html from a url
  win.loadURL('http://localhost:3000');

  // Open the DevTools.
  win.webContents.openDevTools();

  ipcMain.handle("store_data", async (event, filename, data) => {
    const filepath = path.join(os.homedir(), ".ignite", filename);
    fs.writeFile(filepath, data, (err) => {
      if (err) {
        throw err;
        return false;
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

  ipcMain.on("launch_dcc", (event, filepath, args=[], env={}) => {
    console.log("Launching DCC:");
    console.log(filepath, args, env);
    var proc = require('child_process').spawn(filepath, args, {env: {...process.env, ...env}, detached: true});
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