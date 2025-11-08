const { contextBridge, ipcRenderer } = require('electron');
const ipcEvents = {
  send: [
    'checkForUpdate',
    'checkAppVersion',
    'web-browser:load',
    'web-browser:stop',
    'web-browser:close',
    'web-browser:show',
    'web-browser:hide',
    'web-browser:go-back',
    'web-browser:go-forward',
    'web-browser:reload',
  ],
  receive: [
    'message',
    'version',
    'downloadProgress',
    'web-browser:m3u8-found',
    'web-browser:page-title',
    'web-browser:loading',
    'web-browser:error',
    'web-browser:navigation',
    'web-browser:url-changed',
    'web-browser:closed',
    'web-browser:navigation-state',
  ],
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
    removeAllListeners: (channel) => {
      if (ipcEvents.receive.includes(channel)) ipcRenderer.removeAllListeners(channel);
    },
  },
});
