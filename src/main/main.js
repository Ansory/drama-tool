/**
 * src/main/main.js
 * Electron main process — entry point utama aplikasi DramaTool.
 * Menginisialisasi BrowserWindow, autoUpdater, dan semua IPC handler.
 */

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { initAutoUpdater, registerIpcHandlers, startPeriodicUpdateCheck } = require('../../autoUpdater');

// ── Konstanta ────────────────────────────────────────────────────────────────
const isDev = !app.isPackaged;
const VITE_DEV_SERVER_URL = 'http://localhost:5173';
const PRELOAD_PATH = path.join(__dirname, '../../preload.js');
const RENDERER_PATH = path.join(__dirname, '../../dist/renderer/index.html');

let mainWindow = null;

// ── Buat BrowserWindow ───────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'DramaTool',
    icon: path.join(__dirname, '../../assets/installer.ico'),
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,   // Wajib untuk keamanan
      nodeIntegration: false,   // Wajib untuk keamanan
      sandbox: false,           // Perlu false agar preload bisa require()
    },
    show: false, // Sembunyikan dulu sampai siap, hindari flash putih
    backgroundColor: '#0f0f0f',
  });

  // Tampilkan window setelah konten siap
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Load URL atau file HTML
  if (isDev) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(RENDERER_PATH);
  }

  // Buka link eksternal di browser default, bukan di window Electron
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
  // Daftarkan semua IPC handler sebelum window dibuat
  registerIpcHandlers();

  createWindow();

  // Inisialisasi auto updater setelah window siap tampil
  mainWindow.once('ready-to-show', () => {
    initAutoUpdater(mainWindow);
    startPeriodicUpdateCheck();
  });

  // macOS: buat ulang window jika di-klik dari dock
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Tutup app saat semua window ditutup (Windows & Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ── Security: blokir navigasi ke URL eksternal ───────────────────────────────
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, url) => {
    const allowedOrigins = [
      VITE_DEV_SERVER_URL,
      'file://',
    ];
    const isAllowed = allowedOrigins.some(origin => url.startsWith(origin));
    if (!isAllowed) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
});
