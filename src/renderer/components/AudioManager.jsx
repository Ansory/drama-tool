import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

const AudioManager = () => {
    const [videoPath, setVideoPath] = useState(null);
    const [trendingAudio, setTrendingAudio] = useState([]);
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadTrendingAudio();
    }, []);

    const loadTrendingAudio = async () => {
        const audio = await window.electron.audioGetTrending();
        setTrendingAudio(audio);
    };

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

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'voiceover.webm';
            a.click();
            setRecording(false);
        };
        
        recorder.start();
        setMediaRecorder(recorder);
        setRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    };

    const extractAudio = async () => {
        if (!videoPath) return;
        setProcessing(true);
        const outputPath = videoPath.replace(/\.[^/.]+$/, '') + '_audio.mp3';
        await window.electron.audioExtract(videoPath, outputPath);
        alert(`Audio berhasil diekstrak: ${outputPath}`);
        setProcessing(false);
    };

    const reduceNoise = async () => {
        if (!videoPath) return;
        setProcessing(true);
        const outputPath = videoPath.replace(/\.[^/.]+$/, '') + '_denoised.mp3';
        await window.electron.audioReduceNoise(videoPath, outputPath);
        alert(`Noise berhasil dikurangi: ${outputPath}`);
        setProcessing(false);
    };

    return (
        <div className="audio-manager">
            <h2>🎵 Audio & Musik</h2>
            
            <div className="trending-audio">
                <h3>🔥 Backsound Viral</h3>
                <div className="audio-grid">
                    {trendingAudio.map((audio, i) => (
                        <div key={i} className="audio-card">
                            <div className="audio-icon">🎵</div>
                            <div className="audio-name">{audio.name}</div>
                            <div className="audio-usage">{audio.usageCount} video</div>
                            <button className="btn-small">Preview</button>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="voiceover-section">
                <h3>🎙️ Voiceover Recorder</h3>
                <div className="voiceover-controls">
                    {!recording ? (
                        <button onClick={startRecording} className="btn-record">🔴 Mulai Rekam</button>
                    ) : (
                        <button onClick={stopRecording} className="btn-stop">⏹️ Stop Rekam</button>
                    )}
                </div>
            </div>
            
            <div className="video-audio-section">
                <h3>📹 Ekstrak Audio dari Video</h3>
                <div {...getRootProps()} className="mini-dropzone">
                    <input {...getInputProps()} />
                    {isDragActive ? <p>Lepaskan file video...</p> : <p>Drag & drop video, atau klik</p>}
                </div>
                {videoPath && (
                    <div className="video-info">
                        <p>Video: {videoPath.split('\\').pop()}</p>
                        <button onClick={extractAudio} disabled={processing}>🎵 Ekstrak Audio</button>
                        <button onClick={reduceNoise} disabled={processing}>🔇 Kurangi Noise</button>
                    </div>
                )}
            </div>
            
            <div className="music-detector">
                <h3>🔍 Deteksi Musik dari Video Viral</h3>
                <p className="info-text">Upload video dari kompetitor untuk mengetahui backsound yang mereka gunakan</p>
                <div className="coming-soon">🚀 Fitur segera hadir</div>
            </div>
        </div>
    );
};

export default AudioManager;
