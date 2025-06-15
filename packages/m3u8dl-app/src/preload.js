const { contextBridge, ipcRenderer } = require('electron');
const ipcEvents = {
  send: ['checkForUpdate', 'checkAppVersion'],
  receive: ['message', 'version', 'downloadProgress'],
};

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer,
  ipc: {
    send: (channel, data) => {
      if (ipcEvents.send.includes(channel)) ipcRenderer.send(channel, data);
    },
    on: (channel, func) => {
      if (ipcEvents.receive.includes(channel)) ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
  },
});
