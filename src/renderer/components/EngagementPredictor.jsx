import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const EngagementPredictor = () => {
    const [videoPath, setVideoPath] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setVideoPath(file.path);
            setLoading(true);
            const result = await window.electron.engagementPredict(file.path);
            setPrediction(result);
            setLoading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.mov', '.avi'] }
    });

    const CheckItem = ({ label, value, good }) => (
        <div className={`check-item ${value ? 'pass' : 'fail'}`}>
            <span className="check-icon">{value ? '✅' : '❌'}</span>
            <span className="check-label">{label}</span>
            <span className="check-status">{value ? (good ? 'Bagus!' : 'Terdeteksi') : 'Tidak Terdeteksi'}</span>
        </div>
    );

    return (
        <div className="engagement-predictor">
            <h2>📊 Engagement Rate Predictor</h2>
            
            {!videoPath ? (
                <div {...getRootProps()} className="dropzone">
                    <input {...getInputProps()} />
                    {isDragActive ? <p>Lepaskan file video di sini...</p> : <p>Upload video untuk analisis 3 detik pertama</p>}
                </div>
            ) : (
                <div className="prediction-container">
                    {loading ? (
                        <div className="loading">Menganalisis 3 detik pertama...</div>
                    ) : prediction ? (
                        <>
                            <div className="three-second-analysis">
                                <h3>🎯 Analisis 3 Detik Pertama</h3>
                                <div className="checklist">
                                    <CheckItem label="Ada suara manusia" value={prediction.hasSpeech} />
                                    <CheckItem label="Ada wajah" value={prediction.hasFace} />
                                    <CheckItem label="Aspek rasio 9:16 (vertikal)" value={prediction.isVertical} good={true} />
                                </div>
                            </div>
                            
                            <div className="score-card">
                                <div className="score-value">{prediction.score}/100</div>
                                <div className="score-label">Prediksi Retention 10 Detik</div>
                            </div>
                            
                            <div className="recommendation-box">
                                <h3>💡 Rekomendasi</h3>
                                <p>{prediction.recommendation}</p>
                            </div>
                            
                            <div className="tips-section">
                                <h3>📌 Tips dari Meta (2026)</h3>
                                <ul>
                                    <li>✨ Video dengan suara manusia di 3 detik pertama → retention +25%</li>
                                    <li>✨ Video dengan wajah di 3 detik pertama → retention +10%</li>
                                    <li>✨ Video vertikal (9:16) → reach +20.9%</li>
                                    <li>✨ Looping seamless → replay rate +18.7%</li>
                                </ul>
                            </div>
                        </>
                    ) : (
                        <div className="error">Gagal menganalisis video</div>
                    )}
                    
                    <button onClick={() => setVideoPath(null)} className="btn-secondary">Analisis Video Lain</button>
                </div>
            )}
        </div>
    );
};

export default EngagementPredictor;
