import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    autoUpdate: true,
    updateChannel: 'stable',
    checkInterval: 6
  });

  // FIXED: Simpan versi ke state (bukan dipanggil langsung di JSX)
  const [appVersion, setAppVersion] = useState('...');

  // FIXED: Toast state untuk feedback ke user
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
    } catch (err) {
      showToast('Gagal memuat pengaturan', 'error');
    }
  };

  // FIXED: getVersion dipanggil async dan disimpan ke state
  const loadVersion = async () => {
    try {
      const version = await window.electron.getVersion();
      setAppVersion(version);
    } catch {
      setAppVersion('N/A');
    }
  };

  // FIXED: Tampilkan toast sukses setelah save
  const saveSettings = async () => {
    try {
      await window.electron.updateConfig(settings);
      showToast('Pengaturan berhasil disimpan!', 'success');
    } catch (err) {
      showToast('Gagal menyimpan pengaturan', 'error');
    }
  };

  const handleCheckUpdate = async () => {
    try {
      showToast('Sedang memeriksa update...', 'info');
      const result = await window.electron.checkForUpdates();
      if (result && result.updateAvailable) {
        showToast(`Update v${result.version} tersedia!`, 'success');
      } else {
        showToast('Aplikasi sudah versi terbaru ✓', 'info');
      }
    } catch (err) {
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

      {/* FIXED: Toast notification */}
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
          {/* FIXED: Pakai state appVersion, bukan panggil fungsi langsung */}
          <p>Versi saat ini: <strong>v{appVersion}</strong></p>
          <p>Terakhir update: <strong>25 Maret 2026</strong></p>
          {/* FIXED: URL changelog diperbaiki sesuai repo asli */}
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
