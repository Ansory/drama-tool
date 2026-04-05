const { app, BrowserWindow, ipcMain, dialog, shell, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const Store = require('electron-store');

// Setup FFmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Initialize store
const store = new Store();

let mainWindow;

// ==================== DEBUG LOGGING ====================
function debugLog(msg, ...args) {
    console.log(`[DEBUG] ${msg}`, ...args);
    try {
        const logPath = path.join(app.getPath('userData'), 'debug.log');
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] ${msg} ${args.map(a => JSON.stringify(a)).join(' ')}\n`;
        fs.appendFileSync(logPath, logLine);
    } catch (e) {}
}

// ==================== WINDOW CREATION ====================
function createWindow() {
    debugLog('Creating window...');
    
    try {
        mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            minWidth: 1200,
            minHeight: 700,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js'),
                devTools: true
            },
            icon: path.join(__dirname, '../../assets/icon.ico'),
            title: 'Drama Tool',
            backgroundColor: '#0f0f0f',
            show: false,
            center: true
        });

        debugLog('Window created, id:', mainWindow.id);

        // DEVTOOLS AUTO-OPEN
        mainWindow.webContents.openDevTools({ mode: 'detach' });
        debugLog('DevTools opened');

        mainWindow.webContents.on('did-start-loading', () => {
            debugLog('Page started loading');
        });

        mainWindow.webContents.on('did-finish-load', () => {
            debugLog('Page finished loading');
            mainWindow.show();
            mainWindow.focus();
            debugLog('Window shown');
        });

        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
            debugLog('FAILED TO LOAD:', errorCode, errorDescription, validatedURL);
            dialog.showErrorBox('Load Error', `Error: ${errorDescription}\nCode: ${errorCode}`);
        });

        mainWindow.webContents.on('crashed', (event, killed) => {
            debugLog('RENDERER CRASHED:', killed);
            dialog.showErrorBox('Crash', 'Renderer crashed!');
        });

        mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
            debugLog(`CONSOLE [${level}]:`, message, `(${sourceId}:${line})`);
        });

        // Check paths
        const preloadPath = path.join(__dirname, 'preload.js');
        debugLog('Preload path:', preloadPath, 'Exists:', fs.existsSync(preloadPath));

        // Check index.html paths
        const possiblePaths = [
            path.join(__dirname, '../../dist/renderer/index.html'),
            path.join(process.resourcesPath, 'app/dist/renderer/index.html'),
            path.join(app.getAppPath(), 'dist/renderer/index.html'),
            path.join(__dirname, '../renderer/index.html')
        ];
        
        debugLog('Checking index.html paths...');
        let loadURL = null;
        for (const p of possiblePaths) {
            const exists = fs.existsSync(p);
            debugLog('Path:', p, 'Exists:', exists);
            if (exists && !loadURL) loadURL = p;
        }
        
        if (!loadURL) {
            debugLog('ERROR: No index.html found!');
            dialog.showErrorBox('Error', 'index.html not found!');
            return;
        }
        
        debugLog('Loading:', loadURL);
        mainWindow.loadFile(loadURL);

        // Fallback: force show after 3 seconds
        setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
                debugLog('Fallback: forcing window show');
                mainWindow.show();
                mainWindow.focus();
            }
        }, 3000);

    } catch (error) {
        debugLog('ERROR:', error.message);
        dialog.showErrorBox('Fatal Error', error.message);
    }
}

// ==================== IPC HANDLERS ====================
ipcMain.handle('store:get', async (event, key) => store.get(key, null));
ipcMain.handle('store:set', async (event, key, value) => { store.set(key, value); return { success: true }; });

const dummyHandler = async () => ({ success: false, error: 'Not implemented' });

const dummyChannels = [
    'video:get-info', 'watermark:detect', 'subtitle:detect',
    'thumbnail:extract', 'content:scrape-trends', 'fyp:predict',
    'audio:get-trending', 'hashtag:analyze', 'viral:check',
    'facebook:login', 'autogen:title', 'copyright:precheck',
    'backup:create', 'scheduler:list', 'team:list-members',
    'export:pdf', 'asset:list', 'audience:demographics',
    'comment:auto-reply', 'social:analyze-sentiment', 'affiliate:detect-products',
    'profit:calculate', 'loadbalancer:get-keys', 'get-pages',
    'repurpose:resize', 'burnout:track', 'template:get-all',
    'competitor:analyze', 'royalty:search', 'growth:track',
    'import:download', 'notify:send', 'get-recent-posts'
];

dummyChannels.forEach(channel => {
    ipcMain.handle(channel, dummyHandler);
});

// ==================== APP LIFECYCLE ====================
app.whenReady().then(() => {
    debugLog('App ready');
    createWindow();
});

app.on('window-all-closed', () => {
    debugLog('All windows closed');
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    debugLog('App activated');
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

process.on('uncaughtException', (error) => {
    debugLog('UNCAUGHT:', error.message);
});

console.log('[INIT] Main process started');
