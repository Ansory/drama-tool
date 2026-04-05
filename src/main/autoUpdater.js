const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');
const log = require('electron-log');

class AppUpdater {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.isChecking = false;
    
    // Setup logger
    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = 'info';
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Checking for update
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for update...');
      this.sendStatus('checking');
    });

    // Update available
    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      this.sendStatus('available', info);
      
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Update Tersedia',
        message: `Versi ${info.version} tersedia. Download sekarang?`,
        buttons: ['Download', 'Nanti'],
        defaultId: 0
      }).then(({ response }) => {
        if (response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
    });

    // Update not available
    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
      this.sendStatus('not-available', info);
    });

    // Error
    autoUpdater.on('error', (err) => {
      log.error('Error in auto-updater:', err);
      this.sendStatus('error', { message: err.message });
    });

    // Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      const percent = Math.round(progressObj.percent);
      log.info(`Download progress: ${percent}%`);
      this.sendStatus('progress', {
        percent: percent,
        speed: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total
      });
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      this.sendStatus('downloaded', info);
      
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Update Siap',
        message: 'Update telah di-download. Restart aplikasi sekarang?',
        buttons: ['Restart', 'Nanti'],
        defaultId: 0
      }).then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
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

  async checkForUpdates() {
    if (this.isChecking) {
      log.info('Already checking for updates');
      return;
    }
    
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
}

// Factory function untuk inisialisasi
function initAutoUpdater(mainWindow) {
  const updater = new AppUpdater(mainWindow);
  
  // Check updates setiap 1 jam
  setInterval(() => {
    updater.checkForUpdates();
  }, 60 * 60 * 1000);

  // Check saat startup (delay 5 detik)
  setTimeout(() => {
    updater.checkForUpdatesAndNotify();
  }, 5000);

  return updater;
}

module.exports = {
  AppUpdater,
  initAutoUpdater
};
