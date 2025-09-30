const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  readProfile: () => ipcRenderer.invoke('read-profile'),
  writeProfile: (data) => ipcRenderer.invoke('write-profile', data),
  openHelpWindow: (theme) => ipcRenderer.invoke('open-help-window', theme),
  getWorkspacePath: () => ipcRenderer.invoke('get-workspace-path'),
  setWorkspacePath: () => ipcRenderer.invoke('set-workspace-path'),
  readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
  deleteFile: (path) => ipcRenderer.invoke('delete-file', path),
  deleteDirectory: (path) => ipcRenderer.invoke('delete-directory', path),
  getWorkspaceSettings: () => ipcRenderer.invoke('get-workspace-settings'),
  setWorkspaceSettings: (settings) => ipcRenderer.invoke('set-workspace-settings', settings),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  pathJoin: (...paths) => require('path').join(...paths),
  pathDirname: (p) => require('path').dirname(p),
});