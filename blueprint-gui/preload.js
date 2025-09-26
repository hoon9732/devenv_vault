const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  readProfile: () => ipcRenderer.invoke('read-profile'),
  writeProfile: (data) => ipcRenderer.invoke('write-profile', data),
  openHelpWindow: (theme) => ipcRenderer.invoke('open-help-window', theme),
});