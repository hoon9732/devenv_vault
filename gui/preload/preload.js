const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  readProfile: () => ipcRenderer.invoke('read-profile'),
  writeProfile: (data) => ipcRenderer.invoke('write-profile', data),
  openAboutWindow: (theme) => ipcRenderer.invoke('open-about-window', theme),
  getWorkspacePath: () => ipcRenderer.invoke('get-workspace-path'),
  setWorkspacePath: () => ipcRenderer.invoke('set-workspace-path'),
  readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
  deleteFile: (path) => ipcRenderer.invoke('delete-file', path),
  deleteDirectory: (path) => ipcRenderer.invoke('delete-directory', path),
  getWorkspaceSettings: () => ipcRenderer.invoke('get-workspace-settings'),
  setWorkspaceSettings: (settings) =>
    ipcRenderer.invoke('set-workspace-settings', settings),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  updateTheme: (theme) => ipcRenderer.send('update-theme', theme),
  readFileContent: (path) => ipcRenderer.invoke('read-file-content', path),
  updateTitleBarColors: (colors) =>
    ipcRenderer.send('update-titlebar-colors', colors),
  pathJoin: (...paths) => require('path').join(...paths),
  pathDirname: (p) => require('path').dirname(p),
});
