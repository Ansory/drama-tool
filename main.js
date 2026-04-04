const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        title: 'Drama Tool',
        backgroundColor: '#1a1a2e'
    });

    // Konten HTML sederhana untuk tampilan aplikasi
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Drama Tool</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                text-align: center;
            }
            h1 {
                font-size: 48px;
                background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            p {
                color: #aaa;
                font-size: 18px;
            }
            .status {
                margin-top: 20px;
                padding: 10px 20px;
                background: rgba(78,205,196,0.2);
                border-radius: 8px;
                display: inline-block;
            }
            .footer {
                margin-top: 40px;
                font-size: 12px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div>
            <h1>🎬 DRAMA TOOL</h1>
            <p>Video Generator + Planner Konten Drama China</p>
            <div class="status">
                ✅ Aplikasi Berjalan! | Versi 1.0.0
            </div>
            <div class="footer">
                🚀 Fitur lengkap segera hadir
            </div>
        </div>
    </body>
    </html>
    `)}`);
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
