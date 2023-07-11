const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { io } = require("socket.io-client");
const osc = require("osc");


function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.loadFile("index.html");

  ipcMain.on("request-connection", (event, username) => {
    const socket = io("http://localhost:3000", {
      query: {
        username: username
      }
    });
    
    const listenPort = 7000;
    const sendPort = 7001;

    const udpPort = new osc.UDPPort({
      localAddress: "localhost",
      localPort: listenPort,
      metadata: true
    });

    udpPort.on("error", (error) => {
      const message = `${error.message} Did you start your address with a '/'?`;
      mainWindow.webContents.send("bridge-message", message);
    });

    udpPort.on("message", (msg) => {
      const fullAddress = msg.address;
      const secondSlash = fullAddress.indexOf("/", 1);

      if (secondSlash < 1) {
        const message = "Invalid OSC message format: OSC address must start with a target username e.g. '/username/address'. Use 'all' for the username to send to all connected users.";
        mainWindow.webContents.send("bridge-message", message);
        return;
      }
      
      mainWindow.webContents.send("osc-data-from-app", msg);
      const targetUsername = fullAddress.slice(1, secondSlash);
      const shortenedAddress = fullAddress.slice(secondSlash);
      msg.address = shortenedAddress;
      const outgoing = {
        target: targetUsername,
        data: msg
      }
      socket.emit("data", outgoing);
    });

    udpPort.open();

    socket.on("data", message => {
      const fullAddress = `/${message.sender}${message.data.address}`;
      message.data.address = fullAddress;
      udpPort.send(message, "localhost", sendPort);;
    });

    socket.on("server-message", message => {
      mainWindow.webContents.send("server-message", message);
    });

    socket.on("confirm-connection", username => {
      mainWindow.webContents.send("confirm-connection", username);
    });

    socket.on("connected-users", connectedUsers => {
      mainWindow.webContents.send("connected-users", connectedUsers);
    });

    socket.on("chat", message => {
      mainWindow.webContents.send("incoming-chat", message);
    });

    ipcMain.on("outgoing-chat", (event, message) => {
      socket.emit("chat", message);
    });

    ipcMain.on("request-disconnection", (event) => {
      socket.disconnect();
    });

  });

}



app.whenReady().then(() => {
  createWindow();
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});


app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});