import React, { useState } from 'react';

const ImportFromSocial = () => {
    const [url, setUrl] = useState('');
    const [platform, setPlatform] = useState('tiktok');
    const [downloading, setDownloading] = useState(false);
    const [result, setResult] = useState(null);

    const platforms = [
        { id: 'tiktok',    name: 'TikTok',           icon: '🎵', color: '#010101' },
        { id: 'youtube',   name: 'YouTube Shorts',    icon: '▶️', color: '#ff0000' },
        { id: 'instagram', name: 'Instagram Reels',   icon: '📷', color: '#e4405f' }
    ];

    const downloadVideo = async () => {
        if (!url) {
            alert('Masukkan URL video');
            return;
        }
        setDownloading(true);

        try {
            // FIX: Tidak pakai require('os') di renderer — path ditentukan di main process via IPC
            // main.js harus handle 'import:download' dan mengembalikan outputPath
            const downloadResult = await window.electron.importDownload({ url, platform });

            if (!downloadResult.success) {
                alert('Gagal download: ' + (downloadResult.error || 'Unknown error'));
                setDownloading(false);
                return;
            }

            const { outputPath } = downloadResult;

            // Hapus watermark
            const cleanResult = await window.electron.importRemoveWatermark({
                inputPath: outputPath,
                outputPath: outputPath.replace('.mp4', '_clean.mp4'),
                platform
            });

            setResult({
                original: outputPath,
                clean: cleanResult.outputPath || outputPath.replace('.mp4', '_clean.mp4')
            });
        } catch (err) {
            alert('Error: ' + err.message);
        }

        setDownloading(false);
    };

    const copyPath = (path) => {
        navigator.clipboard.writeText(path);
        alert('Path disalin!');
    };

    return (
        <div className="import-social">
            <h2>📥 Import dari TikTok/YouTube/Instagram</h2>

            <div className="platform-selector">
                {platforms.map((p) => (
                    <button
                        key={p.id}
                        className={`platform-btn ${platform === p.id ? 'active' : ''}`}
                        style={{ background: platform === p.id ? p.color : 'transparent' }}
                        onClick={() => setPlatform(p.id)}
                    >
                        {p.icon} {p.name}
                    </button>
                ))}
            </div>

            <div className="input-section">
                <input
                    type="text"
                    placeholder="Tempelkan URL video di sini..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
                <button onClick={downloadVideo} disabled={downloading}>
                    {downloading ? 'Mendownload...' : '📥 Download & Hapus Watermark'}
                </button>
            </div>

            {result && (
                <div className="result-section">
                    <h3>✅ Download Berhasil!</h3>
                    <div className="result-item">
                        <span>📹 Video Original:</span>
                        <code>{result.original}</code>
                        <button onClick={() => copyPath(result.original)}>Copy Path</button>
                    </div>
                    <div className="result-item">
                        <span>✨ Tanpa Watermark:</span>
                        <code>{result.clean}</code>
                        <button onClick={() => copyPath(result.clean)}>Copy Path</button>
                    </div>
                    <button onClick={() => alert('Fitur import ke editor akan segera hadir!')}>
                        🎬 Buka di Video Editor
                    </button>
                </div>
            )}

            <div className="info-box">
                <h4>📖 Catatan Penting</h4>
                <ul>
                    <li>⚠️ Gunakan untuk konten review / fair use</li>
                    <li>✅ Selalu tambahkan voiceover asli</li>
                    <li>📝 Berikan credit ke pembuat asli</li>
                    <li>🚫 Jangan re-upload tanpa edit signifikan</li>
                </ul>
            </div>
        </div>
    );
};

export default ImportFromSocial;
