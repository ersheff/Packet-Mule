// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const path = require("path");
const { io } = require("socket.io-client");

// create browser window and load index.html
function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  ipcMain.on("connect", (event, username) => {
    const socket = io("http://127.0.0.1:3000", {
      query: {
        username: username
      }
    });

    ipcMain.on("change-username", (e, u) => {
      socket.emit("change-username", u);
    });

    // ----------

    socket.on("control", incoming => {

    });

    socket.on("message", incoming => {
      mainWindow.webContents.send("message", incoming);
    });

    socket.on("server-message", incoming => {
      mainWindow.webContents.send("server-message", incoming);
    });

    socket.on("confirm-user", incoming => {
      mainWindow.webContents.send("confirm-user", incoming);
    });

    socket.on("user-list", incoming => {
      mainWindow.webContents.send("user-list", incoming);
    });

  });

  // ----------

  ipcMain.on("launch-file", (event, fileName) => {
    shell.openPath(fileName);
    event.sender.send("launch-file-success", fileName);
  });

  mainWindow.loadFile("index.html");

}

// ----------

// quit when all windows are closed, except on macOS
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});


// called when Electron is ready
app.whenReady().then(() => {

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  });

});