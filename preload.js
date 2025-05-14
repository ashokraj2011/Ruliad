const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('api', {
  openFile: (opts) => ipcRenderer.invoke('show-open-dialog', opts),
  showError: (msg) => ipcRenderer.send('show-error', msg),
  fs: {
    readFileSync: (file) => fs.readFileSync(file, 'utf8'),
    writeFileSync: (file, data) => fs.writeFileSync(file, data, 'utf8')
  },
  path: {
    join: (...args) => path.join(...args)
  }
});
