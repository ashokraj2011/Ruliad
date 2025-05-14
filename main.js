const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const remoteMain = require('@electron/remote/main');
remoteMain.initialize();

const path = require('path');
const config = require('./config'); // Import the configuration file

// Example usage of DB configuration
console.log(`Database Host: ${config.db.host}`);

// Example usage of API configuration
console.log(`API Timeout: ${config.api.timeout}`);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  remoteMain.enable(win.webContents);

  // Load the login screen first
  win.loadFile(path.join(__dirname, 'login.html'));
}

app.whenReady().then(createWindow);

ipcMain.handle('show-open-dialog', async (_, options) => dialog.showOpenDialog(options));
ipcMain.on('show-error', (_, message) => dialog.showErrorBox('Error', message));

