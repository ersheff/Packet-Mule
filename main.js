// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const path = require("path");
const { io } = require("socket.io-client");

const oscSender = require("dgram").createSocket("udp4");
const oscReceiver = require("dgram").createSocket("udp4");

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
    
    const socket = io("http://192.168.0.159:3000", {
      query: {
        username: username
      }
    });

    // ----------
    // OSC bridge

    // bridge sender - coming in from server
    oscSender.on("error", (err) => {
      const message = `server error:\n${err.stack}`;
      mainWindow.webContents.send("console-log", message);
      oscSender.close();
    });

    // bridge receiver - sending out to server
    oscReceiver.on("error", (err) => {
      const message = `server error:\n${err.stack}`;
      mainWindow.webContents.send("console-log", message);
      oscReceiver.close();
    });

    oscReceiver.on("message", (msg) => {
      const outgoing = {
        data: msg
      }
      socket.emit("control", outgoing);
    });

    oscReceiver.on("listening", () => {
        const address = oscReceiver.address();
        const message = `server listening on ${address.address}:${address.port}`;
        mainWindow.webContents.send("console-log", message);
    });

    oscReceiver.bind(7001);


    // ---------- end OSC bridge


    ipcMain.on("chat-message", (event, message) => {
      const outgoing = {
        content: message
      }
      socket.emit("chat-message", outgoing);
    });

    // ----------

    socket.on("control", incoming => {
      const msg = incoming;
      mainWindow.webContents.send("console-log", "Messages received " + msg);
      //oscSender.send(msg, 8000, 'localhost');
    });

    socket.on("chat-message", incoming => {
      mainWindow.webContents.send("chat-message", incoming);
    });

    socket.on("server-message", incoming => {
      mainWindow.webContents.send("server-message", incoming);
    });

    socket.on("confirm-username", incoming => {
      mainWindow.webContents.send("confirm-username", incoming);
    });

    socket.on("user-list", incoming => {
      mainWindow.webContents.send("user-list", incoming);
    });

  });

  // ----------

  /* ipcMain.on("launch-file", (event, fileName) => {
    shell.openPath(fileName);
    event.sender.send("launch-file-success", fileName);
  });*/

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