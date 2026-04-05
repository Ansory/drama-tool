const { autoUpdater } = require('electron-updater');
const { dialog, ipcMain } = require('electron');
const log = require('electron-log');

let updaterInstance = null;
let skippedVersions = [];

class AppUpdater {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.isChecking = false;
    this.downloadedUpdate = null;
    
    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = 'info';
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for update...');
      this.sendStatus('checking');
    });

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      this.sendStatus('available', info);
      this.sendEvent('updater:update-available', info);
    });

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
      this.sendStatus('not-available', info);
    });

    autoUpdater.on('error', (err) => {
      log.error('Error in auto-updater:', err);
      this.sendStatus('error', { message: err.message });
      this.sendEvent('updater:error', { message: err.message });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const percent = Math.round(progressObj.percent);
      log.info(`Download progress: ${percent}%`);
      this.sendStatus('progress', {
        percent: percent,
        speed: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total
      });
      this.sendEvent('updater:download-progress', {
        percent: percent,
        speed: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      this.downloadedUpdate = info;
      this.sendStatus('downloaded', info);
      this.sendEvent('updater:update-downloaded', info);
    });
  }

  sendStatus(status, data = {}) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-status', {
        status: status,
        data: data,
        timestamp: new Date().toISOString()
      });
    }
  }

  sendEvent(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  async checkForUpdates() {
    if (this.isChecking) return;
    try {
      this.isChecking = true;
      log.info('Starting update check...');
      await autoUpdater.checkForUpdates();
    } catch (error) {
      log.error('Failed to check for updates:', error);
      this.sendStatus('error', { message: error.message });
    } finally {
      this.isChecking = false;
    }
  }

  async checkForUpdatesAndNotify() {
    try {
      log.info('Checking for updates and notify...');
      await autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      log.error('Failed to check for updates:', error);
    }
  }

  async downloadUpdate() {
    try {
      log.info('Starting download update...');
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      log.error('Failed to download update:', error);
      return { success: false, error: error.message };
    }
  }

  async installUpdate() {
    try {
      log.info('Installing update...');
      autoUpdater.quitAndInstall();
      return { success: true };
    } catch (error) {
      log.error('Failed to install update:', error);
      return { success: false, error: error.message };
    }
  }
}

function initAutoUpdater(mainWindow) {
  updaterInstance = new AppUpdater(mainWindow);
  return updaterInstance;
}

function registerIpcHandlers() {
  ipcMain.handle('updater:check', async () => {
    if (updaterInstance) {
      await updaterInstance.checkForUpdates();
      return { success: true };
    }
    return { success: false, error: 'Updater not initialized' };
  });

  ipcMain.handle('updater:get-config', async () => ({
    autoCheck: true,
    autoDownload: false,
    channel: 'latest'
  }));

  ipcMain.handle('updater:update-config', async (event, config) => {
    log.info('Update config:', config);
    return { success: true };
  });

  ipcMain.handle('updater:get-version', async () => ({
    current: autoUpdater.currentVersion?.version || '1.0.0',
    latest: null,
    updateAvailable: false
  }));

  ipcMain.handle('updater:get-skipped-versions', async () => skippedVersions);

  ipcMain.handle('updater:skip-update', async (event, version) => {
    if (version && !skippedVersions.includes(version)) {
      skippedVersions.push(version);
    }
    return { success: true };
  });

  ipcMain.handle('updater:download-update', async () => {
    if (updaterInstance) {
      return await updaterInstance.downloadUpdate();
    }
    return { success: false, error: 'Updater not initialized' };
  });

  ipcMain.handle('updater:install-update', async () => {
    if (updaterInstance) {
      return await updaterInstance.installUpdate();
    }
    return { success: false, error: 'Updater not initialized' };
  });
}

function startPeriodicUpdateCheck() {
  if (!updaterInstance) {
    log.warn('Cannot start periodic check: updater not initialized');
    return;
  }

  setInterval(() => {
    updaterInstance.checkForUpdates();
  }, 60 * 60 * 1000);

  setTimeout(() => {
    updaterInstance.checkForUpdatesAndNotify();
  }, 5000);
}

module.exports = {
  AppUpdater,
  initAutoUpdater,
  registerIpcHandlers,
  startPeriodicUpdateCheck
};
