const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    openWebsite() {
      ipcRenderer.send('openWebsite');
    },
    quit() {
      ipcRenderer.send('save-state-exit');
    },
    printHTML(content) {
      ipcRenderer.send('printHTML', content);
    },
    confirm() {
      ipcRenderer.send('confirm');
    },
    openFile() {
      ipcRenderer.send('openFile');
    },
    saveFile(filename, value) {
      ipcRenderer.send('saveFile', { filename, value });
    },
    on(channel, func) {
      const validChannels = ['command', 'openFile', 'saveFile', 'confirm', 'update_available'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    once(channel, func) {
      const validChannels = ['command', 'openFile', 'saveFile', 'confirm', 'update_available'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (event, ...args) => func(...args));
      }
    },
    removeAllListeners(channel) {
      ipcRenderer.removeAllListeners(channel);
    },
  },
});
