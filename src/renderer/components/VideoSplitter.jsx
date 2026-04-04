import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const VideoSplitter = () => {
    const [videoPath, setVideoPath] = useState(null);
    const [clips, setClips] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [settings, setSettings] = useState({
        minDuration: 15,
        maxDuration: 30,
        viralThreshold: 70
    });

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setVideoPath(file.path);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv'] }
    });

    const handleSplit = async () => {
        setProcessing(true);
        const outputFolder = videoPath.replace(/\.[^/.]+$/, '') + '_clips';
        
        try {
            const result = await window.electron.videoSplitScenes({
                videoPath,
                outputFolder,
                minDuration: settings.minDuration,
                maxDuration: settings.maxDuration,
                viralThreshold: settings.viralThreshold
            });
            
            setClips(result.clips || []);
            alert(`Berhasil memecah video menjadi ${result.clips?.length || 0} clip!`);
        } catch (error) {
            alert('Error: ' + error.message);
        }
        setProcessing(false);
    };

    const detectScenes = async () => {
        setProcessing(true);
        const scenes = await window.electron.videoDetectScenes(videoPath);
        alert(`Terdeteksi ${scenes.length} scene!`);
        setProcessing(false);
    };

    return (
        <div className="video-splitter">
            <h2>✂️ Auto Pecah Video Panjang</h2>
            
            {!videoPath ? (
                <div {...getRootProps()} className="dropzone">
                    <input {...getInputProps()} />
                    {isDragActive ? <p>Lepaskan file video di sini...</p> : <p>Drag & drop video panjang (1-2 jam) di sini</p>}
                </div>
            ) : (
                <div className="video-info">
                    <h3>Video: {videoPath.split('\\').pop()}</h3>
                    
                    <div className="split-settings">
                        <h4>⚙️ Pengaturan Pecahan:</h4>
                        <label>Durasi Minimal (detik): <input type="number" value={settings.minDuration} onChange={(e) => setSettings({...settings, minDuration: parseInt(e.target.value)})} /></label>
                        <label>Durasi Maksimal (detik): <input type="number" value={settings.maxDuration} onChange={(e) => setSettings({...settings, maxDuration: parseInt(e.target.value)})} /></label>
                        <label>Threshold Viral (0-100): <input type="number" value={settings.viralThreshold} onChange={(e) => setSettings({...settings, viralThreshold: parseInt(e.target.value)})} /></label>
                    </div>
                    
                    <div className="button-group">
                        <button onClick={detectScenes} disabled={processing}>🔍 Deteksi Scene</button>
                        <button onClick={handleSplit} disabled={processing}>✂️ Pecah Video Otomatis</button>
                    </div>
                    
                    {processing && <div className="progress">Processing... Ini bisa memakan waktu beberapa menit</div>}
                    
                    {clips.length > 0 && (
                        <div className="clips-list">
                            <h4>📹 Hasil Pecahan ({clips.length} clip):</h4>
                            {clips.map((clip, i) => (
                                <div key={i} className="clip-item">
                                    Clip {i+1}: {clip.start}s - {clip.end}s | Durasi: {clip.duration}s | Viral Score: {clip.viralScore}
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <button onClick={() => setVideoPath(null)} className="btn-secondary">Pilih Video Lain</button>
                </div>
            )}
        </div>
    );
};

export default VideoSplitter;
