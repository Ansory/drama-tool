import React, { useState } from 'react';

const CompetitorAnalysis = () => {
    const [pageUrl, setPageUrl] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);

    const analyzeCompetitor = async () => {
        if (!pageUrl) {
            alert('Masukkan URL Facebook Page kompetitor');
            return;
        }
        setLoading(true);
        const result = await window.electron.competitorAnalyze(pageUrl);
        setAnalysis(result);
        setLoading(false);
    };

    return (
        <div className="competitor-analysis">
            <h2>🔍 Analisis Kompetitor</h2>
            
            <div className="input-section">
                <input 
                    type="text" 
                    placeholder="Masukkan URL Facebook Page kompetitor (contoh: https://facebook.com/competitor)"
                    value={pageUrl}
                    onChange={(e) => setPageUrl(e.target.value)}
                />
                <button onClick={analyzeCompetitor} disabled={loading}>
                    {loading ? 'Menganalisis...' : '🔍 Analisis Kompetitor'}
                </button>
            </div>
            
            {analysis && (
                <div className="analysis-result">
                    <div className="competitor-header">
                        <h3>📊 {analysis.pageName}</h3>
                    </div>
                    
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-value">{analysis.totalVideos}</div>
                            <div className="stat-label">Total Video</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{analysis.avgViews.toLocaleString()}</div>
                            <div className="stat-label">Rata-rata Views</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{analysis.postingFrequency}</div>
                            <div className="stat-label">Frekuensi Posting</div>
                        </div>
                    </div>
                    
                    <div className="best-performing">
                        <h4>🏆 Best Performing Content</h4>
                        <div className="best-card">
                            <div className="best-type">{analysis.bestPerforming.type}</div>
                            <div className="best-views">{analysis.bestPerforming.views.toLocaleString()} views</div>
                        </div>
                    </div>
                    
                    <div className="top-hashtags">
                        <h4>🔖 Top Hashtags</h4>
                        <div className="hashtags-list">
                            {analysis.topHashtags?.map((tag, i) => (
                                <span key={i} className="hashtag">{tag}</span>
                            ))}
                        </div>
                    </div>
                    
                    <div className="content-gaps">
                        <h4>🎯 Content Gap (Peluang Anda)</h4>
                        <ul>
                            {analysis.contentGaps?.map((gap, i) => (
                                <li key={i}>✨ {gap}</li>
                            ))}
                        </ul>
                        <button onClick={() => alert('Rekomendasi konten berdasarkan gap analysis!')}>
                            📝 Buat Konten Berdasarkan Gap
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompetitorAnalysis;
