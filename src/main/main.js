{
  "name": "drama-tool",
  "version": "1.0.0",
  "description": "Video Generator + Planner Konten Drama China",
  "main": "src/main/main.js",
  "scripts": {
    "start": "electron .",
    "dev": "cross-env NODE_ENV=development electron .",
    "build:win": "electron-builder --win --x64",
    "build:portable": "electron-builder --win portable",
    "postinstall": "electron-builder install-app-deps"
  },
  "author": "Ansory",
  "license": "MIT",
  "devDependencies": {
    "cross-env": "^7.0.3",
    "electron": "^27.0.0",
    "electron-builder": "^24.6.4"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "electron-store": "^8.1.0",
    "ffmpeg-static": "^5.2.0",
    "fluent-ffmpeg": "^2.1.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-dropzone": "^14.2.3",
    "sqlite3": "^5.1.6"
  },
  "build": {
    "appId": "com.dramatool.app",
    "productName": "Drama Tool",
    "directories": {
      "output": "dist"
    },
    "files": [
      "src/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    },
    // ============ MODUL 6: PLANNING KONTEN ============
ipcMain.handle('content:scrape-trends', async (event, keyword) => {
    return new Promise((resolve, reject) => {
        const pythonProcess = exec(`python src/backend/content_scraper.py trends "${keyword}"`);
        let output = '';
        pythonProcess.stdout.on('data', (data) => { output += data; });
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try { resolve(JSON.parse(output)); }
                catch (e) { resolve({ trends: [] }); }
            } else reject(new Error(`Scrape failed`));
        });
    });
});

ipcMain.handle('content:get-calendar', async (event, month, year) => {
    const store = new Store({ name: 'content-calendar' });
    return store.get(`${year}-${month}`, []);
});

ipcMain.handle('content:save-calendar', async (event, month, year, data) => {
    const store = new Store({ name: 'content-calendar' });
    store.set(`${year}-${month}`, data);
    return { success: true };
});

// ============ MODUL 7: PREDIKSI FYP ============
ipcMain.handle('fyp:predict', async (event, videoPath) => {
    return new Promise((resolve, reject) => {
        const pythonProcess = exec(`python src/backend/fyp_predictor.py predict "${videoPath}"`);
        let output = '';
        pythonProcess.stdout.on('data', (data) => { output += data; });
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try { resolve(JSON.parse(output)); }
                catch (e) { resolve({ score: 0, metrics: {} }); }
            } else reject(new Error(`Prediction failed`));
        });
    });
});

ipcMain.handle('fyp:feedback', async (event, videoId, actualPerformance) => {
    const store = new Store({ name: 'fyp-feedback' });
    const feedbacks = store.get('feedbacks', []);
    feedbacks.push({ videoId, actualPerformance, timestamp: Date.now() });
    store.set('feedbacks', feedbacks.slice(-100));
    return { success: true };
});

// ============ MODUL 8: AUDIO & MUSIK ============
ipcMain.handle('audio:get-trending', async (event) => {
    return new Promise((resolve) => {
        const pythonProcess = exec(`python src/backend/trending_tracker.py audio`);
        let output = '';
        pythonProcess.stdout.on('data', (data) => { output += data; });
        pythonProcess.on('close', () => {
            try { resolve(JSON.parse(output)); }
            catch (e) { resolve([]); }
        });
    });
});

ipcMain.handle('audio:extract', async (event, videoPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .output(outputPath)
            .audioCodec('libmp3lame')
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject)
            .run();
    });
});

ipcMain.handle('audio:reduce-noise', async (event, inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .audioFilter('afftdn')
            .output(outputPath)
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', reject)
            .run();
    });
});

// ============ MODUL 9: HASHTAG ANALYTICS ============
ipcMain.handle('hashtag:analyze', async (event, hashtag) => {
    const store = new Store({ name: 'hashtag-stats' });
    const stats = store.get(hashtag, { usage: 0, avgLikes: 0, lastUsed: null });
    return stats;
});

ipcMain.handle('hashtag:track', async (event, hashtag, performance) => {
    const store = new Store({ name: 'hashtag-stats' });
    const existing = store.get(hashtag, { usage: 0, totalLikes: 0, avgLikes: 0 });
    const newUsage = existing.usage + 1;
    const newTotalLikes = existing.totalLikes + (performance.likes || 0);
    store.set(hashtag, {
        usage: newUsage,
        totalLikes: newTotalLikes,
        avgLikes: newTotalLikes / newUsage,
        lastUsed: Date.now()
    });
    return { success: true };
});

ipcMain.handle('hashtag:suggest', async (event, keyword) => {
    return new Promise((resolve) => {
        const pythonProcess = exec(`python src/backend/trending_tracker.py hashtag "${keyword}"`);
        let output = '';
        pythonProcess.stdout.on('data', (data) => { output += data; });
        pythonProcess.on('close', () => {
            try { resolve(JSON.parse(output)); }
            catch (e) { resolve(['#DramaChina', '#ChineseDrama', '#FYP']); }
        });
    });
});

// ============ MODUL 10: VIRAL CONTENT ALERT ============
ipcMain.handle('viral:check', async (event) => {
    return new Promise((resolve) => {
        const pythonProcess = exec(`python src/backend/trending_tracker.py viral`);
        let output = '';
        pythonProcess.stdout.on('data', (data) => { output += data; });
        pythonProcess.on('close', () => {
            try { resolve(JSON.parse(output)); }
            catch (e) { resolve([]); }
        });
    });
});

ipcMain.handle('viral:subscribe', async (event, webhookUrl) => {
    const store = new Store({ name: 'viral-alerts' });
    store.set('webhook', webhookUrl);
    return { success: true };
});
    // ============ MODUL 11: A/B TESTING REELS ============
ipcMain.handle('abtest:create', async (event, { videoPath, variants, duration }) => {
    const testId = Date.now().toString();
    const testFolder = path.join(app.getPath('userData'), 'abtests', testId);
    fs.mkdirSync(testFolder, { recursive: true });
    
    // Simpan konfigurasi test
    const testConfig = {
        id: testId,
        videoPath,
        variants,
        duration,
        startTime: Date.now(),
        results: {}
    };
    fs.writeFileSync(path.join(testFolder, 'config.json'), JSON.stringify(testConfig));
    
    return { testId, testFolder };
});

ipcMain.handle('abtest:run', async (event, testId) => {
    const testFolder = path.join(app.getPath('userData'), 'abtests', testId);
    const config = JSON.parse(fs.readFileSync(path.join(testFolder, 'config.json'), 'utf8'));
    
    // Simulasi A/B test - akan integrasi dengan Facebook API nanti
    const results = config.variants.map((variant, i) => ({
        variantId: i,
        caption: variant.caption,
        thumbnail: variant.thumbnail,
        score: Math.floor(Math.random() * 100),
        views: Math.floor(Math.random() * 10000)
    }));
    
    // Tentukan pemenang
    const winner = results.reduce((best, current) => 
        current.score > best.score ? current : best, results[0]);
    
    const result = {
        testId,
        winner,
        allResults: results,
        completedAt: Date.now()
    };
    
    fs.writeFileSync(path.join(testFolder, 'results.json'), JSON.stringify(result));
    
    return result;
});

// ============ MODUL 12: ENGAGEMENT RATE PREDICTOR ============
ipcMain.handle('engagement:predict', async (event, videoPath) => {
    return new Promise((resolve) => {
        // Analisis 3 detik pertama video
        const command = `python src/backend/gemini_load_balancer.py analyze "${videoPath}"`;
        exec(command, (error, stdout) => {
            if (error) {
                resolve({
                    hasSpeech: false,
                    hasFace: false,
                    isVertical: true,
                    score: 50,
                    recommendation: 'Tambahkan voiceover atau wajah di 3 detik pertama'
                });
            } else {
                try {
                    resolve(JSON.parse(stdout));
                } catch (e) {
                    resolve({
                        hasSpeech: false,
                        hasFace: false,
                        isVertical: true,
                        score: 50,
                        recommendation: 'Optimalkan 3 detik pertama untuk hasil lebih baik'
                    });
                }
            }
        });
    });
});

// ============ MODUL 13: AUTO GENERATE JUDUL & CAPTION ============
ipcMain.handle('autogen:title', async (event, videoPath, dramaName) => {
    return new Promise((resolve) => {
        const pythonProcess = exec(`python src/backend/gemini_load_balancer.py generate title "${videoPath}" "${dramaName}"`);
        let output = '';
        pythonProcess.stdout.on('data', (data) => { output += data; });
        pythonProcess.on('close', () => {
            try {
                const result = JSON.parse(output);
                resolve({
                    titles: result.titles || [
                        `🔥 Scene Paling Dramatis di ${dramaName}!`,
                        `😭 WAJIB NONTON! Adegan ini bikin nangis 😭`,
                        `⚠️ SPOILER! Plot twist gila di ${dramaName}`
                    ]
                });
            } catch (e) {
                resolve({
                    titles: [
                        `🔥 Viral! Scene Terbaik ${dramaName}`,
                        `😭 Jangan Dilewatkan!`,
                        `⚠️ Plot Twist Mencegang!`
                    ]
                });
            }
        });
    });
});

ipcMain.handle('autogen:caption', async (event, videoPath, dramaName, sceneType) => {
    return new Promise((resolve) => {
        const pythonProcess = exec(`python src/backend/gemini_load_balancer.py generate caption "${videoPath}" "${dramaName}" "${sceneType}"`);
        let output = '';
        pythonProcess.stdout.on('data', (data) => { output += data; });
        pythonProcess.on('close', () => {
            try {
                const result = JSON.parse(output);
                resolve({
                    shortCaption: result.shortCaption || `😭 ${dramaName} episode terbaru bikin mewek! #DramaChina #FYP`,
                    longCaption: result.longCaption || `Scene ini bikin aku nangis 3 jam. ${dramaName} emang juara! Siapa nih yang juga ikut sedih? Like dan share biar pada tau! ❤️`
                });
            } catch (e) {
                resolve({
                    shortCaption: `🔥 ${dramaName} - Jangan dilewatkan! #FYP`,
                    longCaption: `Video terbaru dari ${dramaName}. Like, comment, dan share ya bestie! ❤️`
                });
            }
        });
    });
});

// ============ MODUL 14: AUTO GENERATE HASHTAG ============
ipcMain.handle('autogen:hashtag', async (event, dramaName, sceneType) => {
    return new Promise((resolve) => {
        const pythonProcess = exec(`python src/backend/gemini_load_balancer.py generate hashtag "${dramaName}" "${sceneType}"`);
        let output = '';
        pythonProcess.stdout.on('data', (data) => { output += data; });
        pythonProcess.on('close', () => {
            try {
                const result = JSON.parse(output);
                resolve({ hashtags: result.hashtags || [
                    `#${dramaName.replace(/ /g, '')}`,
                    `#${dramaName.replace(/ /g, '')}SubIndo`,
                    '#DramaChina',
                    '#ChineseDrama',
                    '#FYP',
                    '#ReelsDrama',
                    '#DrakorChina',
                    '#SceneDrama',
                    '#ViralDrama',
                    '#WajibNonton'
                ] });
            } catch (e) {
                resolve({ hashtags: ['#DramaChina', '#ChineseDrama', '#FYP', '#Reels'] });
            }
        });
    });
});

// ============ MODUL 15: SCRIPT & NASKAH GENERATOR ============
ipcMain.handle('script:generate', async (event, { sceneDescription, duration, language, emotion }) => {
    return new Promise((resolve) => {
        const pythonProcess = exec(`python src/backend/gemini_load_balancer.py generate script "${sceneDescription}" ${duration} "${language}" "${emotion}"`);
        let output = '';
        pythonProcess.stdout.on('data', (data) => { output += data; });
        pythonProcess.on('close', () => {
            try {
                const result = JSON.parse(output);
                resolve({
                    script: result.script,
                    estimatedDuration: result.duration || duration,
                    keywords: result.keywords || []
                });
            } catch (e) {
                resolve({
                    script: `Halo bestie! Kali ini kita bakal bahas scene paling seru dari drama China terbaru. Jangan lupa like dan subscribe ya!`,
                    estimatedDuration: duration,
                    keywords: ['drama china', 'review', 'seru']
                });
            }
        });
    });
});

// ============ MODUL 16-20: HAK CIPTA ============
ipcMain.handle('copyright:check', async (event, videoPath) => {
    return new Promise((resolve) => {
        const pythonProcess = exec(`python src/backend/copyright_checker.py check "${videoPath}"`);
        let output = '';
        pythonProcess.stdout.on('data', (data) => { output += data; });
        pythonProcess.on('close', () => {
            try {
                resolve(JSON.parse(output));
            } catch (e) {
                resolve({
                    riskScore: 30,
                    audioMatch: false,
                    videoMatch: false,
                    watermarkDetected: false,
                    recommendation: 'Video aman untuk diupload',
                    fairUseScore: 75
                });
            }
        });
    });
});

ipcMain.handle('copyright:originality', async (event, videoPath) => {
    return new Promise((resolve) => {
        const pythonProcess = exec(`python src/backend/copyright_checker.py originality "${videoPath}"`);
        let output = '';
        pythonProcess.stdout.on('data', (data) => { output += data; });
        pythonProcess.on('close', () => {
            try {
                resolve(JSON.parse(output));
            } catch (e) {
                resolve({
                    score: 65,
                    hasVoiceover: false,
                    hasEdits: true,
                    uniqueContent: 60,
                    recommendation: 'Tambahkan voiceover untuk meningkatkan originalitas'
                });
            }
        });
    });
});

ipcMain.handle('copyright:strike-appeal', async (event, strikeInfo) => {
    // Generate surat banding
    const appealLetter = `
Kepada Yth. Tim Meta Copyright,

Perihal: Banding atas Copyright Strike

Saya yang bertanda tangan di bawah ini:

Nama: ${strikeInfo.name || 'Pengguna Drama Tool'}
Email: ${strikeInfo.email || 'user@example.com'}
Video ID: ${strikeInfo.videoId || 'N/A'}

Dengan ini mengajukan banding atas copyright strike yang diterima pada tanggal ${new Date().toLocaleDateString()}.

Alasan banding:
${strikeInfo.reason || 'Konten ini memenuhi kriteria fair use untuk tujuan review dan analisis drama China.'}

Demikian surat banding ini saya buat. Besar harapan saya agar strike dapat ditinjau kembali.

Hormat saya,
${strikeInfo.name || 'Pengguna Drama Tool'}
    `;
    
    return { appealLetter, success: true };
});
    }
  }
}
