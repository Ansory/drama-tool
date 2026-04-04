import React, { useState, useEffect } from 'react';

const BurnoutProtection = () => {
    const [activity, setActivity] = useState({ fatigueScore: 0, activitiesCount: 0, recommendation: null });
    const [autoMode, setAutoMode] = useState(false);
    const [lastActivity, setLastActivity] = useState(null);

    useEffect(() => {
        loadActivity();
        const interval = setInterval(loadActivity, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const loadActivity = async () => {
        const data = await window.electron.burnoutTrack('check');
        setActivity(data);
        
        // Track last activity time
        const last = localStorage.getItem('last_activity');
        if (last) setLastActivity(new Date(parseInt(last)));
        localStorage.setItem('last_activity', Date.now().toString());
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
                <div className="fatigue-detail">Aktivitas 24 jam terakhir: {activity.activitiesCount} aksi</div>
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
                        <div className="stat-value">{lastActivity ? Math.floor((Date.now() - lastActivity) / 60000) : 0} menit</div>
                        <div className="stat-label">Terakhir Aktif</div>
                    </div>
                </div>
            </div>
            
            <div className="auto-mode-section">
                <h3>🤖 Auto Mode</h3>
                <p>Jika Anda sakit atau liburan, aktifkan auto mode. Aplikasi akan posting konten dari draft secara otomatis selama 3 hari.</p>
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
