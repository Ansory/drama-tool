import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const AntiStrike = () => {
    const [videoPath, setVideoPath] = useState(null);
    const [originalityScore, setOriginalityScore] = useState(null);
    const [loading, setLoading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setVideoPath(file.path);
            setLoading(true);
            const result = await window.electron.antistrikeScore(file.path);
            setOriginalityScore(result);
            setLoading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv'] }
    });

    const getScoreColor = (score) => {
        if (score >= 70) return '#4ecdc4';
        if (score >= 50) return '#ffd93d';
        return '#ff4444';
    };

    return (
        <div className="anti-strike">
            <h2>🛡️ Anti-Copyright Strike</h2>
            
            {!videoPath ? (
                <div {...getRootProps()} className="dropzone">
                    <input {...getInputProps()} />
                    {isDragActive ? <p>Lepaskan file video di sini...</p> : <p>Upload video untuk cek originalitas</p>}
                </div>
            ) : (
                <div className="result-container">
                    {loading ? (
                        <div className="loading">Menganalisis originalitas...</div>
                    ) : originalityScore ? (
                        <>
                            <div className="score-circle" style={{ borderColor: getScoreColor(originalityScore.score) }}>
                                <div className="score-value">{originalityScore.score}</div>
                                <div className="score-label">/100</div>
                            </div>
                            <div className="score-label-text">Skor Originalitas</div>
                            
                            <div className="metrics">
                                <div className="metric">
                                    <span>Voiceover Asli:</span>
                                    <span className={originalityScore.hasVoiceover ? 'yes' : 'no'}>
                                        {originalityScore.hasVoiceover ? '✅ Ada' : '❌ Tidak Ada'}
                                    </span>
                                </div>
                                <div className="metric">
                                    <span>Editing Signifikan:</span>
                                    <span className={originalityScore.hasEdits ? 'yes' : 'no'}>
                                        {originalityScore.hasEdits ? '✅ Ya' : '❌ Tidak'}
                                    </span>
                                </div>
                                <div className="metric">
                                    <span>Konten Unik:</span>
                                    <span>{originalityScore.uniqueContent}%</span>
                                </div>
                                <div className="metric">
                                    <span>Edit Density:</span>
                                    <span>{originalityScore.editDensity}%</span>
                                </div>
                            </div>
                            
                            <div className="recommendation">
                                <h3>💡 Rekomendasi</h3>
                                <p>{originalityScore.recommendation}</p>
                            </div>
                            
                            {originalityScore.score < 50 && (
                                <div className="tips">
                                    <h4>Cara Meningkatkan Originalitas:</h4>
                                    <ul>
                                        <li>🎙️ Tambahkan voiceover asli (bicara sendiri)</li>
                                        <li>✂️ Potong video menjadi lebih pendek</li>
                                        <li>🎬 Tambahkan transisi dan efek</li>
                                        <li>📝 Tambahkan teks overlay</li>
                                        <li>🖼️ Crop atau zoom video</li>
                                        <li>🎵 Ganti backsound dengan yang berbeda</li>
                                    </ul>
                                </div>
                            )}
                            
                            <button onClick={() => setVideoPath(null)} className="btn-secondary">Cek Video Lain</button>
                        </>
                    ) : (
                        <div className="error">Gagal menganalisis</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AntiStrike;
