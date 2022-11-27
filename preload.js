// preload (isolated world)
const { contextBridge, ipcRenderer } = require("electron");

const pmcAPI = {
  
  // socket methods
  connect: (username) => ipcRenderer.send("connect", username),

  onConfirmUser: (callback) => ipcRenderer.on("confirm-user", callback),

  onMessage: (callback) => ipcRenderer.on("message", callback),

  onServerMessage: (callback) => ipcRenderer.on("server-message", callback),

  onUserList : (callback) => ipcRenderer.on("user-list", callback),

  // system methods
  launchFile: (fileName) => ipcRenderer.send("launch-file", f)

};

contextBridge.exposeInMainWorld("pmc", pmcAPI);