const { autoUpdater } = require('electron-updater');
const { dialog, BrowserWindow, Notification } = require('electron');
const log = require('electron-log');
const Store = require('electron-store');

const store = new Store();
let updateCheckInterval = null;
let updateInProgress = false;

// Konfigurasi logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false; // Manual download, biar user yang memilih
autoUpdater.autoInstallOnAppQuit = true;

// Status update
let updateAvailableInfo = null;
let downloadProgress = 0;

// Setup auto-updater
function setupAutoUpdater(mainWindow) {
    
    // Cek update saat startup
    autoUpdater.checkForUpdatesAndNotify();
    
    // Cek update setiap 6 jam
    updateCheckInterval = setInterval(() => {
        if (store.get('settings.autoUpdate', true)) {
            autoUpdater.checkForUpdatesAndNotify();
        }
    }, 6 * 60 * 60 * 1000);
    
    // Event: Update tersedia
    autoUpdater.on('update-available', (info) => {
        updateAvailableInfo = info;
        
        // Kirim ke renderer
        mainWindow.webContents.send('update-available', {
            version: info.version,
            releaseDate: info.releaseDate,
            releaseNotes: info.releaseNotes
        });
        
        // Tampilkan notifikasi
        if (Notification.isSupported()) {
            new Notification({
                title: 'Update Tersedia!',
                body: `Drama Tool versi ${info.version} tersedia. Klik untuk update.`,
                icon: './assets/icon.png'
            }).show();
        }
        
        log.info(`Update available: ${info.version}`);
    });
    
    // Event: Update tidak tersedia
    autoUpdater.on('update-not-available', () => {
        log.info('No update available');
        mainWindow.webContents.send('update-not-available');
    });
    
    // Event: Download progress
    autoUpdater.on('download-progress', (progressObj) => {
        downloadProgress = progressObj.percent;
        
        mainWindow.webContents.send('update-download-progress', {
            percent: progressObj.percent,
            bytesPerSecond: progressObj.bytesPerSecond,
            transferred: progressObj.transferred,
            total: progressObj.total
        });
        
        log.info(`Download progress: ${progressObj.percent}%`);
    });
    
    // Event: Update selesai di-download
    autoUpdater.on('update-downloaded', (info) => {
        log.info(`Update downloaded: ${info.version}`);
        
        mainWindow.webContents.send('update-downloaded', {
            version: info.version
        });
        
        // Tampilkan dialog restart
        const result = dialog.showMessageBoxSync(mainWindow, {
            type: 'info',
            title: 'Update Siap Diinstall',
            message: `Update Drama Tool versi ${info.version} telah didownload.`,
            detail: 'Aplikasi akan restart untuk menyelesaikan instalasi.',
            buttons: ['Install Sekarang', 'Nanti Saja'],
            defaultId: 0,
            cancelId: 1
        });
        
        if (result === 0) {
            autoUpdater.quitAndInstall();
        }
    });
    
    // Event: Error
    autoUpdater.on('error', (err) => {
        log.error('Auto-updater error:', err);
        mainWindow.webContents.send('update-error', {
            message: err.message
        });
    });
    
    // Event: Check update selesai
    autoUpdater.on('checking-for-update', () => {
        mainWindow.webContents.send('checking-for-update');
    });
}

// Fungsi untuk memulai download update
function downloadUpdate() {
    if (updateInProgress) {
        return { success: false, message: 'Update already in progress' };
    }
    
    updateInProgress = true;
    autoUpdater.downloadUpdate();
    
    return { success: true, message: 'Download started' };
}

// Fungsi untuk install update (restart app)
function installUpdate() {
    autoUpdater.quitAndInstall();
}

// Fungsi untuk skip update (ignore version)
function skipUpdate(version) {
    store.set(`skippedVersion.${version}`, true);
    store.set('skippedVersionTimestamp', Date.now());
}

// Fungsi untuk cek apakah versi di-skip
function isVersionSkipped(version) {
    return store.get(`skippedVersion.${version}`, false);
}

// Fungsi untuk manual check update
function manualCheckUpdate() {
    return autoUpdater.checkForUpdatesAndNotify();
}

// Fungsi untuk get download progress
function getDownloadProgress() {
    return downloadProgress;
}

// Cleanup
function cleanupAutoUpdater() {
    if (updateCheckInterval) {
        clearInterval(updateCheckInterval);
        updateCheckInterval = null;
    }
}

module.exports = {
    setupAutoUpdater,
    downloadUpdate,
    installUpdate,
    skipUpdate,
    isVersionSkipped,
    manualCheckUpdate,
    getDownloadProgress,
    cleanupAutoUpdater
};