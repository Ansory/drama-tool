import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const VideoEditor = () => {
    const [videoPath, setVideoPath] = useState(null);
    const [videoInfo, setVideoInfo] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [cropSettings, setCropSettings] = useState({
        startTime: 0,
        endTime: 10,
        targetWidth: 1080,
        targetHeight: 1920
    });

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setVideoPath(file.path);
            const info = await window.electron.videoGetInfo(file.path);
            setVideoInfo(info);
            setCropSettings({
                ...cropSettings,
                endTime: Math.min(10, info.duration)
            });
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv'] }
    });

    const handleCrop = async () => {
        setProcessing(true);
        const outputPath = `${videoPath}_cropped_${Date.now()}.mp4`;
        try {
            await window.electron.videoCrop({
                inputPath: videoPath,
                outputPath,
                startTime: cropSettings.startTime,
                endTime: cropSettings.endTime,
                targetWidth: cropSettings.targetWidth,
                targetHeight: cropSettings.targetHeight
            });
            alert(`Video berhasil di-crop! Disimpan di: ${outputPath}`);
        } catch (error) {
            alert('Error: ' + error.message);
        }
        setProcessing(false);
    };

    const handleResize = async () => {
        setProcessing(true);
        const outputPath = `${videoPath}_resized_${Date.now()}.mp4`;
        try {
            await window.electron.videoResize({
                inputPath: videoPath,
                outputPath,
                width: cropSettings.targetWidth,
                height: cropSettings.targetHeight
            });
            alert(`Video berhasil di-resize! Disimpan di: ${outputPath}`);
        } catch (error) {
            alert('Error: ' + error.message);
        }
        setProcessing(false);
    };

    const handleAddSubtitle = async () => {
        setProcessing(true);
        const subtitleText = prompt('Masukkan teks subtitle:', 'Contoh subtitle');
        if (subtitleText) {
            const outputPath = `${videoPath}_subtitled_${Date.now()}.mp4`;
            try {
                await window.electron.videoAddSubtitle({
                    inputPath: videoPath,
                    outputPath,
                    subtitleText,
                    position: 'bottom'
                });
                alert(`Subtitle berhasil ditambahkan! Disimpan di: ${outputPath}`);
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        setProcessing(false);
    };

    const handleChangeSpeed = async () => {
        setProcessing(true);
        const speed = parseFloat(prompt('Masukkan kecepatan (0.5 = lambat, 2 = cepat):', '1'));
        if (speed && speed !== 1) {
            const outputPath = `${videoPath}_speed_${Date.now()}.mp4`;
            try {
                await window.electron.videoChangeSpeed({
                    inputPath: videoPath,
                    outputPath,
                    speed
                });
                alert(`Kecepatan video berhasil diubah! Disimpan di: ${outputPath}`);
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        setProcessing(false);
    };

    return (
        <div className="video-editor">
            <h2>🎬 Video Generator</h2>
            
            {!videoPath ? (
                <div {...getRootProps()} className="dropzone">
                    <input {...getInputProps()} />
                    {isDragActive ? (
                        <p>Lepaskan file video di sini...</p>
                    ) : (
                        <p>Drag & drop video, atau klik untuk memilih</p>
                    )}
                </div>
            ) : (
                <div className="video-info">
                    <h3>Info Video:</h3>
                    <p>📹 Path: {videoPath}</p>
                    <p>⏱️ Durasi: {Math.floor(videoInfo?.duration / 60)} menit {(videoInfo?.duration % 60).toFixed(0)} detik</p>
                    <p>📏 Resolusi: {videoInfo?.width} x {videoInfo?.height}</p>
                    <p>💾 Ukuran: {(videoInfo?.size / 1024 / 1024).toFixed(2)} MB</p>
                    
                    <div className="controls">
                        <h3>✂️ Crop & Resize</h3>
                        <label>Mulai (detik): 
                            <input type="number" value={cropSettings.startTime} onChange={(e) => setCropSettings({...cropSettings, startTime: parseFloat(e.target.value)})} />
                        </label>
                        <label>Selesai (detik): 
                            <input type="number" value={cropSettings.endTime} onChange={(e) => setCropSettings({...cropSettings, endTime: parseFloat(e.target.value)})} />
                        </label>
                        <label>Target Width: 
                            <input type="number" value={cropSettings.targetWidth} onChange={(e) => setCropSettings({...cropSettings, targetWidth: parseInt(e.target.value)})} />
                        </label>
                        <label>Target Height: 
                            <input type="number" value={cropSettings.targetHeight} onChange={(e) => setCropSettings({...cropSettings, targetHeight: parseInt(e.target.value)})} />
                        </label>
                        
                        <div className="button-group">
                            <button onClick={handleCrop} disabled={processing}>✂️ Crop Video</button>
                            <button onClick={handleResize} disabled={processing}>📐 Resize Video</button>
                            <button onClick={handleAddSubtitle} disabled={processing}>📝 Tambah Subtitle</button>
                            <button onClick={handleChangeSpeed} disabled={processing}>⚡ Ubah Kecepatan</button>
                        </div>
                        
                        {processing && <div className="progress">Processing... <div className="progress-bar" style={{width: `${progress}%`}} /></div>}
                    </div>
                    
                    <button onClick={() => setVideoPath(null)} className="btn-secondary">Pilih Video Lain</button>
                </div>
            )}
        </div>
    );
};

export default VideoEditor;
