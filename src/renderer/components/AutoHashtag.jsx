import React, { useState } from 'react';

const AutoHashtag = () => {
    const [dramaName, setDramaName] = useState('');
    const [sceneType, setSceneType] = useState('drama');
    const [hashtags, setHashtags] = useState([]);
    const [loading, setLoading] = useState(false);

    const generateHashtags = async () => {
        if (!dramaName) {
            alert('Masukkan nama drama terlebih dahulu');
            return;
        }
        setLoading(true);
        const result = await window.electron.autogenHashtag(dramaName, sceneType);
        setHashtags(result.hashtags);
        setLoading(false);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Hashtag copied!');
    };

    const copyAll = () => {
        copyToClipboard(hashtags.join(' '));
    };

    return (
        <div className="auto-hashtag">
            <h2>🔖 Auto Generate Hashtag</h2>
            
            <div className="input-group">
                <label>Nama Drama:</label>
                <input type="text" placeholder="Contoh: The Double" value={dramaName} onChange={(e) => setDramaName(e.target.value)} />
            </div>
            
            <div className="input-group">
                <label>Jenis Scene:</label>
                <select value={sceneType} onChange={(e) => setSceneType(e.target.value)}>
                    <option value="sad">Sedih / Menangis</option>
                    <option value="romance">Romantis</option>
                    <option value="action">Action / Perkelahian</option>
                    <option value="plot-twist">Plot Twist</option>
                    <option value="drama">Drama Umum</option>
                </select>
            </div>
            
            <button onClick={generateHashtags} disabled={loading}>
                {loading ? 'Generating...' : '🚀 Generate Hashtag'}
            </button>
            
            {hashtags.length > 0 && (
                <div className="hashtag-result">
                    <h3>📋 Rekomendasi Hashtag</h3>
                    <div className="hashtags-cloud">
                        {hashtags.map((tag, i) => (
                            <span key={i} className="hashtag-chip" onClick={() => copyToClipboard(tag)}>
                                {tag} 📋
                            </span>
                        ))}
                    </div>
                    <button onClick={copyAll}>Copy All</button>
                    
                    <div className="hashtag-tips">
                        <h4>💡 Tips Penggunaan Hashtag:</h4>
                        <ul>
                            <li>Gunakan 10-15 hashtag per postingan</li>
                            <li>Campurkan hashtag populer dan niche</li>
                            <li>Letakkan hashtag di caption atau komentar pertama</li>
                            <li>Jangan gunakan hashtag yang sama persis setiap posting</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AutoHashtag;
