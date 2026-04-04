import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const CopyrightChecker = () => {
    const [videoPath, setVideoPath] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setVideoPath(file.path);
            setLoading(true);
            const checkResult = await window.electron.copyrightPrecheck(file.path);
            setResult(checkResult);
            setLoading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv'] }
    });

    const getRiskColor = (score) => {
        if (score >= 70) return '#ff4444';
        if (score >= 40) return '#ffd93d';
        return '#4ecdc4';
    };

    const getRiskLabel = (score) => {
        if (score >= 70) return '⚠️ Risiko Tinggi';
        if (score >= 40) return '🟡 Risiko Sedang';
        return '✅ Risiko Rendah';
    };

    return (
        <div className="copyright-checker">
            <h2>⚖️ Pre-upload Copyright Checker</h2>
            
            {!videoPath ? (
                <div {...getRootProps()} className="dropzone">
                    <input {...getInputProps()} />
                    {isDragActive ? <p>Lepaskan file video di sini...</p> : <p>Upload video untuk cek hak cipta</p>}
                </div>
            ) : (
                <div className="checker-container">
                    {loading ? (
                        <div className="loading">🔍 Memeriksa hak cipta...</div>
                    ) : result ? (
                        <>
                            <div className="risk-card" style={{ borderColor: getRiskColor(result.riskScore) }}>
                                <div className="risk-score">
                                    <span className="score-value">{result.riskScore}</span>
                                    <span className="score-label">/100</span>
                                </div>
                                <div className="risk-status" style={{ color: getRiskColor(result.riskScore) }}>
                                    {getRiskLabel(result.riskScore)}
                                </div>
                            </div>
                            
                            <div className="check-details">
                                <h3>Hasil Pemeriksaan</h3>
                                <div className="detail-item">
                                    <span className="detail-label">Audio Matching:</span>
                                    <span className={`detail-value ${result.audioMatch ? 'warning' : 'safe'}`}>
                                        {result.audioMatch ? '⚠️ Terdeteksi' : '✅ Aman'}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Video Matching:</span>
                                    <span className={`detail-value ${result.videoMatch ? 'warning' : 'safe'}`}>
                                        {result.videoMatch ? '⚠️ Terdeteksi' : '✅ Aman'}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Watermark:</span>
                                    <span className={`detail-value ${result.watermarkDetected ? 'warning' : 'safe'}`}>
                                        {result.watermarkDetected ? '⚠️ Terdeteksi' : '✅ Tidak Ada'}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Fair Use Score:</span>
                                    <span className="detail-value">{result.fairUseScore}/100</span>
                                </div>
                            </div>
                            
                            <div className="recommendation-box">
                                <h3>💡 Rekomendasi</h3>
                                <p>{result.recommendation}</p>
                            </div>
                            
                            {result.riskScore >= 40 && (
                                <div className="warning-tips">
                                    <h4>🛡️ Tips Menghindari Strike:</h4>
                                    <ul>
                                        <li>Tambahkan voiceover asli (bicara sendiri)</li>
                                        <li>Potong video menjadi lebih pendek (max 30 detik)</li>
                                        <li>Tambahkan teks overlay atau efek</li>
                                        <li>Crop video agar tidak persis sama dengan original</li>
                                        <li>Kombinasikan beberapa scene dari episode berbeda</li>
                                    </ul>
                                </div>
                            )}
                            
                            <button onClick={() => setVideoPath(null)} className="btn-secondary">Cek Video Lain</button>
                        </>
                    ) : (
                        <div className="error">Gagal memeriksa video</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CopyrightChecker;
