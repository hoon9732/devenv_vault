const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getWorkspacePath: () => ipcRenderer.invoke('get-workspace-path'),
  setWorkspacePath: () => ipcRenderer.invoke('set-workspace-path'),
  readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
  createDirectory: (path) => ipcRenderer.invoke('create-directory', path),
  renamePath: (oldPath, newPath) => ipcRenderer.invoke('rename-path', { oldPath, newPath }),
  copyPath: (sourcePath, destinationPath) => ipcRenderer.invoke('copy-path', { sourcePath, destinationPath }),
  movePath: (sourcePath, destinationPath) => ipcRenderer.invoke('move-path', { sourcePath, destinationPath }),
  deletePath: (path) => ipcRenderer.invoke('delete-path', path),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  deleteDirectory: (dirPath) => ipcRenderer.invoke('delete-directory', dirPath),
  openFileDialog: (multiSelect) =>
    ipcRenderer.invoke('open-file-dialog', multiSelect),
  saveFileContent: (filePath, content) =>
    ipcRenderer.invoke('save-file-content', { filePath, content }),
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),
  readProfile: () => ipcRenderer.invoke('read-profile'),
  writeProfile: (data) => ipcRenderer.invoke('write-profile', data),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getWorkspaceSettings: () => ipcRenderer.invoke('get-workspace-settings'),
  setWorkspaceSettings: (settings) =>
    ipcRenderer.invoke('set-workspace-settings', settings),
  getOutlineSettings: () => ipcRenderer.invoke('get-outline-settings'),
  setOutlineSettings: (settings) =>
    ipcRenderer.invoke('set-outline-settings', settings),
  openAboutWindow: (options) => ipcRenderer.invoke('open-about-window', options),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  readFileContent: (filePath) =>
    ipcRenderer.invoke('read-file-content', filePath),
});