import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const ThumbnailGenerator = () => {
    const [videoPath, setVideoPath] = useState(null);
    const [thumbnails, setThumbnails] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [textSettings, setTextSettings] = useState({
        text: '',
        position: 'center',
        fontSize: 48,
        color: 'white'
    });

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setVideoPath(file.path);
            // Extract thumbnails at 3 key timestamps
            const timestamps = [0, 5, 10, 15, 20, 30]; // seconds
            const outputFolder = file.path.replace(/\.[^/.]+$/, '') + '_thumbnails';
            
            setProcessing(true);
            const results = await window.electron.thumbnailExtract({
                videoPath: file.path,
                timestamps,
                outputFolder
            });
            setThumbnails(results);
            setProcessing(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv'] }
    });

    const handleAddTextToThumbnail = async (thumbnailPath) => {
        if (!textSettings.text) {
            alert('Masukkan teks terlebih dahulu');
            return;
        }
        
        const outputPath = thumbnailPath.replace('.png', '_text.png');
        await window.electron.thumbnailAddText({
            thumbnailPath,
            outputPath,
            text: textSettings.text,
            position: textSettings.position,
            fontSize: textSettings.fontSize,
            color: textSettings.color
        });
        
        // Refresh thumbnails list
        alert(`Teks berhasil ditambahkan! Disimpan di: ${outputPath}`);
    };

    return (
        <div className="thumbnail-generator">
            <h2>🖼️ Thumbnail Generator</h2>
            
            {!videoPath ? (
                <div {...getRootProps()} className="dropzone">
                    <input {...getInputProps()} />
                    {isDragActive ? <p>Lepaskan file video di sini...</p> : <p>Drag & drop video untuk generate thumbnail</p>}
                </div>
            ) : (
                <div className="video-info">
                    <h3>Video: {videoPath.split('\\').pop()}</h3>
                    
                    <div className="text-settings">
                        <h4>✏️ Pengaturan Teks Thumbnail</h4>
                        <input type="text" placeholder="Teks untuk thumbnail" value={textSettings.text} onChange={(e) => setTextSettings({...textSettings, text: e.target.value})} />
                        <select value={textSettings.position} onChange={(e) => setTextSettings({...textSettings, position: e.target.value})}>
                            <option value="top">Atas</option>
                            <option value="center">Tengah</option>
                            <option value="bottom">Bawah</option>
                        </select>
                        <label>Font Size: <input type="number" value={textSettings.fontSize} onChange={(e) => setTextSettings({...textSettings, fontSize: parseInt(e.target.value)})} /></label>
                        <label>Color: <input type="color" value={textSettings.color} onChange={(e) => setTextSettings({...textSettings, color: e.target.value})} /></label>
                    </div>
                    
                    {processing && <div className="progress">Extracting thumbnails...</div>}
                    
                    <div className="thumbnails-grid">
                        {thumbnails.map((thumb, i) => (
                            <div key={i} className="thumbnail-card">
                                <p>Timestamp: {thumb.timestamp} detik</p>
                                <img src={`file://${thumb.path}`} alt={`Thumbnail at ${thumb.timestamp}s`} style={{width: '100%', borderRadius: '8px'}} />
                                <button onClick={() => handleAddTextToThumbnail(thumb.path)}>📝 Tambah Teks</button>
                            </div>
                        ))}
                    </div>
                    
                    <button onClick={() => setVideoPath(null)} className="btn-secondary">Pilih Video Lain</button>
                </div>
            )}
        </div>
    );
};

export default ThumbnailGenerator;
