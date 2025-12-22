const { contextBridge, ipcRenderer } = require("electron");

// Expose RPC functions to the renderer process
contextBridge.exposeInMainWorld("discordRPC", {
  updateState: (state) => ipcRenderer.send("rpc-update", state),
  onConnected: (callback) =>
    ipcRenderer.on("rpc-connected", (_, connected) => callback(connected)),
});

// Expose app info
contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,
  saveScreenshot: (dataUrl) => ipcRenderer.invoke("save-screenshot", dataUrl),
});
