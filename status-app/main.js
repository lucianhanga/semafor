// filepath: /home/lh/lgit/semafor/status-app/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 300, // Adjust width to fit controls
    height: 500, // Adjust height to fit controls
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
    frame: false, // Disable window frame
    resizable: true, // Allow window to be resizable
  });

  mainWindow.loadURL('http://localhost:3000'); // Load your React app
}

app.on('ready', createWindow);

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