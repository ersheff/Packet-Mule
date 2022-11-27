// preload (isolated world)
const { contextBridge, ipcRenderer } = require("electron");

const pmcAPI = {
  
  // event listeners (coming from renderer, going to main)
  connect: (username) => ipcRenderer.send("connect", username),

  chatMessage: (message) => ipcRenderer.send("chat-message", message),

  launchFile: (fileName) => ipcRenderer.send("launch-file", fileName),

  // event listeners (coming from main, going to renderer)
  onConfirmUsername: (username) => ipcRenderer.on("confirm-username", username),
  
  onChatMessage: (message) => ipcRenderer.on("chat-message", message),

  onServerMessage: (message) => ipcRenderer.on("server-message", message),

  onUserList: (userList) => ipcRenderer.on("user-list", userList),

  onConsoleLog: (message) => ipcRenderer.on("console-log", message)

};

contextBridge.exposeInMainWorld("pmc", pmcAPI);