// Tambahkan di bagian atas file
const { 
    setupAutoUpdater, 
    downloadUpdate, 
    installUpdate, 
    skipUpdate,
    manualCheckUpdate 
} = require('./autoUpdater');

// Di dalam function createWindow(), tambahkan:
function createWindow() {
    // ... existing code ...
    
    // Setup auto-updater
    setupAutoUpdater(mainWindow);
    
    // ... existing code ...
}

// Di dalam setupIpcHandlers(), tambahkan:
function setupIpcHandlers() {
    // ... existing handlers ...
    
    // Auto-update handlers
    ipcMain.handle('check-for-updates', () => {
        return manualCheckUpdate();
    });
    
    ipcMain.handle('download-update', () => {
        return downloadUpdate();
    });
    
    ipcMain.handle('install-update', () => {
        installUpdate();
        return { success: true };
    });
    
    ipcMain.handle('skip-update', (event, version) => {
        skipUpdate(version);
        return { success: true };
    });
    
    ipcMain.handle('get-update-status', () => {
        return {
            updateAvailable: updateAvailableInfo,
            downloadProgress: getDownloadProgress()
        };
    });
    
    // ... existing handlers ...
}