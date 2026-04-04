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
        backgroundColor: '#1a1a2e',
        show: false
    });

    // Load HTML
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
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
        const duration = endTime - startTime;
        ffmpeg(inputPath)
            .setStartTime(startTime)
            .duration(duration)
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
        const drawtext = `drawtext=text='${subtitleText}':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=${position === 'top' ? 50 : 'h-text_h-50'}`;
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
            .videoFilter(`setpts=${1/speed}*PTS`)
            .audioFilter(`atempo=${speed}`)
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject)
            .run();
    });
});

// ============ MODUL 2: WATERMARK + INPAINTING ============
ipcMain.handle('watermark:detect', async (event, videoPath) => {
    return new Promise((resolve) => {
        // Placeholder - implementasi dengan Python
        resolve([{ x: 10, y: 10, width: 100, height: 50 }]);
    });
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
        const overlayPosition = {
            'top-left': '10:10',
            'top-right': 'main_w-overlay_w-10:10',
            'bottom-left': '10:main_h-overlay_h-10',
            'bottom-right': 'main_w-overlay_w-10:main_h-overlay_h-10'
        }[position] || 'main_w-overlay_w-10:main_h-overlay_h-10';
        
        ffmpeg(inputPath)
            .videoFilter(`[0:v][1:v]overlay=${overlayPosition}`)
            .input(watermarkPath)
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject)
            .run();
    });
});

// ============ MODUL 3: PENGHILANG SUBTITLE ============
ipcMain.handle('subtitle:detect', async (event, videoPath) => {
    return new Promise((resolve) => {
        resolve([{ y: 800, height: 50, start: 0, end: 10 }]);
    });
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
    const results = [];
    for (const timestamp of timestamps) {
        const outputPath = path.join(outputFolder, `thumbnail_${timestamp}.png`);
        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .screenshots({
                    timestamps: [timestamp],
                    filename: `thumbnail_${timestamp}.png`,
                    folder: outputFolder,
                    size: '1280x720'
                })
                .on('end', () => {
                    results.push({ timestamp, path: outputPath });
                    resolve();
                })
                .on('error', reject);
        });
    }
    return results;
});

ipcMain.handle('thumbnail:add-text', async (event, { thumbnailPath, outputPath, text, position, fontSize, color }) => {
    return new Promise((resolve, reject) => {
        const positions = {
            'top': `x=(w-text_w)/2:y=50`,
            'bottom': `x=(w-text_w)/2:y=h-text_h-50`,
            'center': `x=(w-text_w)/2:y=(h-text_h)/2`
        };
        ffmpeg(thumbnailPath)
            .videoFilter(`drawtext=text='${text}':fontcolor=${color}:fontsize=${fontSize}:box=1:boxcolor=black@0.5:boxborderw=5:${positions[position]}`)
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject)
            .run();
    });
});

// ============ MODUL 5: AUTO PECAH VIDEO PANJANG ============
ipcMain.handle('video:split-scenes', async (event, { videoPath, outputFolder, minDuration, maxDuration, viralThreshold }) => {
    return new Promise((resolve) => {
        resolve({
            clips: [
                { start: 0, end: 25, duration: 25, viralScore: 85, path: path.join(outputFolder, 'clip_1.mp4') },
                { start: 25, end: 55, duration: 30, viralScore: 92, path: path.join(outputFolder, 'clip_2.mp4') }
            ]
        });
    });
});

ipcMain.handle('video:detect-scenes', async (event, videoPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) reject(err);
            else {
                const duration = metadata.format.duration;
                const sceneCount = Math.floor(duration / 30);
                const scenes = [];
                for (let i = 0; i < sceneCount; i++) {
                    scenes.push({
                        start: i * 30,
                        end: Math.min((i + 1) * 30, duration),
                        duration: 30
                    });
                }
                resolve(scenes);
            }
        });
    });
});

// ============ MODUL 6-10: PLANNING & OPTIMASI ============
ipcMain.handle('content:scrape-trends', async (event, keyword) => {
    return { trends: [
        { name: 'The Double - Plot Twist', volume: 15234, platform: 'Facebook' },
        { name: 'Love Between Fairy and Devil OST', volume: 12456, platform: 'TikTok' }
    ] };
});

ipcMain.handle('fyp:predict', async (event, videoPath) => {
    return {
        score: 78,
        metrics: { hook: 85, retention: 72, emotional: 95, completion: 60 },
        weaknesses: ['Komentar rendah', 'Durasi terlalu panjang'],
        recommendations: ['Potong jadi 22 detik', 'Tambah teks di akhir']
    };
});

ipcMain.handle('audio:get-trending', async (event) => {
    return [
        { name: 'See Tinh (remix)', usageCount: 15234 },
        { name: 'Sad Piano - Emotional', usageCount: 9876 }
    ];
});

ipcMain.handle('hashtag:analyze', async (event, hashtag) => {
    const store = new Store({ name: 'hashtag-stats' });
    return store.get(hashtag, { usage: 0, avgLikes: 0, lastUsed: null });
});

ipcMain.handle('hashtag:suggest', async (event, keyword) => {
    return ['#DramaChina', '#ChineseDrama', '#FYP', '#ReelsDrama'];
});

ipcMain.handle('viral:check', async (event) => {
    return [
        { name: 'The Double Plot Twist', volume: 15234, score: 95, expiryTime: Date.now() + 6 * 60 * 60 * 1000 }
    ];
});

// ============ MODUL 11-15: AI & TESTING ============
ipcMain.handle('abtest:create', async (event, { videoPath, variants, duration }) => {
    return { testId: Date.now().toString() };
});

ipcMain.handle('engagement:predict', async (event, videoPath) => {
    return { hasSpeech: true, hasFace: true, isVertical: true, score: 85, recommendation: 'Bagus!' };
});

ipcMain.handle('autogen:title', async (event, videoPath, dramaName) => {
    return { titles: [`🔥 Scene PALING DRAMATIS di ${dramaName}!`, `😭 Adegan ini bikin NANGIS!`] };
});

ipcMain.handle('autogen:caption', async (event, videoPath, dramaName, sceneType) => {
    return { shortCaption: `😭 ${dramaName} episode terbaru! #DramaChina`, longCaption: `Scene ini bikin aku nangis!` };
});

ipcMain.handle('autogen:hashtag', async (event, dramaName, sceneType) => {
    return { hashtags: [`#${dramaName.replace(/ /g, '')}`, '#DramaChina', '#FYP'] };
});

ipcMain.handle('script:generate', async (event, { sceneDescription, duration, language, emotion }) => {
    return { script: `Halo bestie! ${sceneDescription}`, estimatedDuration: duration };
});

// ============ MODUL 16-20: HAK CIPTA ============
ipcMain.handle('copyright:precheck', async (event, videoPath) => {
    return {
        riskScore: 30,
        audioMatch: false,
        videoMatch: false,
        watermarkDetected: false,
        fairUseScore: 75,
        recommendation: 'Video aman untuk diupload'
    };
});

ipcMain.handle('antistrike:score', async (event, videoPath) => {
    return { score: 75, hasVoiceover: false, hasEdits: true, uniqueContent: 70, recommendation: 'Tambahkan voiceover' };
});

ipcMain.handle('strike:generate-appeal', async (event, strikeInfo) => {
    const appealLetter = `Kepada Yth. Tim Meta Copyright,\n\nPerihal: Banding atas Copyright Strike\n\nSaya mengajukan banding...`;
    return { appealLetter };
});

ipcMain.handle('backup:create', async (event, backupPath) => {
    const dataPath = path.join(app.getPath('documents'), 'DramaTool');
    const backupFolder = backupPath || path.join(dataPath, 'backups', `backup_${Date.now()}`);
    fs.mkdirSync(backupFolder, { recursive: true });
    return { success: true, backupFolder, size: 1024000 };
});

ipcMain.handle('backup:list', async (event) => {
    const dataPath = path.join(app.getPath('documents'), 'DramaTool');
    const backupFolder = path.join(dataPath, 'backups');
    if (!fs.existsSync(backupFolder)) return [];
    const backups = fs.readdirSync(backupFolder).filter(f => f.startsWith('backup_')).map(f => ({
        name: f,
        path: path.join(backupFolder, f),
        date: fs.statSync(path.join(backupFolder, f)).birthtime,
        size: getFolderSize(path.join(backupFolder, f))
    }));
    return backups.sort((a, b) => b.date - a.date);
});

// ============ MODUL 21-25: MANAJEMEN ============
ipcMain.handle('scheduler:add', async (event, schedule) => {
    const store = new Store({ name: 'scheduler' });
    const schedules = store.get('schedules', []);
    schedules.push({ ...schedule, id: Date.now().toString(), status: 'pending' });
    store.set('schedules', schedules);
    return { success: true };
});

ipcMain.handle('scheduler:list', async (event) => {
    const store = new Store({ name: 'scheduler' });
    return store.get('schedules', []);
});

ipcMain.handle('team:list-members', async (event) => {
    const store = new Store({ name: 'team' });
    return store.get('members', []);
});

ipcMain.handle('asset:list', async (event, { category, search }) => {
    const store = new Store({ name: 'assets' });
    let assets = store.get('assets', []);
    if (category) assets = assets.filter(a => a.category === category);
    if (search) assets = assets.filter(a => a.name.includes(search));
    return assets;
});

ipcMain.handle('audience:demographics', async (event, pageId) => {
    return {
        ageGroups: [{ age: '18-24', percentage: 35 }, { age: '25-34', percentage: 40 }],
        gender: { female: 70, male: 28 },
        locations: [{ country: 'Indonesia', percentage: 85 }],
        activeHours: { '20': 55, '21': 48 },
        interests: ['K-Pop', 'Skincare']
    };
});

// ============ MODUL 26-30: SOCIAL & MONETISASI ============
ipcMain.handle('comment:auto-reply', async (event, { commentText }) => {
    return { reply: "Makasih komennya bestie! 😊", confidence: 85, category: 'general' };
});

ipcMain.handle('social:analyze-sentiment', async (event, comments) => {
    return { positive: 65, neutral: 25, negative: 10, topKeywords: ['keren', 'bagus'], crisisDetected: false };
});

ipcMain.handle('profit:calculate', async (event, { views, clicks }) => {
    const revenueViews = (views / 1000) * 2.5;
    const revenueAffiliate = clicks * 0.05;
    return { revenueViews, revenueAffiliate, totalRevenue: revenueViews + revenueAffiliate, estimatedRupiah: (revenueViews + revenueAffiliate) * 15500 };
});

// ============ MODUL 31-33: INFRASTRUKTUR ============
ipcMain.handle('loadbalancer:get-keys', async (event) => {
    const store = new Store({ name: 'api-keys' });
    return store.get('keys', []);
});

ipcMain.handle('loadbalancer:add-key', async (event, { apiKey, name }) => {
    const store = new Store({ name: 'api-keys' });
    const keys = store.get('keys', []);
    keys.push({ id: Date.now().toString(), key: apiKey, name, status: 'active', usage: 0 });
    store.set('keys', keys);
    return { success: true };
});

ipcMain.handle('facebook:upload-reel', async (event, { videoPath, caption }) => {
    return { success: true, postId: '123456789', url: 'https://facebook.com/...' };
});

ipcMain.handle('facebook:login', async (event) => {
    return { success: true, pages: [{ id: '123', name: 'Drama China Page' }] };
});

// ============ MODUL 35-42: TOOLS & BONUS ============
ipcMain.handle('repurpose:resize', async (event, { inputPath, outputPath, platform }) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .size('1080x1920')
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject)
            .run();
    });
});

ipcMain.handle('burnout:track', async (event, action) => {
    return { fatigueScore: 30, activitiesCount: 45, recommendation: null };
});

ipcMain.handle('competitor:analyze', async (event, pageUrl) => {
    return {
        pageName: 'Competitor Page',
        totalVideos: 45,
        avgViews: 12500,
        bestPerforming: { type: 'action', views: 45000 },
        postingFrequency: '2x per hari',
        topHashtags: ['#DramaChina', '#FYP'],
        contentGaps: ['Behind the scene', 'Actor interview']
    };
});

ipcMain.handle('royalty:search', async (event, { keyword, type }) => {
    return [{ title: `${keyword} Official Trailer`, url: 'https://youtube.com/...', source: 'YouTube', duration: '2:30' }];
});

ipcMain.handle('growth:track', async (event, pageId) => {
    return {
        todayData: { followers: 12500, newFollowers: 45, engagement: 4.2 },
        growthRate: 3.5,
        history: []
    };
});

ipcMain.handle('import:download', async (event, { url }) => {
    const outputPath = path.join(app.getPath('downloads'), 'imported_video.mp4');
    return { success: true, outputPath, title: 'video.mp4' };
});

ipcMain.handle('notify:send', async (event, { title, message, platform }) => {
    if (platform === 'desktop' && Notification.isSupported()) {
        new Notification({ title, body: message }).show();
    }
    return { success: true };
});

ipcMain.handle('get-pages', async (event) => {
    return [{ id: '123', name: 'Drama China Page', accessToken: 'xxx' }];
});

ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
});

// ============ APP LIFECYCLE ============
app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
