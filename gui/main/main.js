const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const { version } = require('../package.json');
const WinState = require('electron-win-state').default;

// --- Configuration Management ---
const configPath = path.join(app.getPath('userData'), 'config.json');

function readConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (error) {
    console.error('Error reading config file:', error);
  }
  return {}; // Return empty object if file doesn't exist or is corrupt
}

function writeConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error writing config file:', error);
  }
}
// --- End Configuration Management ---

// Force hardware acceleration
app.commandLine.appendSwitch('ignore-gpu-blacklist');

function createWindow() {
  const winState = new WinState({
    defaultWidth: 1200,
    defaultHeight: 800,
  });

  const win = new BrowserWindow({
    ...winState.winOptions,
    minWidth: 960,
    minHeight: 640,
    title: 'ICDV',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#ffffff', // Default to light mode color
      symbolColor: '#333333', // Default to light mode symbol color
      height: 40,
    },
    icon: path.join(__dirname, '../src/assets/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
    },
  });

  winState.manage(win);

  const startUrl =
    process.env.ELECTRON_START_URL ||
    url.format({
      pathname: path.join(__dirname, '../build/index.html'),
      protocol: 'file:',
      slashes: true,
    });
  win.loadURL(startUrl);
}

// IPC handler for updating title bar colors
ipcMain.on(
  'update-titlebar-colors',
  (event, { backgroundColor, symbolColor }) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      win.setTitleBarOverlay({
        color: backgroundColor,
        symbolColor: symbolColor,
        height: 40,
      });
    }
  },
);

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- IPC Handlers ---

// Get the stored workspace path
ipcMain.handle('get-workspace-path', () => {
  const config = readConfig();
  return config.workspacePath || null;
});

// --- Workspace Settings ---
const defaultWorkspaceSettings = {
  showIcons: true,
  showOnStart: false,
};

ipcMain.handle('get-workspace-settings', () => {
  const config = readConfig();
  return { ...defaultWorkspaceSettings, ...config.workspaceSettings };
});

ipcMain.handle('set-workspace-settings', (event, settings) => {
  const config = readConfig();
  config.workspaceSettings = { ...config.workspaceSettings, ...settings };
  writeConfig(config);
});

// --- Outline Settings ---
const defaultOutlineSettings = {
  showIcons: true,
  showOnStart: false,
};

ipcMain.handle('get-outline-settings', () => {
  const config = readConfig();
  return { ...defaultOutlineSettings, ...config.outlineSettings };
});

ipcMain.handle('set-outline-settings', (event, settings) => {
  const config = readConfig();
  config.outlineSettings = { ...config.outlineSettings, ...settings };
  writeConfig(config);
});
// --- End Outline Settings ---

// Open a dialog to select a new workspace path and save it
ipcMain.handle('set-workspace-path', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (canceled || filePaths.length === 0) {
    return null; // User cancelled the dialog
  }

  const newPath = filePaths[0];
  const config = readConfig();
  config.workspacePath = newPath;
  writeConfig(config);
  return newPath;
});

// Read the directory structure for the file explorer
ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const dirents = fs.readdirSync(dirPath, { withFileTypes: true });
    return dirents.map((dirent) => ({
      name: dirent.name,
      isDirectory: dirent.isDirectory(),
      path: path.join(dirPath, dirent.name),
    }));
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return []; // Return empty array on error
  }
});

// IPC handler for deleting a file
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    fs.unlinkSync(filePath);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    return { success: false, error: error.message };
  }
});

// IPC handler for deleting a directory
ipcMain.handle('delete-directory', async (event, dirPath) => {
  try {
    fs.rmdirSync(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    console.error(`Error deleting directory ${dirPath}:`, error);
    return { success: false, error: error.message };
  }
});

// IPC handler for opening a file dialog
ipcMain.handle('open-file-dialog', async (event, multiSelect = false) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', multiSelect ? 'multiSelections' : undefined].filter(Boolean),
    filters: [
      { name: 'ICD Files', extensions: ['icd', 'json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (canceled || filePaths.length === 0) {
    return null;
  }

  try {
    if (multiSelect) {
      return filePaths.map(filePath => ({
        content: fs.readFileSync(filePath, 'utf-8'),
        filePath,
      }));
    } else {
      const filePath = filePaths[0];
      const content = fs.readFileSync(filePath, 'utf-8');
      return { content, filePath };
    }
  } catch (error) {
    console.error('Failed to read file(s)', error);
    return null;
  }
});

// IPC handler for saving a file
ipcMain.handle(
  'save-file-content',
  async (event, { filePath, content }) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (error) {
      console.error('Failed to save file content:', error);
      return { success: false, error: error.message };
    }
  },
);

// IPC handler for saving a file
ipcMain.handle('save-file-dialog', async (event, { content, fileType }) => {
  const filters =
    fileType === 'icd'
      ? [{ name: 'ICD Project', extensions: ['icd'] }]
      : [{ name: 'JSON File', extensions: ['json'] }];

  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save File',
    filters,
  });

  if (canceled || !filePath) {
    return { success: false, error: 'Dialog canceled' };
  }

  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, filePath };
  } catch (error) {
    console.error('Failed to save file', error);
    return { success: false, error: error.message };
  }
});

// IPC handler for reading profile data
ipcMain.handle('read-profile', async () => {
  const userProfilePath = path.join(app.getPath('userData'), 'profile.json');
  const defaultProfilePath = path.join(__dirname, '../src/data/profile.json');

  try {
    // If the user profile doesn't exist, create it from the default.
    if (!fs.existsSync(userProfilePath)) {
      fs.copyFileSync(defaultProfilePath, userProfilePath);
    }
    const content = fs.readFileSync(userProfilePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Failed to read or create profile', error);
    // If all else fails, try to return the default profile directly.
    try {
      const content = fs.readFileSync(defaultProfilePath, 'utf-8');
      return content;
    } catch (defaultError) {
      console.error('Failed to read default profile', defaultError);
      return null;
    }
  }
});

// IPC handler for writing profile data
ipcMain.handle('write-profile', async (event, data) => {
  const userProfilePath = path.join(app.getPath('userData'), 'profile.json');
  try {
    fs.writeFileSync(userProfilePath, data, 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('Failed to write profile', error);
    return { success: false, error: error.message };
  }
});

// --- Settings ---
ipcMain.handle('get-settings', () => {
  const userSettingsPath = path.join(app.getPath('userData'), 'settings.json');
  const defaultSettingsPath = path.join(__dirname, '../src/data/settings.json');

  try {
    // If the user settings file doesn't exist, create it from the default.
    if (!fs.existsSync(userSettingsPath)) {
      fs.copyFileSync(defaultSettingsPath, userSettingsPath);
    }
    const content = fs.readFileSync(userSettingsPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to read or create settings.json', error);
    // If all else fails, try to return the default settings directly.
    try {
      const content = fs.readFileSync(defaultSettingsPath, 'utf-8');
      return JSON.parse(content);
    } catch (defaultError) {
      console.error('Failed to read default settings.json', defaultError);
      return null; // Return null if even the default is unreadable
    }
  }
});

ipcMain.handle('save-settings', (event, settings) => {
  const userSettingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    fs.writeFileSync(userSettingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error writing settings file:', error);
  }
});
// --- End Settings ---

// IPC handler for opening the about window
ipcMain.handle('open-about-window', (event, { theme, uiScale }) => {
  const aboutWin = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'About',
    frame: false,
    resizable: false,
    movable: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  // The path to about.html is different in dev vs. packaged app.
  const aboutPath = process.env.ELECTRON_START_URL
    ? path.join(__dirname, '../public/about.html')
    : path.join(__dirname, '../build/about.html');

  const aboutUrl = new URL('file:' + aboutPath);
  aboutUrl.searchParams.set('theme', theme);
  aboutUrl.searchParams.set('uiScale', uiScale);
  aboutWin.loadURL(aboutUrl.href);
});

ipcMain.handle('get-app-version', () => version);

// IPC handler for reading file content
ipcMain.handle('read-file-content', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return { success: false, error: error.message };
  }
});

// --- Window Controls ---
ipcMain.on('minimize-window', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.on('maximize-window', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});
