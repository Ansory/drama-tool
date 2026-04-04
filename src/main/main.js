'use strict';

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// ── Single instance lock ─────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

const { initAutoUpdater, registerIpcHandlers, startPeriodicUpdateCheck } = require('../../autoUpdater.js');

const isDev = !app.isPackaged;
const VITE_DEV_SERVER_URL = 'http://localhost:5173';

let mainWindow = null;

function createWindow() {
  // Jangan buat window baru kalau sudah ada
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'DramaTool',
    webPreferences: {
      preload: path.join(__dirname, '../../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
    backgroundColor: '#0f0f0f',
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools();
    initAutoUpdater(mainWindow);
    startPeriodicUpdateCheck();
  });

  // Load renderer
  if (isDev) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // app.getAppPath() mengarah ke folder app.asar setelah di-package
    const rendererPath = path.join(app.getAppPath(), 'dist', 'renderer', 'index.html');
    mainWindow.loadFile(rendererPath).catch(err => {
      console.error('Gagal load renderer dari:', rendererPath, err);
      mainWindow.loadURL(
        'data:text/html,<h2 style="color:red">Error load UI</h2><pre>' +
        err.toString() + '</pre><p>Path: ' + rendererPath + '</p>'
      );
    });
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  // Fokus ke window yang sudah ada jika instance kedua dibuka
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, url) => {
    const allowed = [VITE_DEV_SERVER_URL, 'file://'];
    if (!allowed.some(o => url.startsWith(o))) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
});
