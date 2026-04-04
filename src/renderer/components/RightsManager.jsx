import React, { useState, useEffect } from 'react';

const RightsManager = () => {
    const [registeredVideos, setRegisteredVideos] = useState([]);
    const [rules, setRules] = useState([]);
    const [newRule, setNewRule] = useState({
        action: 'BLOCK',
        conditions: { overlapDuration: 10 }
    });
    const [whitelist, setWhitelist] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        // Load dari store
        const store = window.electron.getStore('rights-manager');
        setRegisteredVideos(store.registered || []);
        setRules(store.rules || []);
    };

    const registerVideo = async () => {
        const result = await window.electron.rightsRegister({
            videoId: 'video_' + Date.now(),
            pageId: 'YOUR_PAGE_ID',
            ruleId: newRule.id
        });
        if (result.success) {
            alert('Video berhasil didaftarkan ke Rights Manager!');
            loadData();
        }
    };

    const createRule = async () => {
        const result = await window.electron.rightsCreateRule({
            pageId: 'YOUR_PAGE_ID',
            action: newRule.action,
            conditions: newRule.conditions
        });
        if (result.success) {
            alert(`Rule ${result.ruleId} berhasil dibuat!`);
            loadData();
        }
    };

    const addToWhitelist = async () => {
        const pageId = prompt('Masukkan Page ID atau username yang diizinkan:');
        if (pageId) {
            const newWhitelist = [...whitelist, pageId];
            await window.electron.rightsWhitelist({ pageId: 'YOUR_PAGE_ID', whitelistedIds: newWhitelist });
            setWhitelist(newWhitelist);
            alert(`${pageId} ditambahkan ke whitelist`);
        }
    };

    return (
        <div className="rights-manager">
            <h2>⚖️ Facebook Rights Manager</h2>
            
            <div className="rights-section">
                <h3>📋 Video Terdaftar</h3>
                {registeredVideos.length === 0 ? (
                    <p className="info-text">Belum ada video yang didaftarkan</p>
                ) : (
                    <div className="video-list">
                        {registeredVideos.map((video, i) => (
                            <div key={i} className="video-item">
                                <span>Video ID: {video.videoId}</span>
                                <span className={`status ${video.status}`}>{video.status}</span>
                            </div>
                        ))}
                    </div>
                )}
                <button onClick={registerVideo}>+ Daftarkan Video Baru</button>
            </div>
            
            <div className="rights-section">
                <h3>⚙️ Copyright Rules</h3>
                <div className="rule-form">
                    <select value={newRule.action} onChange={(e) => setNewRule({...newRule, action: e.target.value})}>
                        <option value="TRACK">Track Only (Pantau)</option>
                        <option value="MONETIZE">Monetize (Klaim pendapatan)</option>
                        <option value="BLOCK">Block (Blokir total)</option>
                        <option value="MANUAL_REVIEW">Manual Review</option>
                    </select>
                    <label>
                        Overlap Duration (detik):
                        <input type="number" value={newRule.conditions.overlapDuration} onChange={(e) => setNewRule({...newRule, conditions: { overlapDuration: parseInt(e.target.value) }})} />
                    </label>
                    <button onClick={createRule}>Buat Rule</button>
                </div>
                
                {rules.length > 0 && (
                    <div className="rules-list">
                        {rules.map((rule, i) => (
                            <div key={i} className="rule-item">
                                <span>Rule ID: {rule.id}</span>
                                <span>Action: {rule.action}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="rights-section">
                <h3>🤝 Whitelist Management</h3>
                <div className="whitelist-list">
                    {whitelist.map((id, i) => (
                        <span key={i} className="whitelist-tag">{id}</span>
                    ))}
                </div>
                <button onClick={addToWhitelist}>+ Tambah ke Whitelist</button>
            </div>
            
            <div className="info-box">
                <h4>📖 Tentang Rights Manager</h4>
                <p>Rights Manager adalah fitur Meta untuk melindungi konten Anda dari pencurian. Setelah video terdaftar, Meta akan otomatis mendeteksi jika ada yang mengupload ulang video Anda.</p>
                <ul>
                    <li><strong>TRACK:</strong> Hanya pantau, tidak ada tindakan</li>
                    <li><strong>MONETIZE:</strong> Klaim pendapatan iklan dari video pencuri</li>
                    <li><strong>BLOCK:</strong> Video pencuri tidak bisa ditonton</li>
                    <li><strong>MANUAL_REVIEW:</strong> Anda review dulu sebelum tindakan</li>
                </ul>
            </div>
        </div>
    );
};

export default RightsManager;
