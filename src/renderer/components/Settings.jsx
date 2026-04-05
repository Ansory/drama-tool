import React, { useState, useEffect } from 'react';

const Settings = () => {
    const [settings, setSettings] = useState({
        autoUpdate: true,
        updateChannel: 'stable',
        checkInterval: 6
    });
    const [appVersion, setAppVersion] = useState('...');
    const [buildDate, setBuildDate] = useState('...');
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadSettings();
        loadVersion();
    }, []);

    const loadSettings = async () => {
        try {
            const config = await window.electron.getConfig();
            setSettings({
                autoUpdate: config.autoUpdate !== false,
                updateChannel: config.updateChannel || 'stable',
                checkInterval: config.checkInterval || 6
            });
        } catch {
            showToast('Gagal memuat pengaturan', 'error');
        }
    };

    const loadVersion = async () => {
        try {
            // FIX: getVersion() return { current, latest, updateAvailable }
            // current diambil dari app.getVersion() di main process (sesuai package.json)
            const versionInfo = await window.electron.getVersion();
            if (versionInfo && typeof versionInfo === 'object') {
                setAppVersion(versionInfo.current || 'N/A');
            } else if (typeof versionInfo === 'string') {
                setAppVersion(versionInfo);
            } else {
                setAppVersion('N/A');
            }

            // FIX: Build date dinamis dari electron store, bukan hardcoded
            const stored = await window.electron.getStore('build_date');
            if (stored) {
                setBuildDate(new Date(stored).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                }));
            } else {
                const now = new Date();
                await window.electron.setStore('build_date', now.toISOString());
                setBuildDate(now.toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                }));
            }
        } catch {
            setAppVersion('N/A');
            setBuildDate('N/A');
        }
    };

    const saveSettings = async () => {
        try {
            await window.electron.updateConfig(settings);
            showToast('Pengaturan berhasil disimpan!', 'success');
        } catch {
            showToast('Gagal menyimpan pengaturan', 'error');
        }
    };

    const handleCheckUpdate = async () => {
        try {
            showToast('Sedang memeriksa update...', 'info');
            await window.electron.checkForUpdates();
            // Hasil update muncul via UpdateNotification banner otomatis
            // Jika tidak ada update, tunggu response lalu tampilkan pesan
            setTimeout(async () => {
                const versionInfo = await window.electron.getVersion();
                if (!versionInfo?.updateAvailable) {
                    showToast('Aplikasi sudah versi terbaru ✓', 'info');
                }
            }, 5000);
        } catch {
            showToast('Gagal memeriksa update', 'error');
        }
    };

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <div className="settings-page">
            <h2>Pengaturan</h2>

            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    {toast.message}
                </div>
            )}

            <div className="settings-section">
                <h3>Auto Update</h3>

                <div className="setting-item">
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={settings.autoUpdate}
                            onChange={(e) => setSettings({ ...settings, autoUpdate: e.target.checked })}
                        />
                        <span className="slider round"></span>
                    </label>
                    <span className="setting-label">Cek update otomatis saat startup</span>
                </div>

                <div className="setting-item">
                    <label>Channel Update:</label>
                    <select
                        value={settings.updateChannel}
                        onChange={(e) => setSettings({ ...settings, updateChannel: e.target.value })}
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
                        onChange={(e) => setSettings({ ...settings, checkInterval: parseInt(e.target.value) })}
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
                    <p>Versi saat ini: <strong>v{appVersion}</strong></p>
                    <p>Terakhir update: <strong>{buildDate}</strong></p>
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            window.electron.openExternal('https://github.com/Ansory/drama-tool/releases');
                        }}
                    >
                        Lihat changelog lengkap
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Settings;
