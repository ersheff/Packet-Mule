// preload (isolated world)
const { contextBridge, ipcRenderer } = require("electron");

const pmcAPI = {
  
  // event listeners (coming from renderer, going to main)
  connect: username => ipcRenderer.send("connect", username),

  requestConductor: () => ipcRenderer.send("request-conductor"),

  chatMessage: message => ipcRenderer.send("chat-message", message),

  launchFile: fileName => ipcRenderer.send("launch-file", fileName),

  // event listeners (coming from main, going to renderer)
  onConfirmUsername: username => ipcRenderer.on("confirm-username", username),

  onConfirmConductor: (status) => ipcRenderer.on("confirm-conductor", status),
  
  onChatMessage: message => ipcRenderer.on("chat-message", message),

  onServerMessage: message => ipcRenderer.on("server-message", message),

  onUserList: userList => ipcRenderer.on("user-list", userList),

  onConsoleLog: message => ipcRenderer.on("console-log", message),

  onProgramOrder: programOrder => ipcRenderer.on("program-order", programOrder)

};

contextBridge.exposeInMainWorld("pmc", pmcAPI);