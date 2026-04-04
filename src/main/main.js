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
    }
  }
}
