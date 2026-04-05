import React, { useState, useEffect } from 'react';

const BurnoutProtection = () => {
    const [activity, setActivity] = useState({
        fatigueScore: 0,
        activitiesCount: 0,
        recommendation: null
    });
    const [autoMode, setAutoMode] = useState(false);
    const [lastActivityMin, setLastActivityMin] = useState(0);

    useEffect(() => {
        loadActivity();
        const interval = setInterval(loadActivity, 60000);
        return () => clearInterval(interval);
    }, []);

    const loadActivity = async () => {
        try {
            const data = await window.electron.burnoutTrack('check');
            setActivity(data);

            // FIX: Pakai electron store, bukan localStorage
            const stored = await window.electron.getStore('last_activity_ts');
            const lastTs = stored ? parseInt(stored) : null;

            if (lastTs) {
                const minutesAgo = Math.floor((Date.now() - lastTs) / 60000);
                setLastActivityMin(minutesAgo);
            }

            // Catat waktu aktivitas sekarang
            await window.electron.setStore('last_activity_ts', String(Date.now()));
        } catch (err) {
            // Abaikan error saat store belum ada
        }
    };

    const getFatigueColor = (score) => {
        if (score >= 80) return '#ff4444';
        if (score >= 50) return '#ffd93d';
        return '#4ecdc4';
    };

    const getFatigueMessage = (score) => {
        if (score >= 80) return '⚠️ Kelelahan Berat! Istirahat sekarang!';
        if (score >= 50) return '🟡 Cukup lelah. Luangkan waktu istirahat.';
        return '✅ Masih segar. Terus berkarya!';
    };

    const enableAutoMode = async () => {
        setAutoMode(true);
        alert('Auto mode aktif! Aplikasi akan berjalan otomatis selama 3 hari.');
    };

    return (
        <div className="burnout-protection">
            <h2>🧘 Burnout Protection</h2>

            <div className="fatigue-card" style={{ borderColor: getFatigueColor(activity.fatigueScore) }}>
                <div className="fatigue-score">{activity.fatigueScore}/100</div>
                <div className="fatigue-message">{getFatigueMessage(activity.fatigueScore)}</div>
                <div className="fatigue-detail">
                    Aktivitas 24 jam terakhir: {activity.activitiesCount} aksi
                </div>
            </div>

            {activity.recommendation && (
                <div className="recommendation-alert">
                    💡 {activity.recommendation}
                </div>
            )}

            <div className="stats-section">
                <h3>📊 Statistik Aktivitas</h3>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{activity.activitiesCount}</div>
                        <div className="stat-label">Aksi Hari Ini</div>
                    </div>
                    <div className="stat-card">
                        {/* FIX: Pakai state lastActivityMin, bukan localStorage langsung */}
                        <div className="stat-value">{lastActivityMin} menit</div>
                        <div className="stat-label">Terakhir Aktif</div>
                    </div>
                </div>
            </div>

            <div className="auto-mode-section">
                <h3>🤖 Auto Mode</h3>
                <p>
                    Jika Anda sakit atau liburan, aktifkan auto mode. Aplikasi akan posting
                    konten dari draft secara otomatis selama 3 hari.
                </p>
                <button onClick={enableAutoMode} className={autoMode ? 'active' : ''}>
                    {autoMode ? '✅ Auto Mode Aktif' : '🎬 Aktifkan Auto Mode'}
                </button>
            </div>

            <div className="tips-section">
                <h4>💡 Tips Menghindari Burnout</h4>
                <ul>
                    <li>😴 Istirahat 5-10 menit setiap 1 jam kerja</li>
                    <li>📅 Buat jadwal konten untuk seminggu, jangan dadakan</li>
                    <li>🤝 Delegasikan tugas ke tim jika memungkinkan</li>
                    <li>🎯 Fokus ke kualitas, bukan kuantitas</li>
                    <li>🧘 Jaga kesehatan mental dengan hobi di luar kerja</li>
                </ul>
            </div>
        </div>
    );
};

export default BurnoutProtection;
