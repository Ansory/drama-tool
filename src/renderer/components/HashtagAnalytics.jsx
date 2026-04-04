import React, { useState } from 'react';

const HashtagAnalytics = () => {
    const [hashtag, setHashtag] = useState('');
    const [stats, setStats] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    const analyzeHashtag = async () => {
        if (!hashtag) return;
        setLoading(true);
        const result = await window.electron.hashtagAnalyze(hashtag);
        setStats(result);
        setLoading(false);
    };

    const getSuggestions = async () => {
        setLoading(true);
        const result = await window.electron.hashtagSuggest('drama china');
        setSuggestions(result);
        setLoading(false);
    };

    const trackHashtag = async () => {
        if (!hashtag) return;
        await window.electron.hashtagTrack(hashtag, { likes: 100, shares: 50 });
        alert(`Hashtag ${hashtag} telah direkam`);
        analyzeHashtag();
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Hashtag copied!');
    };

    return (
        <div className="hashtag-analytics">
            <h2>🔖 Hashtag Analytics</h2>
            
            <div className="hashtag-input">
                <input type="text" placeholder="Masukkan hashtag (contoh: #DramaChina)" value={hashtag} onChange={(e) => setHashtag(e.target.value)} />
                <button onClick={analyzeHashtag}>Analisis</button>
                <button onClick={trackHashtag}>Track</button>
                <button onClick={getSuggestions}>Suggestions</button>
            </div>
            
            {loading && <div className="loading">Loading...</div>}
            
            {stats && (
                <div className="stats-card">
                    <h3>📊 Statistik: {hashtag}</h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-value">{stats.usage || 0}</div>
                            <div className="stat-label">Total Penggunaan</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{stats.avgLikes?.toFixed(0) || 0}</div>
                            <div className="stat-label">Rata-rata Likes</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{stats.lastUsed ? new Date(stats.lastUsed).toLocaleDateString() : '-'}</div>
                            <div className="stat-label">Terakhir Digunakan</div>
                        </div>
                    </div>
                </div>
            )}
            
            {suggestions.length > 0 && (
                <div className="suggestions-card">
                    <h3>💡 Rekomendasi Hashtag</h3>
                    <div className="suggestions-list">
                        {suggestions.map((tag, i) => (
                            <div key={i} className="suggestion-tag" onClick={() => copyToClipboard(tag)}>
                                {tag} <span className="copy-icon">📋</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => copyToClipboard(suggestions.join(' '))}>Copy All</button>
                </div>
            )}
            
            <div className="hashtag-presets">
                <h3>📁 Preset Hashtag per Drama</h3>
                <div className="preset-grid">
                    <div className="preset-card">
                        <h4>The Double</h4>
                        <p className="preset-hashtags">#TheDouble #TheDoubleEpisode5 #XueFangfei #DramaChina</p>
                        <button onClick={() => copyToClipboard('#TheDouble #TheDoubleEpisode5 #XueFangfei #DramaChina')}>Copy</button>
                    </div>
                    <div className="preset-card">
                        <h4>Love Between Fairy and Devil</h4>
                        <p className="preset-hashtags">#LoveBetweenFairyAndDevil #CangJue #DylanWang #EstherYu</p>
                        <button onClick={() => copyToClipboard('#LoveBetweenFairyAndDevil #CangJue #DylanWang #EstherYu')}>Copy</button>
                    </div>
                    <div className="preset-card">
                        <h4>Hidden Love</h4>
                        <p className="preset-hashtags">#HiddenLove #ZhaoLusi #ChenZheyuan #RomanceDrama</p>
                        <button onClick={() => copyToClipboard('#HiddenLove #ZhaoLusi #ChenZheyuan #RomanceDrama')}>Copy</button>
                    </div>
                </div>
            </div>
            
            <div className="shadowban-checker">
                <h3>🚫 Shadowban Detector</h3>
                <p className="info-text">Uji apakah akun Anda kena shadowban</p>
                <button onClick={() => alert('Upload test video tanpa hashtag, bandingkan reach-nya')}>Test Now</button>
            </div>
        </div>
    );
};

export default HashtagAnalytics;
