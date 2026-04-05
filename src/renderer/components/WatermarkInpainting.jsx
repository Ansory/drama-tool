import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const WatermarkInpainting = () => {
    const [videoPath, setVideoPath] = useState(null);
    const [watermarks, setWatermarks] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [watermarkSettings, setWatermarkSettings] = useState({
        position: 'bottom-right',
        opacity: 0.8,
        watermarkPath: ''
    });

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setVideoPath(file.path);
            const detected = await window.electron.watermarkDetect(file.path);
            setWatermarks(detected || []);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv'] }
    });

    const handleRemoveWatermark = async () => {
        setProcessing(true);
        const outputPath = `${videoPath}_nowatermark_${Date.now()}.mp4`;
        try {
            await window.electron.watermarkRemove({
                videoPath,
                outputPath,
                watermarkAreas: watermarks
            });
            alert(`Watermark berhasil dihapus! Disimpan di: ${outputPath}`);
        } catch (error) {
            alert('Error: ' + error.message);
        }
        setProcessing(false);
    };

    const handleAddWatermark = async () => {
        if (!watermarkSettings.watermarkPath) {
            alert('Pilih file watermark terlebih dahulu (logo.png)');
            return;
        }
        setProcessing(true);
        const outputPath = `${videoPath}_watermarked_${Date.now()}.mp4`;
        try {
            await window.electron.watermarkAdd({
                inputPath: videoPath,
                outputPath,
                watermarkPath: watermarkSettings.watermarkPath,
                position: watermarkSettings.position,
                opacity: watermarkSettings.opacity
            });
            alert(`Watermark berhasil ditambahkan! Disimpan di: ${outputPath}`);
        } catch (error) {
            alert('Error: ' + error.message);
        }
        setProcessing(false);
    };

    // FIX: Pakai showOpenDialog via IPC (bukan window.electron.openDialog yang tidak ada)
    const handleSelectWatermark = async () => {
        const result = await window.electron.showOpenDialog({
            filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'ico'] }],
            properties: ['openFile']
        });
        if (result && !result.canceled && result.filePaths && result.filePaths[0]) {
            setWatermarkSettings({ ...watermarkSettings, watermarkPath: result.filePaths[0] });
        }
    };

    return (
        <div className="watermark-inpainting">
            <h2>💧 Watermark + Inpainting</h2>

            {!videoPath ? (
                <div {...getRootProps()} className="dropzone">
                    <input {...getInputProps()} />
                    {isDragActive ? <p>Lepaskan file video di sini...</p> : <p>Drag & drop video untuk deteksi watermark</p>}
                </div>
            ) : (
                <div className="video-info">
                    <h3>Video: {videoPath.split('\\').pop()}</h3>

                    {watermarks.length > 0 && (
                        <div className="detected-watermarks">
                            <h4>🔍 Watermark Terdeteksi:</h4>
                            {watermarks.map((wm, i) => (
                                <div key={i} className="watermark-item">
                                    Posisi: x={wm.x}, y={wm.y}, width={wm.width}, height={wm.height}
                                </div>
                            ))}
                            <button onClick={handleRemoveWatermark} disabled={processing}>🗑️ Hapus Watermark</button>
                        </div>
                    )}

                    <div className="add-watermark">
                        <h4>➕ Tambah Watermark Baru</h4>
                        {/* FIX: Pakai handleSelectWatermark via IPC showOpenDialog */}
                        <button onClick={handleSelectWatermark}>📁 Pilih File Watermark</button>
                        {watermarkSettings.watermarkPath && (
                            <p>Watermark: {watermarkSettings.watermarkPath.split('\\').pop()}</p>
                        )}

                        <label>Posisi:
                            <select
                                value={watermarkSettings.position}
                                onChange={(e) => setWatermarkSettings({ ...watermarkSettings, position: e.target.value })}
                            >
                                <option value="top-left">Atas Kiri</option>
                                <option value="top-right">Atas Kanan</option>
                                <option value="bottom-left">Bawah Kiri</option>
                                <option value="bottom-right">Bawah Kanan</option>
                            </select>
                        </label>

                        <label>Opacity:
                            <input
                                type="range" min="0" max="1" step="0.1"
                                value={watermarkSettings.opacity}
                                onChange={(e) => setWatermarkSettings({ ...watermarkSettings, opacity: parseFloat(e.target.value) })}
                            />
                            {watermarkSettings.opacity}
                        </label>

                        <button onClick={handleAddWatermark} disabled={processing}>💧 Tambah Watermark</button>
                    </div>

                    {processing && <div className="progress">Processing... Mohon tunggu</div>}
                    <button onClick={() => setVideoPath(null)} className="btn-secondary">Pilih Video Lain</button>
                </div>
            )}
        </div>
    );
};

export default WatermarkInpainting;
