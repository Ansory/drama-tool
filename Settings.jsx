import React, { useState, useEffect } from 'react';

const Settings = () => {
    const [settings, setSettings] = useState({
        autoUpdate: true,
        updateChannel: 'stable',
        checkInterval: 6
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const config = await window.electron.getConfig();
        setSettings({
            autoUpdate: config.autoUpdate !== false,
            updateChannel: config.updateChannel || 'stable',
            checkInterval: config.checkInterval || 6
        });
    };

    const saveSettings = async () => {
        await window.electron.updateConfig(settings);
        // Tampilkan toast sukses
    };

    const handleCheckUpdate = async () => {
        const result = await window.electron.checkForUpdates();
        if (result && result.updateAvailable) {
            // Tampilkan notifikasi update tersedia
        } else {
            // Tampilkan toast "Tidak ada update"
        }
    };

    return (
        <div className="settings-page">
            <h2>Pengaturan</h2>
            
            <div className="settings-section">
                <h3>Auto Update</h3>
                
                <div className="setting-item">
                    <label className="switch">
                        <input 
                            type="checkbox" 
                            checked={settings.autoUpdate}
                            onChange={(e) => setSettings({...settings, autoUpdate: e.target.checked})}
                        />
                        <span className="slider round"></span>
                    </label>
                    <span className="setting-label">Cek update otomatis saat startup</span>
                </div>

                <div className="setting-item">
                    <label>Channel Update:</label>
                    <select 
                        value={settings.updateChannel}
                        onChange={(e) => setSettings({...settings, updateChannel: e.target.value})}
                    >
                        <option value="stable">Stable (Rekomendasi)</option>
                        <option value="beta">Beta (Untuk testing)</option>
                        <option value="dev">Development (Bleeding edge)</option>
                    </select>
                </div>

                <div className="setting-item">
                    <label>Cek update setiap:</label>
                    <select 
                        value={settings.checkInterval}
                        onChange={(e) => setSettings({...settings, checkInterval: parseInt(e.target.value)})}
                    >
                        <option value={1}>1 jam</option>
                        <option value={6}>6 jam</option>
                        <option value={12}>12 jam</option>
                        <option value={24}>24 jam</option>
                    </select>
                </div>

                <div className="setting-actions">
                    <button onClick={handleCheckUpdate} className="btn-primary">
                        Cek Update Sekarang
                    </button>
                    <button onClick={saveSettings} className="btn-secondary">
                        Simpan Pengaturan
                    </button>
                </div>
            </div>

            <div className="settings-section">
                <h3>Informasi Versi</h3>
                <div className="version-info">
                    <p>Versi saat ini: <strong>v{window.electron.getVersion()}</strong></p>
                    <p>Terakhir update: <strong>25 Maret 2026</strong></p>
                    <a href="#" onClick={() => window.electron.openExternal('https://github.com/dramatool/releases')}>
                        Lihat changelog lengkap
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Settings;