// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { io } = require("socket.io-client");

const homeDir = require('os').homedir();
const pmPath = process.platform === "win32" 
  ? `${homeDir}\\Documents\\PacketMule\\`
  : `${homeDir}/Documents/PacketMule/`;
const pmConfigPath = `${pmPath}pm-config.json`;

const pmConfig = fs.existsSync(pmConfigPath) ? JSON.parse(fs.readFileSync(pmConfigPath)) : null;
const programOrder = pmConfig ? Object.keys(pmConfig["concert"]) : null;

const osc = require("osc");

// create browser window and load index.html
function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  ipcMain.on("connect", (event, username) => {

    mainWindow.webContents.send("program-order", programOrder);

    const socket = io("http://192.168.0.159:3000", {
      query: {
        username: username
      }
    });

    // ----------
    // OSC bridge

    const listenPort = 7001;
    const sendPort = 8001;

    const udpPort = new osc.UDPPort({
      localAddress: "localhost",
      localPort: listenPort,
      metadata: true
    });

    // listen for incoming OSC messages.
    udpPort.on("message", (msg) => {
      const fullAddress = msg.address;
      const slashIndex = fullAddress.indexOf("/", 1);
      if (slashIndex > 0) {
        const targetUsername = fullAddress.slice(1, slashIndex);
        const shortAddress = fullAddress.slice(slashIndex);
        msg.address = shortAddress;
        const outgoing = {
          target: targetUsername,
          data: msg
        }
        socket.emit("control", outgoing);
      }
      else {
        const message = {
          sender: "OSC Bridge",
          content: "Invalid OSC message format." 
        };
        mainWindow.webContents.send("server-message", message);
      }
    });

    // ooen the socket
    udpPort.open();

    // send an OSC message when the port is ready
    udpPort.on("ready", () => {
      udpPort.send({
          address: "/handshake",
          args: [
              {
                  type: "i",
                  value: "1"
              }
          ]
      }, "localhost", sendPort);
    });

    // ---------- end OSC bridge  


    ipcMain.on("chat-message", (event, message) => {
      const outgoing = {
        content: message
      }
      socket.emit("chat-message", outgoing);
    });

    // ----------

    socket.on("control", incoming => {
      const sender = incoming.sender;
      const msg = incoming.data;
      const shortAddress = msg.address;
      const fullAddress = `/${sender}${shortAddress}`;
      msg.address = fullAddress;
      udpPort.send(msg, "localhost", 8001);
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