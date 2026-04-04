// update-server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Konfigurasi
const LATEST_VERSION = '1.0.5';
const RELEASE_NOTES = `
### Fitur Baru v1.0.5
- Auto balas komentar AI dengan Gemini
- Penghilang subtitle otomatis
- Multi-API key load balancer

### Perbaikan
- Fix bug upload ke Facebook
- Peningkatan performa inpainting

### Catatan
- Perlu update manual untuk versi ini
`;

// Endpoint cek update
app.get('/api/check-update', (req, res) => {
    const currentVersion = req.query.version;
    
    if (currentVersion !== LATEST_VERSION) {
        res.json({
            updateAvailable: true,
            version: LATEST_VERSION,
            releaseDate: '2026-03-25T00:00:00Z',
            releaseNotes: RELEASE_NOTES,
            downloadUrl: `https://updates.dramatool.com/download/DramaTool-Setup-${LATEST_VERSION}.exe`,
            sha512: generateSha512(`DramaTool-Setup-${LATEST_VERSION}.exe`)
        });
    } else {
        res.json({
            updateAvailable: false
        });
    }
});

// Endpoint download update
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'releases', filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Generate SHA512 untuk verifikasi
function generateSha512(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha512');
    hash.update(fileBuffer);
    return hash.digest('hex');
}

app.listen(PORT, () => {
    console.log(`Update server running on http://localhost:${PORT}`);
});