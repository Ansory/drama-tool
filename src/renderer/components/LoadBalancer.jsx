import React, { useState, useEffect } from 'react';

const LoadBalancer = () => {
    const [apiKeys, setApiKeys] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, limited: 0, totalUsage: 0 });
    const [newKey, setNewKey] = useState({ key: '', name: '' });
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        loadKeys();
        loadStats();
    }, []);

    const loadKeys = async () => {
        const keys = await window.electron.loadbalancerGetKeys();
        setApiKeys(keys);
    };

    const loadStats = async () => {
        const statsData = await window.electron.loadbalancerStats();
        setStats(statsData);
    };

    const addKey = async () => {
        if (!newKey.key) {
            alert('Masukkan API Key');
            return;
        }
        await window.electron.loadbalancerAddKey(newKey);
        setNewKey({ key: '', name: '' });
        loadKeys();
        loadStats();
    };

    const removeKey = async (id) => {
        if (confirm('Hapus API key ini?')) {
            await window.electron.loadbalancerRemoveKey(id);
            loadKeys();
            loadStats();
        }
    };

    const testKey = async (key) => {
        setTesting(true);
        const result = await window.electron.loadbalancerTestKey(key);
        alert(result.valid ? '✅ API Key valid!' : '❌ API Key tidak valid');
        setTesting(false);
    };

    return (
        <div className="load-balancer">
            <h2>🔑 Multi-Key Load Balancer (Gemini API)</h2>
            
            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total Keys</div>
                </div>
                <div className="stat-card success">
                    <div className="stat-value">{stats.active}</div>
                    <div className="stat-label">Active</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-value">{stats.limited}</div>
                    <div className="stat-label">Limited</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalUsage.toLocaleString()}</div>
                    <div className="stat-label">Total Requests</div>
                </div>
            </div>
            
            <div className="add-key-section">
                <h3>➕ Tambah API Key Baru</h3>
                <div className="form-row">
                    <input type="text" placeholder="Nama (contoh: Key 1, Personal, dll)" value={newKey.name} onChange={(e) => setNewKey({...newKey, name: e.target.value})} />
                    <input type="text" placeholder="API Key Gemini" value={newKey.key} onChange={(e) => setNewKey({...newKey, key: e.target.value})} />
                    <button onClick={addKey}>Tambah</button>
                </div>
                <p className="hint">📝 Dapatkan API key dari: <a href="#" onClick={() => window.electron.openExternal('https://aistudio.google.com/apikey')}>Google AI Studio</a></p>
            </div>
            
            <div className="keys-list">
                <h3>📋 Daftar API Keys</h3>
                {apiKeys.length === 0 ? (
                    <p className="info-text">Belum ada API key. Tambahkan di atas.</p>
                ) : (
                    <div className="keys-table">
                        {apiKeys.map((key) => (
                            <div key={key.id} className={`key-item ${key.status}`}>
                                <div className="key-info">
                                    <div className="key-name">{key.name}</div>
                                    <div className="key-value">{key.key.substring(0, 20)}...</div>
                                    <div className="key-stats">Usage: {key.usage || 0} | Limit: {key.limitCount || 0}x</div>
                                </div>
                                <div className="key-status-badge">{key.status}</div>
                                <div className="key-actions">
                                    <button onClick={() => testKey(key.key)} className="btn-small">Test</button>
                                    <button onClick={() => removeKey(key.id)} className="btn-small btn-danger">Hapus</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="info-box">
                <h4>⚙️ Cara Kerja Load Balancer</h4>
                <ul>
                    <li>🔄 Round-robin: Giliran bergantian antar key</li>
                    <li>🚫 Auto failover: Jika satu key kena rate limit (429), otomatis pindah ke key berikutnya</li>
                    <li>📊 Tracking usage per key (TPM dan TPD)</li>
                    <li>🔁 Auto-reactivate: Key yang kena limit akan dicoba ulang setelah 1 jam</li>
                    <li>💡 Rekomendasi: Tambahkan 5-10 key untuk menghindari rate limit</li>
                </ul>
            </div>
        </div>
    );
};

export default LoadBalancer;
