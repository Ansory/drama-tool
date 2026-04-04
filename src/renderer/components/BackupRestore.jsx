import React, { useState, useEffect } from 'react';

const BackupRestore = () => {
    const [backups, setBackups] = useState([]);
    const [backupInProgress, setBackupInProgress] = useState(false);

    useEffect(() => {
        loadBackups();
    }, []);

    const loadBackups = async () => {
        const backupList = await window.electron.backupList();
        setBackups(backupList);
    };

    const createBackup = async () => {
        setBackupInProgress(true);
        const result = await window.electron.backupCreate();
        if (result.success) {
            alert(`Backup berhasil dibuat!\nLokasi: ${result.backupFolder}\nUkuran: ${formatBytes(result.size)}`);
            loadBackups();
        }
        setBackupInProgress(false);
    };

    const restoreBackup = async (backupPath) => {
        if (confirm('Restore akan mengganti data saat ini. Lanjutkan?')) {
            const result = await window.electron.backupRestore(backupPath);
            alert(result.message);
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString();
    };

    return (
        <div className="backup-restore">
            <h2>💾 Backup & Restore</h2>
            
            <div className="backup-actions">
                <button onClick={createBackup} disabled={backupInProgress} className="btn-primary">
                    {backupInProgress ? 'Membuat Backup...' : '💾 Buat Backup Sekarang'}
                </button>
            </div>
            
            <div className="backup-list">
                <h3>Riwayat Backup</h3>
                {backups.length === 0 ? (
                    <p className="info-text">Belum ada backup. Klik tombol di atas untuk membuat backup pertama.</p>
                ) : (
                    <div className="backup-items">
                        {backups.map((backup) => (
                            <div key={backup.name} className="backup-item">
                                <div className="backup-info">
                                    <div className="backup-name">{backup.name}</div>
                                    <div className="backup-meta">
                                        <span>📅 {formatDate(backup.date)}</span>
                                        <span>💾 {formatBytes(backup.size)}</span>
                                    </div>
                                </div>
                                <div className="backup-actions">
                                    <button onClick={() => restoreBackup(backup.path)} className="btn-small">Restore</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="backup-info">
                <h4>📖 Informasi Backup</h4>
                <ul>
                    <li>Backup mencakup: database, pengaturan, API keys, dan metadata video</li>
                    <li>Video original tidak di-backup untuk menghemat ruang</li>
                    <li>Backup disimpan di folder: Documents/DramaTool/backups/</li>
                    <li>Rekomendasi backup setiap minggu atau sebelum update besar</li>
                </ul>
            </div>
        </div>
    );
};

export default BackupRestore;
