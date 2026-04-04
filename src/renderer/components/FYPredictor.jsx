import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const FYPredictor = () => {
    const [videoPath, setVideoPath] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setVideoPath(file.path);
            setLoading(true);
            const result = await window.electron.fypPredict(file.path);
            setPrediction(result);
            setLoading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv'] }
    });

    const getScoreColor = (score) => {
        if (score >= 80) return '#4ecdc4';
        if (score >= 60) return '#ffd93d';
        return '#ff6b6b';
    };

    const getScoreLabel = (score) => {
        if (score >= 80) return '🔥 POTENSI VIRAL!';
        if (score >= 60) return '👍 Berpotensi';
        if (score >= 40) return '⚠️ Cukup';
        return '📉 Rendah';
    };

    const MetricBar = ({ label, value, max = 100 }) => (
        <div className="metric-bar">
            <div className="metric-label">{label}</div>
            <div className="metric-bar-bg">
                <div className="metric-bar-fill" style={{ width: `${(value / max) * 100}%`, background: getScoreColor(value) }}></div>
            </div>
            <div className="metric-value">{value}/100</div>
        </div>
    );

    return (
        <div className="fyp-predictor">
            <h2>📈 Prediksi Potensi FYP</h2>
            
            {!videoPath ? (
                <div {...getRootProps()} className="dropzone">
                    <input {...getInputProps()} />
                    {isDragActive ? <p>Lepaskan file video di sini...</p> : <p>Drag & drop video untuk analisis FYP</p>}
                </div>
            ) : (
                <div className="prediction-result">
                    {loading ? (
                        <div className="loading">Menganalisis video...</div>
                    ) : prediction ? (
                        <>
                            <div className="score-circle" style={{ borderColor: getScoreColor(prediction.score) }}>
                                <div className="score-value">{prediction.score}</div>
                                <div className="score-label">/100</div>
                            </div>
                            <div className="score-status" style={{ color: getScoreColor(prediction.score) }}>
                                {getScoreLabel(prediction.score)}
                            </div>
                            
                            <div className="metrics">
                                <h3>📊 11 Metrik Prediktif</h3>
                                <MetricBar label="Hook Strength" value={prediction.metrics?.hook || 0} />
                                <MetricBar label="Retention Prediction" value={prediction.metrics?.retention || 0} />
                                <MetricBar label="Emotional Trigger" value={prediction.metrics?.emotional || 0} />
                                <MetricBar label="Completion Rate" value={prediction.metrics?.completion || 0} />
                                <MetricBar label="Shareability" value={prediction.metrics?.shareability || 0} />
                                <MetricBar label="Comment Trigger" value={prediction.metrics?.comment || 0} />
                                <MetricBar label="Save Rate" value={prediction.metrics?.save || 0} />
                                <MetricBar label="Audio Virality" value={prediction.metrics?.audio || 0} />
                                <MetricBar label="Hashtag Strength" value={prediction.metrics?.hashtag || 0} />
                                <MetricBar label="Timing Score" value={prediction.metrics?.timing || 0} />
                            </div>
                            
                            {prediction.weaknesses?.length > 0 && (
                                <div className="weaknesses">
                                    <h3>⚠️ Weaknesses Detected</h3>
                                    {prediction.weaknesses.map((w, i) => (
                                        <div key={i} className="weakness-item">• {w}</div>
                                    ))}
                                </div>
                            )}
                            
                            {prediction.recommendations?.length > 0 && (
                                <div className="recommendations">
                                    <h3>💡 Rekomendasi Perbaikan</h3>
                                    {prediction.recommendations.map((r, i) => (
                                        <div key={i} className="recommendation-item">• {r}</div>
                                    ))}
                                </div>
                            )}
                            
                            <div className="retention-graph">
                                <h3>📉 Prediksi Retention Curve</h3>
                                <div className="graph-bars">
                                    {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30].map((sec) => (
                                        <div key={sec} className="graph-bar-container">
                                            <div className="graph-bar" style={{ height: `${prediction.retentionBySecond?.[sec] || 50}%` }}></div>
                                            <div className="graph-label">{sec}s</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <button onClick={() => setVideoPath(null)} className="btn-secondary">Analisis Video Lain</button>
                        </>
                    ) : (
                        <div className="error">Gagal menganalisis video</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FYPredictor;
