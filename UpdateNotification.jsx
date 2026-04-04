import React, { useState, useEffect, useRef } from 'react';

const UpdateNotification = () => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  // FIXED: Simpan referensi timer agar bisa di-clear saat unmount
  const remindLaterTimerRef = useRef(null);

  useEffect(() => {
    // Daftarkan semua listener dari Electron main process
    window.electron.onUpdateAvailable((event, info) => {
      // FIXED: Pakai electron.getSkippedVersions() bukan localStorage langsung
      // Ini lebih aman di Electron karena localStorage bisa hilang
      window.electron.getSkippedVersions().then((skippedVersions) => {
        const skipped = skippedVersions || [];
        if (!skipped.includes(info.version)) {
          setUpdateInfo(info);
          setShowNotification(true);
        }
      });
    });

    window.electron.onUpdateDownloadProgress((event, progress) => {
      setDownloadProgress(progress.percent);
    });

    window.electron.onUpdateDownloaded(() => {
      setIsDownloading(false);
      setIsInstalling(true);
    });

    window.electron.onUpdateError((event, error) => {
      console.error('Update error:', error);
      setIsDownloading(false);
    });

    // FIXED: Cleanup saat komponen unmount — clear timer agar tidak memory leak
    return () => {
      if (remindLaterTimerRef.current) {
        clearTimeout(remindLaterTimerRef.current);
      }
    };
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    await window.electron.downloadUpdate();
  };

  const handleInstall = async () => {
    await window.electron.installUpdate();
  };

  const handleSkip = async () => {
    if (!updateInfo) return;
    // FIXED: Simpan versi yang di-skip via electron (bukan localStorage)
    await window.electron.skipUpdate(updateInfo.version);
    setShowNotification(false);
  };

  const handleRemindLater = () => {
    setShowNotification(false);

    // FIXED: Simpan referensi timer dan clear saat komponen unmount
    remindLaterTimerRef.current = setTimeout(() => {
      setShowNotification(true);
    }, 24 * 60 * 60 * 1000);
  };

  if (!showNotification || !updateInfo) {
    return null;
  }

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

  if (isDownloading) {
    return (
      <div className="update-notification downloading">
        <div className="update-icon">📥</div>
        <div className="update-content">
          <h3>Mendownload Update</h3>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
          <p>{Math.round(downloadProgress)}% selesai</p>
        </div>
      </div>
    );
  }

  return (
    <div className="update-notification available">
      <div className="update-icon">✨</div>
      <div className="update-content">
        <h3>Update Tersedia!</h3>
        <p>Versi {updateInfo.version} telah rilis.</p>
        {updateInfo.releaseNotes && (
          <details>
            <summary>Lihat perubahan</summary>
            <div className="release-notes">
              {updateInfo.releaseNotes}
            </div>
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
