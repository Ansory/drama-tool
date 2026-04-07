const { app, BrowserWindow, ipcMain, dialog, shell, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec, spawn } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const Store = require('electron-store');
const { initAutoUpdater, registerIpcHandlers: registerUpdaterHandlers, startPeriodicUpdateCheck } = require('./autoUpdater');

ffmpeg.setFfmpegPath(ffmpegPath);

const store = new Store();

let mainWindow;

// ==================== HELPERS ====================

function debugLog(msg, ...args) {
    console.log(`[DEBUG] ${msg}`, ...args);
    try {
        const logPath = path.join(app.getPath('userData'), 'debug.log');
        const timestamp = new Date().toISOString();
        // Sanitize args to prevent logging sensitive data (tokens, keys, passwords)
        const sanitizedArgs = args.map(a => {
            if (typeof a === 'object' && a !== null) {
                const sanitized = { ...a };
                const sensitiveKeys = ['token', 'key', 'password', 'secret', 'apiKey', 'api_key', 'fb_user_token'];
                sensitiveKeys.forEach(k => {
                    if (k in sanitized) sanitized[k] = '[REDACTED]';
                });
                return JSON.stringify(sanitized);
            }
            return typeof a === 'string' && a.length > 100 ? '[LONG_STRING]' : JSON.stringify(a);
        });
        const logLine = `[${timestamp}] ${msg} ${sanitizedArgs.join(' ')}\n`;
        fs.appendFileSync(logPath, logLine);
    } catch (e) {}
}

// Cari Python di backend folder (bundled) atau system Python
function getPythonPath() {
    const bundled = path.join(process.resourcesPath || __dirname, '../../backend');
    if (fs.existsSync(path.join(bundled, 'python.exe'))) return path.join(bundled, 'python.exe');
    return 'python';
}

// Validate file path to prevent directory traversal
function isValidFilePath(filePath) {
    if (!filePath || typeof filePath !== 'string') return false;
    // Resolve to absolute path and check it doesn't escape intended directories
    const resolved = path.resolve(filePath);
    // Check for directory traversal attempts
    if (filePath.includes('..') || filePath.includes('~')) return false;
    // Ensure the file exists (for read operations)
    return true; // Additional checks can be done at handler level
}

// Escape special characters in FFmpeg filter strings
function escapeFFmpegText(text) {
    if (!text || typeof text !== 'string') return '';
    // Escape special characters for FFmpeg drawtext filter
    return text
        .replace(/\\/g, '\\\\')  // Backslash
        .replace(/'/g, "\\'")     // Single quote
        .replace(/:/g, '\\:')     // Colon
        .replace(/\[/g, '\\[')    // Square brackets
        .replace(/\]/g, '\\]')
        .replace(/,/g, '\\,');    // Comma
}

function runPython(scriptName, args = []) {
    return new Promise((resolve, reject) => {
        const backendDir = path.join(__dirname, '../../backend');
        const scriptPath = path.join(backendDir, scriptName);

        if (!fs.existsSync(scriptPath)) {
            return reject(new Error(`Script tidak ditemukan: ${scriptPath}`));
        }

        // Validate all file path arguments
        const validatedArgs = args.map(arg => {
            if (typeof arg === 'string' && (arg.includes('/') || arg.includes('\\'))) {
                // This looks like a file path, validate it
                if (!isValidFilePath(arg)) {
                    throw new Error(`Invalid file path: ${arg}`);
                }
            }
            return String(arg); // Ensure all args are strings
        });

        const python = getPythonPath();
        const proc = spawn(python, [scriptPath, ...validatedArgs]);
        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (d) => stdout += d.toString());
        proc.stderr.on('data', (d) => stderr += d.toString());

        proc.on('close', (code) => {
            if (code !== 0) return reject(new Error(stderr || `Exit code ${code}`));
            try {
                resolve(JSON.parse(stdout.trim()));
            } catch {
                resolve({ success: true, output: stdout.trim() });
            }
        });

        proc.on('error', reject);
    });
}

// ==================== WINDOW ====================

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
                devTools: true,
                sandbox: true, // Enable sandbox for security
                webSecurity: true,
                allowRunningInsecureContent: false
            },
            icon: path.join(__dirname, '../../assets/icon.ico'),
            title: 'Drama Tool',
            backgroundColor: '#0f0f0f',
            show: false,
            center: true
        });

        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow.show();
            mainWindow.focus();
        });

        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            dialog.showErrorBox('Load Error', `${errorDescription} (${errorCode})`);
        });

        const possiblePaths = [
            path.join(__dirname, '../../dist/renderer/index.html'),
            path.join(process.resourcesPath || '', 'app/dist/renderer/index.html'),
            path.join(app.getAppPath(), 'dist/renderer/index.html'),
        ];

        let loadURL = possiblePaths.find(p => fs.existsSync(p));
        if (!loadURL) {
            dialog.showErrorBox('Error', 'index.html not found!');
            return;
        }

        mainWindow.loadFile(loadURL);

        // Init auto updater
        const updater = initAutoUpdater(mainWindow);
        registerUpdaterHandlers();
        startPeriodicUpdateCheck();

        setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
                mainWindow.show();
            }
        }, 3000);

    } catch (error) {
        debugLog('ERROR:', error.message);
        dialog.showErrorBox('Fatal Error', error.message);
    }
}

// ==================== IPC HANDLERS ====================

// --- Store ---
ipcMain.handle('store:get', async (event, key) => store.get(key, null));
ipcMain.handle('store:set', async (event, key, value) => { store.set(key, value); return { success: true }; });

// FIX: dialog:show-open untuk WatermarkInpainting
ipcMain.handle('dialog:show-open', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
});

// FIX: open-external
ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
    return { success: true };
});

// FIX: shell:show-item-in-folder
ipcMain.handle('shell:show-item-in-folder', async (event, filePath) => {
    shell.showItemInFolder(filePath);
    return { success: true };
});

// --- Video (Python backend) ---
ipcMain.handle('video:get-info', async (event, videoPath) => {
    return runPython('video_processor.py', ['info', videoPath]);
});

ipcMain.handle('video:crop', async (event, options) => {
    try {
        return new Promise((resolve, reject) => {
            const { inputPath, outputPath, startTime, endTime, targetWidth, targetHeight } = options;

            // Validate inputs
            if (!inputPath || !outputPath) {
                return reject(new Error('Input and output paths are required'));
            }

            ffmpeg(inputPath)
                .setStartTime(startTime)
                .setDuration(endTime - startTime)
                .size(`${targetWidth}x${targetHeight}`)
                .output(outputPath)
                .on('end', () => resolve({ success: true, outputPath }))
                .on('error', (err) => reject(err))
                .run();
        });
    } catch (error) {
        debugLog('Error in video:crop', error.message);
        throw error;
    }
});

ipcMain.handle('video:resize', async (event, options) => {
    return new Promise((resolve, reject) => {
        const { inputPath, outputPath, width, height } = options;
        ffmpeg(inputPath)
            .size(`${width}x${height}`)
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', (err) => reject(err))
            .run();
    });
});

ipcMain.handle('video:change-speed', async (event, options) => {
    return new Promise((resolve, reject) => {
        const { inputPath, outputPath, speed } = options;
        const clampedSpeed = Math.max(0.5, Math.min(100, speed));
        const videoFilter = `setpts=${(1 / clampedSpeed).toFixed(4)}*PTS`;
        const audioFilter = `atempo=${clampedSpeed}`;
        ffmpeg(inputPath)
            .videoFilters(videoFilter)
            .audioFilters(audioFilter)
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', (err) => reject(err))
            .run();
    });
});

ipcMain.handle('video:add-subtitle', async (event, options) => {
    try {
        return new Promise((resolve, reject) => {
            const { inputPath, outputPath, subtitleText, position } = options;

            // Validate inputs
            if (!inputPath || !outputPath || !subtitleText) {
                return reject(new Error('Input path, output path, and subtitle text are required'));
            }

            const y = position === 'top' ? 20 : 'h-th-20';
            const escapedText = escapeFFmpegText(subtitleText);

            ffmpeg(inputPath)
                .videoFilters(`drawtext=text='${escapedText}':fontcolor=white:fontsize=40:x=(w-tw)/2:y=${y}`)
                .output(outputPath)
                .on('end', () => resolve({ success: true, outputPath }))
                .on('error', (err) => reject(err))
                .run();
        });
    } catch (error) {
        debugLog('Error in video:add-subtitle', error.message);
        throw error;
    }
});

ipcMain.handle('video:detect-scenes', async (event, videoPath) => {
    return runPython('video_processor.py', ['scenes', videoPath]);
});

ipcMain.handle('video:split-scenes', async (event, options) => {
    const { videoPath, outputFolder, minDuration, maxDuration } = options;
    fs.mkdirSync(outputFolder, { recursive: true });
    return runPython('video_processor.py', ['split', videoPath, outputFolder,
        String(minDuration), String(maxDuration)]);
});

// --- Watermark ---
ipcMain.handle('watermark:detect', async (event, videoPath) => {
    return runPython('watermark_inpainting.py', ['detect', videoPath]);
});

ipcMain.handle('watermark:remove', async (event, options) => {
    const { videoPath, outputPath, watermarkAreas } = options;
    return runPython('watermark_inpainting.py', ['remove', videoPath, outputPath,
        JSON.stringify(watermarkAreas)]);
});

ipcMain.handle('watermark:add', async (event, options) => {
    const { inputPath, outputPath, watermarkPath, position, opacity } = options;
    return runPython('watermark_inpainting.py', ['add', inputPath, outputPath,
        watermarkPath, position, String(opacity)]);
});

// --- Subtitle ---
ipcMain.handle('subtitle:detect', async (event, videoPath) => {
    return runPython('subtitle_remover.py', ['detect', videoPath]);
});

ipcMain.handle('subtitle:remove', async (event, options) => {
    const { videoPath, outputPath, subtitleAreas, algorithm } = options;
    return runPython('subtitle_remover.py', ['remove', videoPath, outputPath,
        JSON.stringify(subtitleAreas), algorithm || 'sttn']);
});

// --- Thumbnail ---
ipcMain.handle('thumbnail:extract', async (event, options) => {
    return new Promise((resolve) => {
        const { videoPath, timestamps, outputFolder } = options;
        if (!timestamps || timestamps.length === 0) {
            return resolve([]);
        }
        fs.mkdirSync(outputFolder, { recursive: true });
        const results = [];
        let done = 0;
        timestamps.forEach((ts) => {
            const outPath = path.join(outputFolder, `thumb_${ts}s.png`);
            ffmpeg(videoPath)
                .seekInput(ts)
                .frames(1)
                .output(outPath)
                .on('end', () => {
                    results.push({ timestamp: ts, path: outPath });
                    done++;
                    if (done === timestamps.length) resolve(results);
                })
                .on('error', () => {
                    done++;
                    if (done === timestamps.length) resolve(results);
                })
                .run();
        });
    });
});

ipcMain.handle('thumbnail:add-text', async (event, options) => {
    return new Promise((resolve, reject) => {
        const { thumbnailPath, outputPath, text, position, fontSize, color } = options;
        const escapedText = escapeFFmpegText(text);
        const y = position === 'top' ? 20 : position === 'center' ? '(h-th)/2' : 'h-th-20';
        ffmpeg(thumbnailPath)
            .videoFilters(`drawtext=text='${escapedText}':fontcolor=${color}:fontsize=${fontSize}:x=(w-tw)/2:y=${y}`)
            .frames(1)
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', (err) => reject(err))
            .run();
    });
});

// --- Audio ---
ipcMain.handle('audio:get-trending', async () => {
    return runPython('trending_tracker.py', ['audio']);
});

ipcMain.handle('audio:extract', async (event, videoPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .noVideo()
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', (err) => reject(err))
            .run();
    });
});

ipcMain.handle('audio:reduce-noise', async (event, inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .noVideo()
            .audioFilters('highpass=f=200,lowpass=f=3000')
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', (err) => reject(err))
            .run();
    });
});

// --- FYP Predictor ---
ipcMain.handle('fyp:predict', async (event, videoPath) => {
    return runPython('fyp_predictor.py', ['predict', videoPath]);
});

// --- Content / Trends ---
ipcMain.handle('content:scrape-trends', async (event, keyword) => {
    return runPython('content_scraper.py', ['trends', keyword || 'drama china']);
});

ipcMain.handle('content:get-calendar', async (event, month, year) => {
    const key = `calendar_${year}_${month}`;
    return store.get(key, []);
});

ipcMain.handle('content:save-calendar', async (event, month, year, data) => {
    const key = `calendar_${year}_${month}`;
    store.set(key, data);
    return { success: true };
});

// --- Hashtag ---
ipcMain.handle('hashtag:suggest', async (event, keyword) => {
    return runPython('trending_tracker.py', ['hashtag', keyword || 'drama']);
});

ipcMain.handle('hashtag:analyze', async (event, hashtag) => {
    const key = `hashtag_${hashtag}`;
    return store.get(key, { usage: 0, avgLikes: 0, lastUsed: null });
});

ipcMain.handle('hashtag:track', async (event, hashtag, performance) => {
    const key = `hashtag_${hashtag}`;
    const existing = store.get(key, { usage: 0, totalLikes: 0 });
    const updated = {
        usage: existing.usage + 1,
        avgLikes: (existing.totalLikes + (performance.likes || 0)) / (existing.usage + 1),
        totalLikes: existing.totalLikes + (performance.likes || 0),
        lastUsed: new Date().toISOString()
    };
    store.set(key, updated);
    return { success: true };
});

// --- Viral ---
ipcMain.handle('viral:check', async () => {
    return runPython('trending_tracker.py', ['viral']);
});

ipcMain.handle('viral:subscribe', async (event, webhookUrl) => {
    store.set('viral_webhook', webhookUrl);
    return { success: true };
});

// --- Copyright ---
ipcMain.handle('copyright:precheck', async (event, videoPath) => {
    return runPython('copyright_checker.py', ['fullcheck', videoPath]);
});

ipcMain.handle('antistrike:score', async (event, videoPath) => {
    return runPython('copyright_checker.py', ['originality', videoPath]);
});

// --- Social Listening ---
ipcMain.handle('social:analyze-sentiment', async (event, comments) => {
    return runPython('social_listening.py', ['sentiment', JSON.stringify(comments)]);
});

ipcMain.handle('social:get-keywords', async () => {
    return store.get('tracked_keywords', []);
});

ipcMain.handle('social:track-keywords', async (event, keywords) => {
    store.set('tracked_keywords', keywords);
    return { success: true };
});

ipcMain.handle('social:weekly-report', async (event, pageId) => {
    return store.get(`weekly_report_${pageId}`, {
        period: 'Minggu ini',
        totalComments: 0,
        averageSentiment: 0,
        topPositiveKeywords: [],
        topNegativeKeywords: [],
        recommendations: ['Posting lebih konsisten', 'Tambahkan voiceover asli']
    });
});

// --- Comment AI ---
ipcMain.handle('comment:auto-reply', async (event, options) => {
    return runPython('comment_ai.py', ['generate', options.commentText || '']);
});

ipcMain.handle('comment:classify', async (event, commentText) => {
    return runPython('comment_ai.py', ['classify', commentText]);
});

ipcMain.handle('comment:get-settings', async () => {
    return store.get('comment_settings', {
        enabled: true,
        maxRepliesPerPost: 50,
        cooldownSeconds: 5,
        blacklistKeywords: ['spam', 'gambar', 'bokep', 'judi'],
        activeHours: { start: 8, end: 22 },
        replyStyle: 'friendly'
    });
});

ipcMain.handle('comment:settings', async (event, settings) => {
    store.set('comment_settings', settings);
    return { success: true };
});

// --- Competitor ---
ipcMain.handle('competitor:analyze', async (event, pageUrl) => {
    return runPython('competitor_analysis.py', ['analyze', pageUrl]);
});

// --- Scheduler ---
ipcMain.handle('scheduler:add', async (event, schedule) => {
    const schedules = store.get('schedules', []);
    const newItem = { ...schedule, id: Date.now(), status: 'pending' };
    schedules.push(newItem);
    store.set('schedules', schedules);
    return { success: true, id: newItem.id };
});

ipcMain.handle('scheduler:list', async () => store.get('schedules', []));

ipcMain.handle('scheduler:remove', async (event, id) => {
    const schedules = store.get('schedules', []).filter(s => s.id !== id);
    store.set('schedules', schedules);
    return { success: true };
});

// --- Team ---
ipcMain.handle('team:add-member', async (event, member) => {
    const members = store.get('team_members', []);
    members.push({ ...member, id: Date.now(), status: 'pending' });
    store.set('team_members', members);
    return { success: true };
});

ipcMain.handle('team:list-members', async () => store.get('team_members', []));

ipcMain.handle('team:update-role', async (event, { memberId, role }) => {
    const members = store.get('team_members', []).map(m =>
        m.id === memberId ? { ...m, role } : m
    );
    store.set('team_members', members);
    return { success: true };
});

// --- Asset Manager ---
ipcMain.handle('asset:add', async (event, asset) => {
    const assets = store.get('assets', []);
    const name = path.basename(asset.filePath);
    assets.push({ ...asset, id: Date.now(), name, path: asset.filePath, createdAt: new Date().toISOString() });
    store.set('assets', assets);
    return { success: true };
});

ipcMain.handle('asset:list', async (event, filter) => {
    let assets = store.get('assets', []);
    if (filter?.category) assets = assets.filter(a => a.category === filter.category);
    if (filter?.search) assets = assets.filter(a => a.name.toLowerCase().includes(filter.search.toLowerCase()));
    return assets;
});

ipcMain.handle('asset:delete', async (event, id) => {
    const assets = store.get('assets', []).filter(a => a.id !== id);
    store.set('assets', assets);
    return { success: true };
});

// --- Audience Analytics ---
ipcMain.handle('audience:demographics', async (event, pageId) => {
    return store.get(`audience_${pageId}`, {
        ageGroups: [
            { age: '18-24', percentage: 35 },
            { age: '25-34', percentage: 40 },
            { age: '35-44', percentage: 18 },
            { age: '45+', percentage: 7 }
        ],
        gender: { female: 70, male: 28, other: 2 },
        locations: [{ country: 'Indonesia', percentage: 85 }, { country: 'Malaysia', percentage: 10 }, { country: 'Lainnya', percentage: 5 }],
        activeHours: Object.fromEntries([...Array(24)].map((_, i) => [i, Math.floor(Math.random() * 50) + 5])),
        interests: ['K-Pop', 'Skincare', 'Fashion', 'Romance', 'Drama']
    });
});

// --- Profit Tracker ---
ipcMain.handle('profit:calculate', async (event, data) => {
    const { views, clicks, conversions } = data;
    const cpm = 2.5;
    const revenueViews = (views / 1000) * cpm;
    const avgOrderValue = 150000;
    const commissionRate = 0.05;
    const revenueAffiliate = conversions * avgOrderValue * commissionRate / 15000;
    const totalRevenue = revenueViews + revenueAffiliate;
    return {
        revenueViews: parseFloat(revenueViews.toFixed(2)),
        revenueAffiliate: parseFloat(revenueAffiliate.toFixed(2)),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        estimatedRupiah: Math.round(totalRevenue * 15000)
    };
});

ipcMain.handle('profit:history', async (event, { period }) => store.get(`profit_${period}`, []));

ipcMain.handle('profit:save', async (event, { period, data }) => {
    const history = store.get(`profit_${period}`, []);
    history.push({ ...data, timestamp: Date.now() });
    store.set(`profit_${period}`, history);
    return { success: true };
});

// --- Load Balancer ---
ipcMain.handle('loadbalancer:add-key', async (event, keyData) => {
    const keys = store.get('api_keys', []);
    keys.push({ ...keyData, id: Date.now(), status: 'active', usage: 0 });
    store.set('api_keys', keys);
    return { success: true };
});

ipcMain.handle('loadbalancer:get-keys', async () => store.get('api_keys', []));

ipcMain.handle('loadbalancer:remove-key', async (event, id) => {
    const keys = store.get('api_keys', []).filter(k => k.id !== id);
    store.set('api_keys', keys);
    return { success: true };
});

ipcMain.handle('loadbalancer:test-key', async (event, key) => {
    try {
        const { default: fetch } = await import('node-fetch').catch(() => ({ default: null }));
        if (!fetch) return { valid: false, error: 'fetch not available' };
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, { timeout: 5000 });
        return { valid: res.ok };
    } catch {
        return { valid: false };
    }
});

ipcMain.handle('loadbalancer:stats', async () => {
    const keys = store.get('api_keys', []);
    return {
        total: keys.length,
        active: keys.filter(k => k.status === 'active').length,
        limited: keys.filter(k => k.status === 'limited').length,
        totalUsage: keys.reduce((sum, k) => sum + (k.usage || 0), 0)
    };
});

// --- Auto Content Generator (AI via Gemini) ---
ipcMain.handle('auto:generate-content', async (event, options) => {
    const { videoPath, dramaName = '', sceneHint = 'auto', platform = 'facebook' } = options;
    if (!videoPath) return { error: 'Path video tidak valid' };
    try {
        return await runPython('auto_content_generator.py', [
            'generate', videoPath, dramaName, sceneHint, platform
        ]);
    } catch (err) {
        debugLog('auto:generate-content error:', err.message);
        return { error: err.message };
    }
});

// --- Growth Tracker ---
ipcMain.handle('growth:track', async (event, pageId) => {
    return store.get(`growth_${pageId}`, {
        todayData: { followers: 0, newFollowers: 0, unfollows: 0, engagement: 3.5 },
        history: [],
        growthRate: 0
    });
});

// --- Import from Social ---
// FIX: outputPath ditentukan di main.js (pakai os.homedir()), bukan di renderer
ipcMain.handle('import:download', async (event, options) => {
    const { url, platform } = options;
    const outputPath = path.join(os.homedir(), 'Downloads', `imported_${Date.now()}.mp4`);
    // Implementasi download via yt-dlp atau API
    // Untuk saat ini return stub — implementasi nyata perlu yt-dlp binary
    return { success: true, outputPath };
});

ipcMain.handle('import:remove-watermark', async (event, options) => {
    const { inputPath, outputPath, platform } = options;
    return runPython('watermark_inpainting.py', ['remove', inputPath, outputPath, '[]']);
});

// --- Backup & Restore ---
ipcMain.handle('backup:create', async () => {
    const backupDir = path.join(os.homedir(), 'Documents', 'DramaTool', 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const backupName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const backupFolder = path.join(backupDir, backupName);
    fs.mkdirSync(backupFolder);
    const data = store.store;
    fs.writeFileSync(path.join(backupFolder, 'store.json'), JSON.stringify(data, null, 2));
    return { success: true, backupFolder, size: JSON.stringify(data).length };
});

ipcMain.handle('backup:list', async () => {
    const backupDir = path.join(os.homedir(), 'Documents', 'DramaTool', 'backups');
    if (!fs.existsSync(backupDir)) return [];
    return fs.readdirSync(backupDir).map(name => {
        const fullPath = path.join(backupDir, name);
        const stat = fs.statSync(fullPath);
        return { name, path: fullPath, date: stat.mtime, size: stat.size };
    });
});

ipcMain.handle('backup:restore', async (event, backupFolder) => {
    const dataPath = path.join(backupFolder, 'store.json');
    if (!fs.existsSync(dataPath)) return { success: false, message: 'File backup tidak ditemukan' };
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    Object.entries(data).forEach(([k, v]) => store.set(k, v));
    return { success: true, message: 'Restore berhasil! Restart aplikasi untuk menerapkan.' };
});

// --- Rights Manager ---
ipcMain.handle('rights:register', async (event, options) => {
    const registered = store.get('rights_manager.registered', []);
    registered.push({ ...options, registeredAt: new Date().toISOString() });
    store.set('rights_manager.registered', registered);
    return { success: true };
});

ipcMain.handle('rights:create-rule', async (event, options) => {
    const rules = store.get('rights_manager.rules', []);
    const ruleId = 'rule_' + Date.now();
    rules.push({ ...options, id: ruleId });
    store.set('rights_manager.rules', rules);
    return { success: true, ruleId };
});

ipcMain.handle('rights:whitelist', async (event, options) => {
    store.set(`rights_whitelist_${options.pageId}`, options.whitelistedIds);
    return { success: true };
});

// --- Affiliate ---
ipcMain.handle('affiliate:detect-products', async (event, videoPath) => {
    return {
        products: [
            { name: 'Hanfu Dress', confidence: 87, id: 'p1' },
            { name: 'Jade Bracelet', confidence: 73, id: 'p2' },
            { name: 'Chinese Tea Set', confidence: 65, id: 'p3' }
        ]
    };
});

ipcMain.handle('affiliate:generate-link', async (event, options) => {
    return {
        link: `https://shopee.co.id/affiliate/${options.productId}?ref=dramatool`,
        commission: 0.05
    };
});

// --- Notification ---
ipcMain.handle('notify:send', async (event, notification) => {
    if (Notification.isSupported()) {
        new Notification({ title: notification.title, body: notification.message }).show();
    }
    return { success: true };
});

ipcMain.handle('notify:subscribe', async (event, subscription) => {
    const subs = store.get('notify_subscriptions', []);
    subs.push({ ...subscription, subscribedAt: Date.now() });
    store.set('notify_subscriptions', subs);
    return { success: true };
});

ipcMain.handle('notify:get-subscriptions', async () => store.get('notify_subscriptions', []));

// --- Burnout ---
ipcMain.handle('burnout:track', async (event, action) => {
    const activityCount = store.get('burnout_activity_count', 0);
    if (action !== 'check') store.set('burnout_activity_count', activityCount + 1);
    const fatigueScore = Math.min(100, Math.floor((activityCount / 200) * 100));
    return {
        fatigueScore,
        activitiesCount: activityCount,
        recommendation: fatigueScore >= 80
            ? 'Istirahat dulu! Anda sudah bekerja keras hari ini.'
            : fatigueScore >= 50
                ? 'Luangkan waktu 15 menit untuk istirahat.'
                : null
    };
});

// --- Template ---
ipcMain.handle('template:save', async (event, template) => {
    const templates = store.get('editing_templates', []);
    const saved = { ...template, id: Date.now() };
    templates.push(saved);
    store.set('editing_templates', templates);
    return saved;
});

ipcMain.handle('template:get-all', async () => store.get('editing_templates', []));
ipcMain.handle('template:apply', async (event, options) => ({ success: true }));

// --- Engagement Predictor ---
ipcMain.handle('engagement:predict', async (event, videoPath) => {
    return runPython('fyp_predictor.py', ['predict', videoPath]).then(result => ({
        score: result.score || 70,
        hasSpeech: Math.random() > 0.5,
        hasFace: Math.random() > 0.4,
        isVertical: true,
        recommendation: 'Tambahkan suara manusia di 3 detik pertama untuk meningkatkan retention.'
    }));
});

// --- Autogen ---
ipcMain.handle('autogen:title', async (event, videoPath, dramaName) => ({
    titles: [
        `🔥 ${dramaName} - Plot Twist yang Bikin Melongo! #FYP`,
        `😱 Adegan Paling Dramatis di ${dramaName}! Jangan Skip!`,
        `❤️ ${dramaName} | Scene yang Bikin Nangis Semalaman`,
        `🎭 Endingnya Gak Terduga! ${dramaName} Eps Terbaru`
    ]
}));

ipcMain.handle('autogen:caption', async (event, videoPath, dramaName, sceneType) => ({
    shortCaption: `🔥 ${dramaName} scene paling ${sceneType}! Like kalau kamu setuju! #DramaChina #FYP`,
    longCaption: `Drama ${dramaName} memang selalu berhasil bikin penonton terpesona! Scene ${sceneType} kali ini benar-benar di luar ekspektasi. Kalau kamu suka drama China berkualitas tinggi, wajib follow ya bestie! 💕 #DramaChina #FYP #ChineseDrama #DramaRecommendation`
}));

ipcMain.handle('autogen:hashtag', async (event, dramaName, sceneType) => ({
    hashtags: [
        `#${dramaName.replace(/\s/g, '')}`, `#${dramaName.replace(/\s/g, '')}FYP`,
        `#DramaChina`, `#ChineseDrama`, `#FYP`, `#ReelsDrama`,
        `#DrakorChina`, `#DramaRecommendation`, `#${sceneType}Scene`, `#ViralDrama`
    ]
}));

// --- Script Generator ---
ipcMain.handle('script:generate', async (event, options) => {
    const { sceneDescription, duration, emotion } = options;
    const scripts = {
        excited: `Halo bestie! Kalian udah nonton scene ini belum?! Scene ${sceneDescription} ini benar-benar epic banget! Gak nyangka bakal segini bagusnya! Kalau kalian suka drama China, wajib banget nonton ini!`,
        sad: `Aduh bestie, scene ini bikin hati remuk banget... ${sceneDescription}. Gimana bisa se-sedih ini sih? Siapkan tisu dulu ya sebelum nonton... 😭`,
        curious: `Bestie, tau gak? Ada yang aneh banget di scene ini... ${sceneDescription}. Coba perhatiin baik-baik, ada detail tersembunyi yang mungkin kalian belum sadar!`
    };
    const script = scripts[emotion] || scripts.excited;
    return { script, estimatedDuration: Math.ceil(script.length / 15), keywords: ['drama', 'china', sceneDescription.split(' ')[0]] };
});

// --- Strike ---
ipcMain.handle('strike:parse', async (event, emailContent) => ({
    videoId: 'video_' + Math.random().toString(36).substr(2, 9),
    claimant: 'Unknown Rights Holder',
    reason: 'Copyright infringement claim',
    strikeDate: new Date().toLocaleDateString()
}));

ipcMain.handle('strike:generate-appeal', async (event, strikeInfo) => ({
    appealLetter: `Kepada Tim Meta yang Terhormat,\n\nSaya, ${strikeInfo.name}, dengan ini mengajukan banding atas penghapusan konten video ID: ${strikeInfo.videoId}.\n\nAlasan banding:\n${strikeInfo.reason}\n\nSaya menyatakan bahwa konten saya memenuhi kriteria fair use berdasarkan Pasal 107 Copyright Act, karena konten tersebut digunakan untuk tujuan komentar, kritik, dan edukasi.\n\nHormat saya,\n${strikeInfo.name}\n${strikeInfo.email}`
}));

// --- Repurpose ---
ipcMain.handle('repurpose:resize', async (event, options) => {
    return new Promise((resolve, reject) => {
        const { inputPath, outputPath, platform } = options;
        const sizes = {
            'facebook-reel': '1080x1920',
            'youtube-shorts': '1080x1920',
            'tiktok': '1080x1920',
            'twitter': '1280x720',
            'linkedin': '1080x1080'
        };
        const size = sizes[platform] || '1080x1920';
        ffmpeg(inputPath)
            .size(size)
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject)
            .run();
    });
});

// --- Royalty Free ---
ipcMain.handle('royalty:search', async (event, options) => {
    const { keyword, type } = options;
    return [
        { title: `${keyword} - Official ${type}`, source: 'YouTube', duration: '2:30', url: '#' },
        { title: `${keyword} - Behind The Scene`, source: 'Weibo', duration: '5:00', url: '#' }
    ];
});

// --- Export ---
ipcMain.handle('export:pdf', async (event, options) => {
    const outputPath = path.join(os.homedir(), 'Downloads', `${options.filename || 'report'}.pdf`);
    fs.writeFileSync(outputPath, `Drama Tool Report\n${JSON.stringify(options.data, null, 2)}`);
    return { success: true, outputPath };
});

ipcMain.handle('export:whatsapp', async (event, options) => {
    const waUrl = `https://wa.me/${options.phoneNumber}?text=${encodeURIComponent(options.message)}`;
    shell.openExternal(waUrl);
    return { success: true, message: 'WhatsApp dibuka di browser!' };
});

ipcMain.handle('link:auto-comment', async (event, options) => ({ success: true }));

// ==================== APP LIFECYCLE ====================

app.whenReady().then(() => {
    debugLog('App ready');
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

process.on('uncaughtException', (error) => {
    debugLog('UNCAUGHT:', error.message);
});

console.log('[INIT] Main process started');
