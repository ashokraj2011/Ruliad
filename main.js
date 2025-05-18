const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const remoteMain = require('@electron/remote/main');
remoteMain.initialize();

const path = require('path');
const config = require('./config'); // Import the configuration file
const fs = require('fs');
const configFilePath = path.join(__dirname, 'config.json');

// Get the default environment configuration
const defaultEnv = config.defaultEnvironment;
const envConfig = config.environments[defaultEnv];

// Example usage of DB configuration
console.log(`Database Host: ${envConfig.db.host}`);

// Example usage of API configuration
console.log(`API Endpoint: ${envConfig.apis.ruleEngine}`);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true // Make sure remote module is enabled
    }
  });

  remoteMain.enable(win.webContents);

  // Skip the login screen and load the index.html directly
  win.loadFile(path.join(__dirname, 'index.html'));
  
  // Set username as 'admin' when the window is ready
  win.webContents.on('dom-ready', () => {
    win.webContents.executeJavaScript(`
      localStorage.setItem('loggedInUser', 'admin');
      console.log('Auto-login as admin');
    `);
  });
  
  // Open DevTools for debugging
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('show-open-dialog', async (_, options) => dialog.showOpenDialog(options));
ipcMain.on('show-error', (_, message) => dialog.showErrorBox('Error', message));

// Handle saving updated config from renderer
ipcMain.handle('save-config', async (_, newConfig) => {
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(newConfig, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    throw err;
  }
});

