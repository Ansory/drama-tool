import React, { useState, useEffect } from 'react';
import './UpdateNotification.css';

const UpdateNotification = () => {
    const [updateInfo, setUpdateInfo] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const [showNotification, setShowNotification] = useState(true);

    useEffect(() => {
        // Listen untuk event update dari main process
        window.electron.onUpdateAvailable((event, info) => {
            // Cek apakah versi ini sudah di-skip
            const skippedVersions = JSON.parse(localStorage.getItem('skippedVersions') || '[]');
            if (!skippedVersions.includes(info.version)) {
                setUpdateInfo(info);
                setShowNotification(true);
            }
        });

        window.electron.onUpdateDownloadProgress((event, progress) => {
            setDownloadProgress(progress.percent);
        });

        window.electron.onUpdateDownloaded((event, info) => {
            setIsDownloading(false);
            setIsInstalling(true);
        });

        window.electron.onUpdateError((event, error) => {
            console.error('Update error:', error);
            setIsDownloading(false);
            // Tampilkan error toast
        });
    }, []);

    const handleDownload = async () => {
        setIsDownloading(true);
        await window.electron.downloadUpdate();
    };

    const handleInstall = async () => {
        await window.electron.installUpdate();
    };

    const handleSkip = () => {
        const skippedVersions = JSON.parse(localStorage.getItem('skippedVersions') || '[]');
        skippedVersions.push(updateInfo.version);
        localStorage.setItem('skippedVersions', JSON.stringify(skippedVersions));
        setShowNotification(false);
        window.electron.skipUpdate(updateInfo.version);
    };

    const handleRemindLater = () => {
        setShowNotification(false);
        // Sembunyikan selama 24 jam
        setTimeout(() => {
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