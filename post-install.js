const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function postInstall() {
    console.log('🔧 Running post-install setup...');
    
    const platform = os.platform();
    const userDataPath = path.join(os.homedir(), 'Documents', 'DramaTool');
    
    // Create user data folders
    const folders = [
        userDataPath,
        path.join(userDataPath, 'videos', 'raw'),
        path.join(userDataPath, 'videos', 'processed'),
        path.join(userDataPath, 'videos', 'clips'),
        path.join(userDataPath, 'database'),
        path.join(userDataPath, 'logs'),
        path.join(userDataPath, 'models')
    ];
    
    folders.forEach(folder => {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
            console.log(`📁 Created: ${folder}`);
        }
    });
    
    // Initialize database
    const dbPath = path.join(userDataPath, 'database', 'drama_tool.db');
    if (!fs.existsSync(dbPath)) {
        console.log('🗄️ Creating database...');
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database(dbPath);
        
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                video_path TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
            
            db.run(`CREATE TABLE IF NOT EXISTS clips (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER,
                start_time REAL,
                end_time REAL,
                viral_score INTEGER,
                status TEXT
            )`);
        });
        
        db.close();
    }
    
    // Check for GPU (CUDA)
    if (platform === 'win32') {
        console.log('🎮 Checking for NVIDIA GPU...');
        const nvidiaSmi = spawn('nvidia-smi', ['--query-gpu=name', '--format=csv,noheader']);
        
        nvidiaSmi.stdout.on('data', (data) => {
            const gpuName = data.toString().trim();
            if (gpuName) {
                console.log(`✅ NVIDIA GPU detected: ${gpuName}`);
                console.log('   GPU acceleration will be enabled');
            } else {
                console.log('⚠️ No NVIDIA GPU detected, using CPU mode (slower)');
            }
        });
        
        nvidiaSmi.on('error', () => {
            console.log('⚠️ NVIDIA GPU not found, using CPU mode');
        });
    }
    
    console.log('\n✅ Post-install setup complete!');
    console.log(`📁 Data folder: ${userDataPath}`);
}

postInstall().catch(console.error);