/**
 * autoUpdater.js
 * Menangani semua logika auto-update di Electron main process.
 * FIXED: Tambah handler get-version (async), get-skipped-versions,
 *        dan skip-update menggunakan electron-store (bukan localStorage).
 */

const { autoUpdater } = require('electron-updater');
const { ipcMain, shell, app } = require('electron');
const Store = require('electron-store');
const store = new Store();

let mainWindow = null;

function initAutoUpdater(win) {
  mainWindow = win;

  // ── Konfigurasi ───────────────────────────────────────────────────────────
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // ── Event listeners dari electron-updater ─────────────────────────────────
  autoUpdater.on('update-available', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-download-progress', progress);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }
  });

  autoUpdater.on('error', (err) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-error', err.message);
    }
  });
}

function registerIpcHandlers() {
  // ── Config ──────────────────────────────────────────────────────────────
  ipcMain.handle('get-config', () => {
    return store.get('config', {
      autoUpdate: true,
      updateChannel: 'stable',
      checkInterval: 6,
    });
  });

  ipcMain.handle('update-config', (event, config) => {
    store.set('config', config);

    // Terapkan channel update langsung
    if (config.updateChannel) {
      autoUpdater.channel = config.updateChannel;
    }
    return true;
  });

  // FIXED: get-version sebagai IPC handler (async-safe)
  ipcMain.handle('get-version', () => {
    return app.getVersion();
  });

  // ── Update actions ────────────────────────────────────────────────────────
  ipcMain.handle('check-for-updates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return {
        updateAvailable: !!result?.updateInfo,
        version: result?.updateInfo?.version,
      };
    } catch (err) {
      console.error('Check for updates error:', err);
      return { updateAvailable: false };
    }
  });

  ipcMain.handle('download-update', () => {
    autoUpdater.downloadUpdate();
  });

  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  // FIXED: Simpan skipped versions di electron-store (bukan localStorage renderer)
  ipcMain.handle('get-skipped-versions', () => {
    return store.get('skippedVersions', []);
  });

  ipcMain.handle('skip-update', (event, version) => {
    const skipped = store.get('skippedVersions', []);
    if (!skipped.includes(version)) {
      skipped.push(version);
      store.set('skippedVersions', skipped);
    }
  });

  // ── Utilitas ──────────────────────────────────────────────────────────────
  ipcMain.handle('open-external', (event, url) => {
    shell.openExternal(url);
  });
}

/**
 * Cek update secara periodik sesuai interval dari config.
 * Dipanggil dari main.js setelah app ready.
 */
function startPeriodicUpdateCheck() {
  const config = store.get('config', { autoUpdate: true, checkInterval: 6 });

  if (!config.autoUpdate) return;

  const intervalMs = (config.checkInterval || 6) * 60 * 60 * 1000;

  // Cek pertama kali setelah 30 detik app berjalan
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(console.error);
  }, 30_000);

  // Cek berikutnya sesuai interval
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(console.error);
  }, intervalMs);
}

module.exports = { initAutoUpdater, registerIpcHandlers, startPeriodicUpdateCheck };
