import React, { useState, useEffect } from 'react';

const SocialListening = () => {
    const [sentiment, setSentiment] = useState(null);
    const [trackedKeywords, setTrackedKeywords] = useState([]);
    const [newKeyword, setNewKeyword] = useState('');
    const [weeklyReport, setWeeklyReport] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTrackedKeywords();
        analyzeSentiment();
        loadWeeklyReport();
    }, []);

    const loadTrackedKeywords = async () => {
        const keywords = await window.electron.socialGetKeywords();
        setTrackedKeywords(keywords);
    };

    const analyzeSentiment = async () => {
        setLoading(true);
        // Sample comments - dalam implementasi nyata ambil dari Facebook API
        const sampleComments = [
            "keren banget dramanya!",
            "kok pendek amat videonya",
            "recommended buat yang suka drakor",
            "kurang seri scene actionnya"
        ];
        const result = await window.electron.socialAnalyzeSentiment(sampleComments);
        setSentiment(result);
        setLoading(false);
    };

    const loadWeeklyReport = async () => {
        const report = await window.electron.socialWeeklyReport('page_id');
        setWeeklyReport(report);
    };

    const addKeyword = async () => {
        if (newKeyword) {
            const updated = [...trackedKeywords, newKeyword];
            setTrackedKeywords(updated);
            await window.electron.socialTrackKeywords(updated);
            setNewKeyword('');
        }
    };

    const removeKeyword = async (keyword) => {
        const updated = trackedKeywords.filter(k => k !== keyword);
        setTrackedKeywords(updated);
        await window.electron.socialTrackKeywords(updated);
    };

    return (
        <div className="social-listening">
            <h2>👂 Social Listening & Sentiment Analysis</h2>
            
            <div className="sentiment-section">
                <h3>📊 Sentiment Analysis (7 Hari Terakhir)</h3>
                {loading ? (
                    <div className="loading">Menganalisis sentimen...</div>
                ) : sentiment ? (
                    <div className="sentiment-charts">
                        <div className="sentiment-pie">
                            <div className="pie-chart">
                                <div className="pie-segment positive" style={{ width: `${sentiment.positive}%` }}></div>
                                <div className="pie-segment neutral" style={{ width: `${sentiment.neutral}%` }}></div>
                                <div className="pie-segment negative" style={{ width: `${sentiment.negative}%` }}></div>
                            </div>
                            <div className="pie-labels">
                                <span className="positive">😊 Positif {sentiment.positive}%</span>
                                <span className="neutral">😐 Netral {sentiment.neutral}%</span>
                                <span className="negative">😞 Negatif {sentiment.negative}%</span>
                            </div>
                        </div>
                        
                        <div className="keywords-cloud">
                            <h4>Top Keywords</h4>
                            <div className="cloud">
                                {sentiment.topKeywords?.map((kw, i) => (
                                    <span key={i} className="keyword" style={{ fontSize: `${12 + (10 - i) * 2}px` }}>{kw}</span>
                                ))}
                            </div>
                        </div>
                        
                        {sentiment.crisisDetected && (
                            <div className="crisis-alert">
                                🚨 KRISIS TERDETEKSI! Lonjakan komentar negatif. Segera respons!
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="error">Gagal menganalisis sentimen</div>
                )}
            </div>
            
            <div className="keywords-section">
                <h3>🔍 Keyword Tracking</h3>
                <div className="add-keyword">
                    <input type="text" placeholder="Tambah keyword (contoh: plot twist)" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} />
                    <button onClick={addKeyword}>+ Tambah</button>
                </div>
                <div className="keywords-list">
                    {trackedKeywords.map((kw, i) => (
                        <span key={i} className="keyword-tag">
                            {kw}
                            <button onClick={() => removeKeyword(kw)} className="remove">×</button>
                        </span>
                    ))}
                </div>
            </div>
            
            <div className="report-section">
                <h3>📋 Weekly Report</h3>
                {weeklyReport && (
                    <div className="report-card">
                        <p><strong>Periode:</strong> {weeklyReport.period}</p>
                        <p><strong>Total Komentar:</strong> {weeklyReport.totalComments}</p>
                        <p><strong>Rata-rata Sentimen:</strong> {weeklyReport.averageSentiment}/100</p>
                        
                        <div className="report-keywords">
                            <div className="positive-keywords">
                                <strong>👍 Kata Positif Terbanyak:</strong>
                                {weeklyReport.topPositiveKeywords?.map((kw, i) => (
                                    <span key={i} className="positive-tag">{kw}</span>
                                ))}
                            </div>
                            <div className="negative-keywords">
                                <strong>👎 Kata Negatif Terbanyak:</strong>
                                {weeklyReport.topNegativeKeywords?.map((kw, i) => (
                                    <span key={i} className="negative-tag">{kw}</span>
                                ))}
                            </div>
                        </div>
                        
                        <div className="recommendations">
                            <strong>💡 Rekomendasi:</strong>
                            <ul>
                                {weeklyReport.recommendations?.map((rec, i) => (
                                    <li key={i}>{rec}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SocialListening;
