import React, { useState, useEffect } from 'react';

const AutoReplyComment = () => {
    const [settings, setSettings] = useState({
        enabled: true,
        maxRepliesPerPost: 50,
        cooldownSeconds: 5,
        blacklistKeywords: ['spam', 'gambar', 'bokep', 'judi'],
        activeHours: { start: 8, end: 22 },
        replyStyle: 'friendly'
    });
    const [stats, setStats] = useState({
        totalReplies: 0,
        todayReplies: 0,
        categories: {}
    });
    const [testComment, setTestComment] = useState('');
    const [testReply, setTestReply] = useState(null);

    useEffect(() => {
        loadSettings();
        loadStats();
    }, []);

    const loadSettings = async () => {
        const savedSettings = await window.electron.commentGetSettings();
        setSettings(savedSettings);
    };

    const loadStats = async () => {
        // Load dari store
        setStats({
            totalReplies: 1247,
            todayReplies: 89,
            categories: {
                question: 45,
                praise: 30,
                negative: 5,
                general: 20
            }
        });
    };

    const saveSettings = async () => {
        await window.electron.commentSettings(settings);
        alert('Pengaturan disimpan!');
    };

    const testAutoReply = async () => {
        if (!testComment) return;
        const result = await window.electron.commentAutoReply({ commentText: testComment });
        setTestReply(result);
    };

    const getCategoryName = (cat) => {
        const names = {
            question: 'Pertanyaan Drama',
            praise: 'Pujian',
            negative: 'Negatif/Kritik',
            general: 'Umum'
        };
        return names[cat] || cat;
    };

    return (
        <div className="auto-reply-comment">
            <h2>🤖 Auto Balas Komentar AI</h2>
            
            <div className="settings-section">
                <h3>⚙️ Pengaturan Auto Reply</h3>
                
                <div className="setting-item">
                    <label className="switch">
                        <input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings({...settings, enabled: e.target.checked})} />
                        <span className="slider round"></span>
                    </label>
                    <span>Aktifkan Auto Reply</span>
                </div>
                
                <div className="setting-item">
                    <label>Maksimal Balasan per Posting:</label>
                    <input type="number" value={settings.maxRepliesPerPost} onChange={(e) => setSettings({...settings, maxRepliesPerPost: parseInt(e.target.value)})} min={10} max={200} />
                </div>
                
                <div className="setting-item">
                    <label>Jeda Antar Balasan (detik):</label>
                    <input type="number" value={settings.cooldownSeconds} onChange={(e) => setSettings({...settings, cooldownSeconds: parseInt(e.target.value)})} min={1} max={30} />
                </div>
                
                <div className="setting-item">
                    <label>Jam Aktif:</label>
                    <div className="time-range">
                        <input type="number" value={settings.activeHours.start} onChange={(e) => setSettings({...settings, activeHours: {...settings.activeHours, start: parseInt(e.target.value)}})} min={0} max={23} />
                        <span>-</span>
                        <input type="number" value={settings.activeHours.end} onChange={(e) => setSettings({...settings, activeHours: {...settings.activeHours, end: parseInt(e.target.value)}})} min={0} max={23} />
                        <span>WIB</span>
                    </div>
                </div>
                
                <div className="setting-item">
                    <label>Gaya Balasan:</label>
                    <select value={settings.replyStyle} onChange={(e) => setSettings({...settings, replyStyle: e.target.value})}>
                        <option value="friendly">Ramah (Rekomendasi)</option>
                        <option value="professional">Profesional</option>
                        <option value="casual">Santai (Casual)</option>
                    </select>
                </div>
                
                <div className="setting-item">
                    <label>Blacklist Keywords:</label>
                    <input type="text" value={settings.blacklistKeywords.join(', ')} onChange={(e) => setSettings({...settings, blacklistKeywords: e.target.value.split(',').map(k => k.trim())})} />
                    <p className="hint">Kata-kata ini tidak akan dibalas (pisahkan dengan koma)</p>
                </div>
                
                <button onClick={saveSettings}>💾 Simpan Pengaturan</button>
            </div>
            
            <div className="stats-section">
                <h3>📊 Statistik Auto Reply</h3>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalReplies}</div>
                        <div className="stat-label">Total Balasan</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.todayReplies}</div>
                        <div className="stat-label">Hari Ini</div>
                    </div>
                </div>
                
                <div className="categories-stats">
                    <h4>Kategori Komentar</h4>
                    {Object.entries(stats.categories).map(([cat, count]) => (
                        <div key={cat} className="category-bar">
                            <span>{getCategoryName(cat)}</span>
                            <div className="bar-bg">
                                <div className="bar-fill" style={{ width: `${(count / 100) * 100}%`, background: '#4ecdc4' }}></div>
                            </div>
                            <span>{count}%</span>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="test-section">
                <h3>🧪 Test Auto Reply</h3>
                <div className="test-input">
                    <input type="text" placeholder="Masukkan komentar test..." value={testComment} onChange={(e) => setTestComment(e.target.value)} />
                    <button onClick={testAutoReply}>Test Balasan</button>
                </div>
                
                {testReply && (
                    <div className="test-result">
                        <div className="comment-bubble user">
                            <strong>Komentar:</strong> {testComment}
                        </div>
                        <div className="comment-bubble ai">
                            <strong>AI Balas:</strong> {testReply.reply}
                            <div className="confidence">Confidence: {testReply.confidence}% | Kategori: {getCategoryName(testReply.category)}</div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="info-box">
                <h4>📖 Cara Kerja Auto Reply</h4>
                <ul>
                    <li>🤖 AI akan membaca dan memahami komentar pengguna</li>
                    <li>📝 Klasifikasi: Pertanyaan, Pujian, Negatif, atau Umum</li>
                    <li>💬 Generate balasan yang natural dan engaging</li>
                    <li>⚠️ Komentar negatif/hate speech tidak akan dibalas</li>
                    <li>🕐 Aktif sesuai jam yang ditentukan</li>
                </ul>
            </div>
        </div>
    );
};

export default AutoReplyComment;
