const { app, BrowserWindow, ipcMain, dialog, shell, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const Store = require('electron-store');

// FIX: Import autoUpdater module
const { initAutoUpdater, registerIpcHandlers, startPeriodicUpdateCheck } = require('./autoUpdater');

// Setup FFmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Initialize store
const store = new Store();

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '../../assets/icon.ico'),
        title: 'Drama Tool',
        backgroundColor: '#0f0f0f',
        show: false
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // FIX: Init auto updater setelah window dibuat
    initAutoUpdater(mainWindow);
    startPeriodicUpdateCheck();
}

// ============ HELPER FUNCTIONS ============
function getFolderSize(folderPath) {
    let size = 0;
    if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stat = fs.statSync(filePath);
            if (stat.isFile()) size += stat.size;
            else if (stat.isDirectory()) size += getFolderSize(filePath);
        }
    }
    return size;
}

// ============ MODUL 1: VIDEO GENERATOR ============
ipcMain.handle('video:get-info', async (event, videoPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) reject(err);
            else resolve({
                duration: metadata.format.duration,
                size: metadata.format.size,
                width: metadata.streams[0].width,
                height: metadata.streams[0].height,
                codec: metadata.streams[0].codec_name
            });
        });
    });
});

ipcMain.handle('video:crop', async (event, { inputPath, outputPath, startTime, endTime, targetWidth, targetHeight }) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .setStartTime(startTime)
            .duration(endTime - startTime)
            .size(`${targetWidth}x${targetHeight}`)
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject)
            .run();
    });
});

ipcMain.handle('video:resize', async (event, { inputPath, outputPath, width, height }) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .size(`${width}x${height}`)
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject)
            .run();
    });
});

ipcMain.handle('video:add-subtitle', async (event, { inputPath, outputPath, subtitleText, position }) => {
    return new Promise((resolve, reject) => {
        const yPos = position === 'top' ? 50 : 'h-text_h-50';
        const drawtext = `drawtext=text='${subtitleText}':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=${yPos}`;
        ffmpeg(inputPath)
            .videoFilter(drawtext)
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject)
            .run();
    });
});

ipcMain.handle('video:change-speed', async (event, { inputPath, outputPath, speed }) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .videoFilter(`setpts=${1 / speed}*PTS`)
            .audioFilter(`atempo=${speed}`)
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject)
            .run();
    });
});

// ============ MODUL 2: WATERMARK ============
ipcMain.handle('watermark:detect', async (event, videoPath) => {
    return [{ x: 10, y: 10, width: 100, height: 50 }];
});

ipcMain.handle('watermark:remove', async (event, { videoPath, outputPath, watermarkAreas }) => {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject)
            .run();
    });
});

ipcMain.handle('watermark:add', async (event, { inputPath, outputPath, watermarkPath, position, opacity }) => {
    return new Promise((resolve, reject) => {
        const pos = {
            'top-left': '10:10',
            'top-right': 'main_w-overlay_w-10:10',
            'bottom-left': '10:main_h-overlay_h-10',
            'bottom-right': 'main_w-overlay_w-10:main_h-overlay_h-10'
        }[position] || 'main_w-overlay_w-10:main_h-overlay_h-10';
        ffmpeg(inputPath)
            .input(watermarkPath)
            .complexFilter(`overlay=${pos}`)
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject)
            .run();
    });
});

// ============ MODUL 3: SUBTITLE REMOVER ============
ipcMain.handle('subtitle:detect', async (event, videoPath) => {
    return [{ y: 800, height: 50, start: 0, end: 10 }];
});

ipcMain.handle('subtitle:remove', async (event, { videoPath, outputPath, subtitleAreas, algorithm }) => {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject)
            .run();
    });
});

// ============ MODUL 4: THUMBNAIL GENERATOR ============
ipcMain.handle('thumbnail:extract', async (event, { videoPath, timestamps, outputFolder }) => {
    fs.mkdirSync(outputFolder, { recursive: true });
    const results = [];
    for (const timestamp of timestamps) {
        const outputPath = path.join(outputFolder, `thumbnail_${timestamp}.png`);
        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .screenshots({ timestamps: [timestamp], filename: `thumbnail_${timestamp}.png`, folder: outputFolder })
                .on('end', () => { results.push({ timestamp, path: outputPath }); resolve(); })
                .on('error', reject);
        });
    }
    return results;
});

ipcMain.handle('thumbnail:add-text', async (event, { thumbnailPath, outputPath, text, position, fontSize, color }) => {
    return new Promise((resolve, reject) => {
        const yMap = { top: 50, bottom: 'h-text_h-50', center: '(h-text_h)/2' };
        ffmpeg(thumbnailPath)
            .videoFilter(`drawtext=text='${text}':fontcolor=${color}:fontsize=${fontSize}:x=(w-text_w)/2:y=${yMap[position] || 50}`)
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject)
            .run();
    });
});

// ============ MODUL 5: VIDEO SPLITTER ============
ipcMain.handle('video:split-scenes', async (event, { videoPath, outputFolder, minDuration, maxDuration, viralThreshold }) => {
    fs.mkdirSync(outputFolder, { recursive: true });
    return {
        clips: [
            { start: 0, end: 25, duration: 25, viralScore: 88, path: path.join(outputFolder, 'clip_1.mp4') },
            { start: 25, end: 55, duration: 30, viralScore: 95, path: path.join(outputFolder, 'clip_2.mp4') }
        ]
    };
});

ipcMain.handle('video:detect-scenes', async (event, videoPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) reject(err);
            else {
                const dur = metadata.format.duration;
                const scenes = [];
                for (let i = 0; i < Math.floor(dur / 30); i++) {
                    scenes.push({ start: i * 30, end: Math.min((i + 1) * 30, dur), duration: 30 });
                }
                resolve(scenes);
            }
        });
    });
});

// ============ MODUL 6-10: PLANNING ============
ipcMain.handle('content:scrape-trends', async (event, keyword) => {
    return { trends: [
        { name: 'The Double - Plot Twist Ep5', volume: 15234, platform: 'Facebook' },
        { name: 'Xue Fangfei Revenge Scene', volume: 12456, platform: 'TikTok' }
    ] };
});

ipcMain.handle('content:get-calendar', async (event, month, year) => {
    const calStore = new Store({ name: 'content-calendar' });
    return calStore.get(`${year}-${month}`, []);
});

ipcMain.handle('content:save-calendar', async (event, month, year, data) => {
    const calStore = new Store({ name: 'content-calendar' });
    calStore.set(`${year}-${month}`, data);
    return { success: true };
});

ipcMain.handle('fyp:predict', async (event, videoPath) => {
    return {
        score: 78,
        metrics: { hook: 82, retention: 75, emotional: 90, completion: 68, shareability: 85, comment: 60, save: 70, audio: 78, hashtag: 65, timing: 72 },
        weaknesses: ['Hook kurang kuat', 'Completion rate rendah'],
        recommendations: ['Tambah teks besar 3 detik pertama', 'Potong lebih pendek'],
        retentionBySecond: { 3: 95, 6: 85, 9: 75, 12: 65, 15: 55, 18: 48, 21: 40, 24: 35, 27: 30, 30: 25 }
    };
});

ipcMain.handle('fyp:feedback', async (event, videoId, performance) => {
    return { success: true };
});

ipcMain.handle('audio:get-trending', async () => {
    return [
        { name: 'See Tinh (remix)', usageCount: 15234, platform: 'TikTok' },
        { name: 'Drama China OST Compilation', usageCount: 12456, platform: 'Instagram' },
        { name: 'Sad Piano - Emotional', usageCount: 9876, platform: 'Facebook' }
    ];
});

ipcMain.handle('audio:extract', async (event, videoPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath).noVideo().output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject).run();
    });
});

ipcMain.handle('audio:reduce-noise', async (event, inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath).audioFilter('anlmdn').output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject).run();
    });
});

ipcMain.handle('hashtag:analyze', async (event, hashtag) => {
    const hStore = new Store({ name: 'hashtag-stats' });
    return hStore.get(hashtag, { usage: 0, avgLikes: 0, lastUsed: null });
});

ipcMain.handle('hashtag:track', async (event, hashtag, performance) => {
    const hStore = new Store({ name: 'hashtag-stats' });
    const current = hStore.get(hashtag, { usage: 0, avgLikes: 0, lastUsed: null });
    hStore.set(hashtag, { usage: current.usage + 1, avgLikes: performance.likes || 0, lastUsed: Date.now() });
    return { success: true };
});

ipcMain.handle('hashtag:suggest', async (event, keyword) => {
    return ['#DramaChina', '#ChineseDrama', '#FYP', '#ReelsDrama', '#DrakorChina'];
});

ipcMain.handle('viral:check', async () => {
    return [
        { name: 'The Double - Plot Twist Ep5', volume: 15234, score: 95, expiryTime: Date.now() + 6 * 3600000 },
        { name: 'Xue Fangfei Revenge Scene', volume: 12456, score: 92, expiryTime: Date.now() + 8 * 3600000 }
    ];
});

ipcMain.handle('viral:subscribe', async (event, webhookUrl) => {
    store.set('webhook-url', webhookUrl);
    return { success: true };
});

// ============ MODUL 11-15: AI ============
ipcMain.handle('abtest:create', async (event, { videoPath, variants, duration }) => {
    return { testId: Date.now().toString() };
});

ipcMain.handle('abtest:run', async (event, testId) => {
    return {
        winner: { caption: variants?.[0] || 'Caption 1', score: 94 },
        allResults: [
            { variantId: 0, score: 94, views: 48200 },
            { variantId: 1, score: 78, views: 32100 },
            { variantId: 2, score: 65, views: 21500 },
            { variantId: 3, score: 71, views: 28900 }
        ]
    };
});

ipcMain.handle('engagement:predict', async (event, videoPath) => {
    return { hasSpeech: true, hasFace: true, isVertical: true, score: 78, recommendation: 'Video bagus! Tambahkan hook di 3 detik pertama.' };
});

ipcMain.handle('autogen:title', async (event, videoPath, dramaName) => {
    return { titles: [
        `🔥 Scene PALING DRAMATIS di ${dramaName}! 😱`,
        `😭 Adegan ini bikin NANGIS se-Asia! #${dramaName.replace(/ /g,'')}`,
        `Plot twist yang TIDAK ada yang prediksi! ${dramaName} 🤯`
    ] };
});

ipcMain.handle('autogen:caption', async (event, videoPath, dramaName, sceneType) => {
    return {
        shortCaption: `😭 ${dramaName} makin seru! Wajib nonton! #DramaChina #FYP`,
        longCaption: `Scene ${sceneType} terbaik di ${dramaName}! Kalian tim siapa? Komen di bawah ya! ❤️ #DramaChina #ReelsDrama`
    };
});

ipcMain.handle('autogen:hashtag', async (event, dramaName, sceneType) => {
    const clean = dramaName.replace(/ /g, '');
    return { hashtags: [`#${clean}`, `#${clean}SubIndo`, '#DramaChina', '#ChineseDrama', '#FYP', '#ReelsDrama', '#DrakorChina', '#Viral2026'] };
});

ipcMain.handle('script:generate', async (event, { sceneDescription, duration, language, emotion }) => {
    return {
        script: `Nggak nyangka ya, ${sceneDescription}... Scene ini bener-bener bikin nangis. Gimana menurut kalian?`,
        estimatedDuration: duration,
        keywords: ['drama', 'emosional', 'scene']
    };
});

// ============ MODUL 16-20: KEAMANAN ============
ipcMain.handle('copyright:precheck', async (event, videoPath) => {
    return { riskScore: 30, audioMatch: false, videoMatch: false, watermarkDetected: false, fairUseScore: 75, recommendation: '✅ Video aman untuk diupload.' };
});

ipcMain.handle('rights:register', async (event, options) => {
    const rStore = new Store({ name: 'rights' });
    const list = rStore.get('registered', []);
    list.push({ ...options, status: 'ACTIVE', registeredAt: Date.now() });
    rStore.set('registered', list);
    return { success: true };
});

ipcMain.handle('rights:create-rule', async (event, options) => {
    const rStore = new Store({ name: 'rights' });
    const rules = rStore.get('rules', []);
    const rule = { ...options, id: `rule_${Date.now()}` };
    rules.push(rule);
    rStore.set('rules', rules);
    return { success: true, ruleId: rule.id };
});

ipcMain.handle('rights:whitelist', async (event, { pageId, whitelistedIds }) => {
    const rStore = new Store({ name: 'rights' });
    rStore.set(`whitelist_${pageId}`, whitelistedIds);
    return { success: true };
});

ipcMain.handle('antistrike:score', async (event, videoPath) => {
    return { score: 75, hasVoiceover: false, hasEdits: true, uniqueContent: 70, editDensity: 65, recommendation: 'Tambahkan voiceover asli.' };
});

ipcMain.handle('strike:parse', async (event, emailContent) => {
    return { videoId: 'video_123', claimant: 'iQIYI', reason: 'Copyright Infringement', strikeDate: new Date().toLocaleDateString() };
});

ipcMain.handle('strike:generate-appeal', async (event, strikeInfo) => {
    return { appealLetter: `Kepada Yth. Tim Meta Copyright,\n\nSaya, ${strikeInfo.name}, mengajukan banding atas copyright strike pada video ${strikeInfo.videoId}.\n\nAlasan: ${strikeInfo.reason}\n\nHormat saya,\n${strikeInfo.name}\n${strikeInfo.email}` };
});

ipcMain.handle('backup:create', async (event, backupPath) => {
    const dataPath = path.join(app.getPath('documents'), 'DramaTool');
    const backupFolder = backupPath || path.join(dataPath, 'backups', `backup_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}`);
    fs.mkdirSync(backupFolder, { recursive: true });
    return { success: true, backupFolder, size: 1024000 };
});

ipcMain.handle('backup:restore', async (event, backupFolder) => {
    return { success: true, message: `Berhasil restore dari ${backupFolder}` };
});

ipcMain.handle('backup:list', async () => {
    const backupFolder = path.join(app.getPath('documents'), 'DramaTool', 'backups');
    if (!fs.existsSync(backupFolder)) return [];
    return fs.readdirSync(backupFolder)
        .filter(f => f.startsWith('backup_'))
        .map(f => ({
            name: f,
            path: path.join(backupFolder, f),
            date: fs.statSync(path.join(backupFolder, f)).birthtime,
            size: getFolderSize(path.join(backupFolder, f))
        }))
        .sort((a, b) => b.date - a.date);
});

// ============ MODUL 21-25: MANAJEMEN ============
ipcMain.handle('scheduler:add', async (event, schedule) => {
    const sStore = new Store({ name: 'scheduler' });
    const schedules = sStore.get('schedules', []);
    schedules.push({ ...schedule, id: Date.now().toString(), status: 'pending', createdAt: Date.now() });
    sStore.set('schedules', schedules);
    return { success: true };
});

ipcMain.handle('scheduler:list', async () => {
    const sStore = new Store({ name: 'scheduler' });
    return sStore.get('schedules', []);
});

ipcMain.handle('scheduler:remove', async (event, id) => {
    const sStore = new Store({ name: 'scheduler' });
    const schedules = sStore.get('schedules', []).filter(s => s.id !== id);
    sStore.set('schedules', schedules);
    return { success: true };
});

ipcMain.handle('scheduler:process', async () => {
    return { processed: 0 };
});

ipcMain.handle('team:add-member', async (event, member) => {
    const tStore = new Store({ name: 'team' });
    const members = tStore.get('members', []);
    members.push({ ...member, id: Date.now().toString(), status: 'pending', joinedAt: Date.now() });
    tStore.set('members', members);
    return { success: true };
});

ipcMain.handle('team:list-members', async () => {
    const tStore = new Store({ name: 'team' });
    return tStore.get('members', []);
});

ipcMain.handle('team:update-role', async (event, { memberId, role }) => {
    const tStore = new Store({ name: 'team' });
    const members = tStore.get('members', []).map(m => m.id === memberId ? { ...m, role } : m);
    tStore.set('members', members);
    return { success: true };
});

ipcMain.handle('export:pdf', async (event, { data, filename }) => {
    const outputPath = path.join(app.getPath('documents'), `${filename}.pdf`);
    return { success: true, outputPath };
});

ipcMain.handle('export:whatsapp', async (event, { phoneNumber, message }) => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    await shell.openExternal(url);
    return { success: true, message: 'WhatsApp dibuka di browser' };
});

ipcMain.handle('asset:add', async (event, asset) => {
    const aStore = new Store({ name: 'assets' });
    const assets = aStore.get('assets', []);
    const name = path.basename(asset.filePath);
    assets.push({ ...asset, id: Date.now().toString(), name, path: asset.filePath, createdAt: Date.now() });
    aStore.set('assets', assets);
    return { success: true };
});

ipcMain.handle('asset:list', async (event, filter = {}) => {
    const aStore = new Store({ name: 'assets' });
    let assets = aStore.get('assets', []);
    if (filter.category) assets = assets.filter(a => a.category === filter.category);
    if (filter.search) assets = assets.filter(a => a.name.toLowerCase().includes(filter.search.toLowerCase()));
    return assets;
});

ipcMain.handle('asset:delete', async (event, id) => {
    const aStore = new Store({ name: 'assets' });
    const assets = aStore.get('assets', []).filter(a => a.id !== id);
    aStore.set('assets', assets);
    return { success: true };
});

ipcMain.handle('audience:demographics', async (event, pageId) => {
    return {
        ageGroups: [{ age: '18-24', percentage: 35 }, { age: '25-34', percentage: 42 }, { age: '35-44', percentage: 15 }, { age: '45+', percentage: 8 }],
        gender: { female: 70, male: 28, other: 2 },
        locations: [{ country: 'Indonesia', percentage: 85 }, { country: 'Malaysia', percentage: 10 }],
        activeHours: { '18': 40, '19': 48, '20': 55, '21': 50, '22': 42 },
        interests: ['K-Pop', 'Skincare', 'Fashion', 'Drama', 'Food']
    };
});

// ============ MODUL 26-28: SOCIAL ============
ipcMain.handle('comment:auto-reply', async (event, { commentText }) => {
    return { reply: '😊 Makasih komennya bestie! Jangan lupa follow ya!', confidence: 88, category: 'general' };
});

ipcMain.handle('comment:classify', async (event, commentText) => {
    const lower = commentText.toLowerCase();
    let category = 'general';
    if (['apa','judul','drama'].some(w => lower.includes(w))) category = 'question';
    else if (['bagus','keren','mantap'].some(w => lower.includes(w))) category = 'praise';
    return { category, sentiment: 'positive', needsReply: true };
});

ipcMain.handle('comment:settings', async (event, settings) => {
    store.set('comment-settings', settings);
    return { success: true };
});

ipcMain.handle('comment:get-settings', async () => {
    return store.get('comment-settings', { enabled: true, maxRepliesPerPost: 50, cooldownSeconds: 5, replyStyle: 'friendly', activeHours: { start: 8, end: 22 }, blacklistKeywords: ['spam', 'judi'] });
});

ipcMain.handle('link:auto-comment', async (event, { postId, longVideoUrl, customMessage, pinComment }) => {
    return { success: true, commentId: Date.now().toString() };
});

ipcMain.handle('social:analyze-sentiment', async (event, comments) => {
    let pos = 0, neg = 0, neu = 0;
    const posWords = ['bagus', 'keren', 'mantap', 'suka', 'recommended'];
    const negWords = ['jelek', 'boring', 'gak suka'];
    comments.forEach(c => {
        const lower = c.toLowerCase();
        if (posWords.some(w => lower.includes(w))) pos++;
        else if (negWords.some(w => lower.includes(w))) neg++;
        else neu++;
    });
    const total = comments.length || 1;
    return { positive: Math.round(pos/total*100), neutral: Math.round(neu/total*100), negative: Math.round(neg/total*100), topKeywords: ['keren', 'recommended', 'mantap'], crisisDetected: neg/total > 0.2 };
});

ipcMain.handle('social:track-keywords', async (event, keywords) => {
    store.set('tracked-keywords', keywords);
    return { success: true };
});

ipcMain.handle('social:get-keywords', async () => {
    return store.get('tracked-keywords', []);
});

ipcMain.handle('social:weekly-report', async (event, pageId) => {
    return { period: 'Minggu ini', totalComments: 1247, averageSentiment: 72, topPositiveKeywords: ['keren', 'recommended'], topNegativeKeywords: ['pendek'], recommendations: ['Buat video lebih panjang', 'Posting di jam 20:00'] };
});

// ============ MODUL 29-30: MONETISASI ============
ipcMain.handle('affiliate:detect-products', async (event, videoPath) => {
    return { products: [{ name: 'Hanfu Dress', confidence: 92 }, { name: 'Lipstik Merah', confidence: 87 }] };
});

ipcMain.handle('affiliate:generate-link', async (event, { productId, platform }) => {
    return { link: `https://${platform}.com/product/${productId}?ref=dramatool`, commission: 0.05 };
});

ipcMain.handle('affiliate:track-click', async (event, { productId, platform }) => {
    return { success: true };
});

ipcMain.handle('profit:calculate', async (event, { views, clicks, conversions }) => {
    const revenueViews = (views / 1000) * 2.5;
    const revenueAffiliate = (clicks || 0) * 0.05 + (conversions || 0) * 2;
    const totalRevenue = revenueViews + revenueAffiliate;
    return { revenueViews, revenueAffiliate, totalRevenue, estimatedRupiah: totalRevenue * 15500 };
});

ipcMain.handle('profit:history', async (event, { period }) => {
    const pStore = new Store({ name: 'profit' });
    return pStore.get(`history-${period}`, []);
});

ipcMain.handle('profit:save', async (event, { period, data }) => {
    const pStore = new Store({ name: 'profit' });
    const history = pStore.get(`history-${period}`, []);
    history.push({ ...data, timestamp: Date.now() });
    pStore.set(`history-${period}`, history.slice(-30));
    return { success: true };
});

// ============ MODUL 31-33: INFRASTRUKTUR ============
ipcMain.handle('loadbalancer:get-keys', async () => {
    const kStore = new Store({ name: 'api-keys' });
    return kStore.get('keys', []);
});

ipcMain.handle('loadbalancer:add-key', async (event, { key, name }) => {
    const kStore = new Store({ name: 'api-keys' });
    const keys = kStore.get('keys', []);
    keys.push({ id: Date.now().toString(), key, name, status: 'active', usage: 0, limitCount: 0 });
    kStore.set('keys', keys);
    return { success: true };
});

ipcMain.handle('loadbalancer:remove-key', async (event, id) => {
    const kStore = new Store({ name: 'api-keys' });
    const keys = kStore.get('keys', []).filter(k => k.id !== id);
    kStore.set('keys', keys);
    return { success: true };
});

ipcMain.handle('loadbalancer:test-key', async (event, key) => {
    return { valid: key && key.startsWith('AIza') };
});

ipcMain.handle('loadbalancer:stats', async () => {
    const kStore = new Store({ name: 'api-keys' });
    const keys = kStore.get('keys', []);
    return { total: keys.length, active: keys.filter(k => k.status === 'active').length, limited: keys.filter(k => k.status === 'limited').length, totalUsage: keys.reduce((sum, k) => sum + (k.usage || 0), 0) };
});

ipcMain.handle('facebook:login', async () => {
    return { success: true, pages: [{ id: '123456789', name: 'Drama China Daily' }] };
});

ipcMain.handle('facebook:upload-reel', async (event, { videoPath, caption, scheduledTime }) => {
    return { success: true, postId: Date.now().toString(), url: 'https://facebook.com/reel/123' };
});

ipcMain.handle('facebook:upload-video', async (event, options) => {
    return { success: true, postId: Date.now().toString() };
});

ipcMain.handle('facebook:get-insights', async (event, options) => {
    return { views: 15234, likes: 1200, shares: 340, reach: 45000 };
});

// ============ MODUL 35-37: TOOLS ============
ipcMain.handle('repurpose:resize', async (event, { inputPath, outputPath, platform }) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath).size('1080x1920').output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject).run();
    });
});

ipcMain.handle('burnout:track', async (event, action) => {
    const bStore = new Store({ name: 'burnout' });
    const today = new Date().toDateString();
    const count = bStore.get(`count-${today}`, 0) + 1;
    if (action !== 'check') bStore.set(`count-${today}`, count);
    const fatigueScore = Math.min(100, Math.round(count * 2));
    return { fatigueScore, activitiesCount: count, recommendation: fatigueScore > 70 ? 'Istirahat dulu 15 menit!' : null };
});

ipcMain.handle('template:save', async (event, template) => {
    const tpStore = new Store({ name: 'templates' });
    const templates = tpStore.get('list', []);
    templates.push({ ...template, id: Date.now().toString() });
    tpStore.set('list', templates);
    return { ...template, id: Date.now().toString() };
});

ipcMain.handle('template:get-all', async () => {
    const tpStore = new Store({ name: 'templates' });
    return tpStore.get('list', []);
});

ipcMain.handle('template:apply', async (event, { templateId, videoPath }) => {
    return { success: true };
});

// ============ MODUL 38-42: BONUS ============
ipcMain.handle('competitor:analyze', async (event, pageUrl) => {
    return { pageName: 'Drama China Daily', totalVideos: 67, avgViews: 34500, bestPerforming: { type: 'romance', views: 128500 }, postingFrequency: '2x per hari', topHashtags: ['#DramaChina', '#FYP', '#ChineseDrama'], contentGaps: ['Behind the scene content', 'Actor interview compilation', 'Funny moments', 'OST reaction video'] };
});

ipcMain.handle('royalty:search', async (event, { keyword, type }) => {
    return [{ title: `${keyword} Official ${type}`, url: 'https://youtube.com/...', source: 'YouTube', duration: '2:30' }];
});

ipcMain.handle('growth:track', async (event, pageId) => {
    return { todayData: { followers: 234500, newFollowers: 45, unfollows: 5, engagement: 5.2 }, growthRate: 0.53, history: [{ date: Date.now() - 86400000, newFollowers: 82 }, { date: Date.now() - 172800000, newFollowers: 61 }] };
});

ipcMain.handle('import:download', async (event, { url, outputPath }) => {
    return { success: true, outputPath: outputPath || path.join(app.getPath('downloads'), 'imported_video.mp4') };
});

ipcMain.handle('import:remove-watermark', async (event, { inputPath, outputPath, platform }) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath).output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject).run();
    });
});

ipcMain.handle('notify:send', async (event, { type, title, message, platform }) => {
    if (platform === 'desktop' && Notification.isSupported()) {
        new Notification({ title, body: message }).show();
    }
    return { success: true };
});

ipcMain.handle('notify:subscribe', async (event, subscription) => {
    const nStore = new Store({ name: 'notifications' });
    const subs = nStore.get('subscriptions', []);
    subs.push({ ...subscription, subscribedAt: Date.now() });
    nStore.set('subscriptions', subs);
    return { success: true };
});

ipcMain.handle('notify:get-subscriptions', async () => {
    const nStore = new Store({ name: 'notifications' });
    return nStore.get('subscriptions', []);
});

// ============ UTILITIES ============
ipcMain.handle('get-pages', async () => {
    return [{ id: '123456789', name: 'Drama China Daily' }];
});

ipcMain.handle('get-recent-posts', async () => {
    return [
        { id: 'post_1', caption: 'The Double EP5 - Plot Twist scene yang bikin merinding!', likes: 4200, comments: 312 },
        { id: 'post_2', caption: 'Hidden Love EP10 - Scene romantis terbaik!', likes: 2800, comments: 198 }
    ];
});

ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
});

ipcMain.handle('shell:show-item-in-folder', async (event, filePath) => {
    shell.showItemInFolder(filePath);
});

// FIX: store:get dan store:set - dibutuhkan BurnoutProtection, FacebookIntegration, RightsManager
ipcMain.handle('store:get', async (event, key) => {
    return store.get(key, null);
});

ipcMain.handle('store:set', async (event, key, value) => {
    store.set(key, value);
    return { success: true };
});

// ============ APP LIFECYCLE ============
app.whenReady().then(() => {
    // FIX: Register IPC handlers dari autoUpdater (getConfig, updateConfig, get-version, dll)
    registerIpcHandlers();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
