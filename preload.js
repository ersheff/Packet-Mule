const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {

  requestConnection: username => ipcRenderer.send("request-connection", username),

  requestDisconnection: () => ipcRenderer.send("request-disconnection"),

  outgoingChat: message => ipcRenderer.send("outgoing-chat", message),

  confirmConnection: username => ipcRenderer.on("confirm-connection", username),

  connectedUsers: connectedUsers => ipcRenderer.on("connected-users", connectedUsers),

  serverMessage: message => ipcRenderer.on("server-message", message),

  bridgeMessage: message => ipcRenderer.on("bridge-message", message),

  incomingChat: message => ipcRenderer.on("incoming-chat", message),

  oscDataFromApp: data => ipcRenderer.on("osc-data-from-app", data)
  
});