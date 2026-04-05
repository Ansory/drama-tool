import React, { useState, useEffect, useRef } from 'react';

const UpdateNotification = () => {
  const [updateInfo, setUpdateInfo]           = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed]     = useState(0);
  const [isDownloading, setIsDownloading]     = useState(false);
  const [isDownloaded, setIsDownloaded]       = useState(false);
  const [isInstalling, setIsInstalling]       = useState(false);
  const [downloadError, setDownloadError]     = useState(null);
  const [showNotification, setShowNotification] = useState(true);
  const remindLaterTimerRef = useRef(null);

  useEffect(() => {
    const el = window.electron;
    if (!el) return;

    // Update tersedia
    if (typeof el.onUpdateAvailable === 'function') {
      el.onUpdateAvailable((event, info) => {
        const getSkipped = typeof el.getSkippedVersions === 'function'
          ? el.getSkippedVersions()
          : Promise.resolve([]);
        getSkipped.then((skippedVersions) => {
          const skipped = skippedVersions || [];
          if (!skipped.includes(info.version)) {
            setUpdateInfo(info);
            setShowNotification(true);
          }
        });
      });
    }

    // Progress download
    if (typeof el.onUpdateDownloadProgress === 'function') {
      el.onUpdateDownloadProgress((event, progress) => {
        setDownloadProgress(Math.round(progress.percent || 0));
        setDownloadSpeed(progress.speed || 0);
      });
    }

    // Download selesai — tampilkan tombol Install
    if (typeof el.onUpdateDownloaded === 'function') {
      el.onUpdateDownloaded(() => {
        setIsDownloading(false);
        setIsDownloaded(true);
        setDownloadProgress(100);
      });
    }

    // FIX: Error handler — reset isDownloading dan tampilkan pesan error
    if (typeof el.onUpdateError === 'function') {
      el.onUpdateError((event, error) => {
        setIsDownloading(false);
        setDownloadError(error?.message || 'Download gagal. Coba lagi.');
        // Auto-clear error setelah 8 detik
        setTimeout(() => setDownloadError(null), 8000);
      });
    }

    return () => {
      if (remindLaterTimerRef.current) {
        clearTimeout(remindLaterTimerRef.current);
      }
    };
  }, []);

  // FIX: Tambah error handling — jika download gagal, reset state dan tampilkan error
  const handleDownload = async () => {
    setDownloadError(null);
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const result = await window.electron.downloadUpdate();
      // Jika IPC return { success: false }, tangkap di sini
      if (result && result.success === false) {
        setIsDownloading(false);
        setDownloadError(result.error || 'Download gagal. Coba lagi.');
      }
      // Jika sukses, event onUpdateDownloaded akan fire dan set isDownloaded = true
    } catch (err) {
      setIsDownloading(false);
      setDownloadError(err.message || 'Download gagal. Coba lagi.');
    }
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await window.electron.installUpdate();
    } catch (err) {
      setIsInstalling(false);
      setDownloadError('Install gagal: ' + err.message);
    }
  };

  const handleSkip = async () => {
    if (!updateInfo) return;
    if (typeof window.electron?.skipUpdate === 'function') {
      await window.electron.skipUpdate(updateInfo.version);
    }
    setShowNotification(false);
  };

  const handleRemindLater = () => {
    setShowNotification(false);
    remindLaterTimerRef.current = setTimeout(() => {
      setShowNotification(true);
    }, 24 * 60 * 60 * 1000);
  };

  const formatSpeed = (bytesPerSec) => {
    if (!bytesPerSec) return '';
    if (bytesPerSec > 1024 * 1024) return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`;
    return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  };

  if (!showNotification || !updateInfo) return null;

  // State: Installing
  if (isInstalling) {
    return (
      <div className="update-notification installing">
        <div className="update-icon">🔄</div>
        <div className="update-content">
          <h3>Menginstall Update...</h3>
          <p>Aplikasi akan restart sebentar lagi.</p>
        </div>
      </div>
    );
  }

  // State: Downloading
  if (isDownloading) {
    return (
      <div className="update-notification downloading">
        <div className="update-icon">📥</div>
        <div className="update-content">
          <h3>Mendownload v{updateInfo.version}...</h3>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${downloadProgress}%` }} />
          </div>
          <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
            {downloadProgress}% selesai
            {downloadSpeed > 0 && ` · ${formatSpeed(downloadSpeed)}`}
          </p>
        </div>
      </div>
    );
  }

  // State: Downloaded — siap install
  if (isDownloaded) {
    return (
      <div className="update-notification downloaded">
        <div className="update-icon">✅</div>
        <div className="update-content">
          <h3>Update Siap Diinstall!</h3>
          <p>v{updateInfo.version} sudah terdownload.</p>
          {downloadError && (
            <p style={{ color: '#ff4444', fontSize: 12, marginTop: 4 }}>{downloadError}</p>
          )}
        </div>
        <div className="update-actions">
          <button onClick={handleInstall} className="btn-primary">
            🔄 Install & Restart
          </button>
          <button onClick={handleRemindLater} className="btn-secondary">
            Nanti
          </button>
        </div>
      </div>
    );
  }

  // State: Update tersedia — belum download
  return (
    <div className="update-notification available">
      <div className="update-icon">✨</div>
      <div className="update-content">
        <h3>Update Tersedia!</h3>
        <p>Versi {updateInfo.version} telah rilis.</p>
        {/* FIX: Tampilkan error jika download gagal */}
        {downloadError && (
          <p style={{ color: '#ff6b6b', fontSize: 12, marginTop: 4 }}>
            ⚠️ {downloadError}
          </p>
        )}
        {updateInfo.releaseNotes && (
          <details>
            <summary style={{ fontSize: 12, color: '#4ecdc4', cursor: 'pointer', marginTop: 4 }}>
              ▶ Lihat perubahan
            </summary>
            <div className="release-notes">{updateInfo.releaseNotes}</div>
          </details>
        )}
      </div>
      <div className="update-actions">
        <button onClick={handleDownload} className="btn-primary">
          Download
        </button>
        <button onClick={handleRemindLater} className="btn-secondary">
          Nanti
        </button>
        <button onClick={handleSkip} className="btn-text">
          Skip versi ini
        </button>
      </div>
    </div>
  );
};

export default UpdateNotification;
