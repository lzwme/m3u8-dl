const { contextBridge, ipcRenderer } = require('electron');
const ipcEvents = {
  send: new Set([
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
    'open-folder',
  ]),
  receive: new Set([
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
    'open-folder-result',
  ]),
};

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer,
  ipc: {
    send: (channel, data) => {
      if (ipcEvents.send.has(channel)) ipcRenderer.send(channel, data);
      else console.error(`Trying to send an invalid channel: ${channel}`);
    },
    on: (channel, func) => {
      if (ipcEvents.receive.has(channel)) ipcRenderer.on(channel, (event, ...args) => func(...args));
      else console.error(`Trying to receive an invalid channel: ${channel}`);
    },
    removeAllListeners: (channel) => {
      if (ipcEvents.receive.has(channel)) ipcRenderer.removeAllListeners(channel);
    },
  },
});
