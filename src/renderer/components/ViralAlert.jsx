import React, { useState, useEffect } from 'react';

const ViralAlert = () => {
    const [viralContent, setViralContent] = useState([]);
    const [webhookUrl, setWebhookUrl] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastChecked, setLastChecked] = useState(null);

    useEffect(() => {
        if (autoRefresh) {
            checkViralContent();
            const interval = setInterval(checkViralContent, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const checkViralContent = async () => {
        const result = await window.electron.viralCheck();
        setViralContent(result);
        setLastChecked(new Date());
        
        // Show notification for new viral content
        if (result.length > 0 && notifications.length !== result.length) {
            setNotifications(result);
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🔥 Viral Content Alert!', {
                    body: `${result.length} konten viral terdeteksi`,
                    icon: '/icon.png'
                });
            }
        }
    };

    const subscribeWebhook = async () => {
        if (webhookUrl) {
            await window.electron.viralSubscribe(webhookUrl);
            alert('Webhook subscribed!');
        }
    };

    const requestNotificationPermission = () => {
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    };

    const getTimeRemaining = (expiryTime) => {
        const remaining = expiryTime - Date.now();
        if (remaining <= 0) return 'Expired';
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        return `${hours}h ${minutes}m`;
    };

    const getTemplateResponse = (trend) => {
        return `🔥 ${trend.name} sedang viral! Yuk ikutan trend ini. #DramaChina #FYP`;
    };

    return (
        <div className="viral-alert">
            <h2>🚨 Viral Content Alert</h2>
            
            <div className="alert-controls">
                <div className="refresh-control">
                    <label>
                        <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
                        Auto-refresh (setiap 5 menit)
                    </label>
                    <button onClick={checkViralContent}>Refresh Now</button>
                    {lastChecked && <span className="last-checked">Last checked: {lastChecked.toLocaleTimeString()}</span>}
                </div>
                
                <div className="notification-control">
                    <button onClick={requestNotificationPermission}>🔔 Enable Desktop Notifications</button>
                </div>
                
                <div className="webhook-control">
                    <input type="text" placeholder="Webhook URL (Discord/Telegram)" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
                    <button onClick={subscribeWebhook}>Subscribe Webhook</button>
                </div>
            </div>
            
            <div className="viral-content-list">
                <h3>🔥 Konten Viral Saat Ini</h3>
                {viralContent.length === 0 ? (
                    <div className="no-content">Belum ada konten viral terdeteksi</div>
                ) : (
                    viralContent.map((item, i) => (
                        <div key={i} className="viral-card">
                            <div className="viral-rank">#{i+1}</div>
                            <div className="viral-info">
                                <div className="viral-name">{item.name}</div>
                                <div className="viral-meta">
                                    <span className="viral-volume">📊 {item.volume} posting</span>
                                    <span className="viral-expiry">⏰ {getTimeRemaining(item.expiryTime)}</span>
                                </div>
                                <div className="viral-score">🔥 Viral Score: {item.score}/100</div>
                            </div>
                            <div className="viral-actions">
                                <details>
                                    <summary>Response Template</summary>
                                    <textarea readOnly value={getTemplateResponse(item)} rows={3} />
                                    <button onClick={() => navigator.clipboard.writeText(getTemplateResponse(item))}>Copy</button>
                                </details>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="trending-timer">
                <h3>⏱️ Trend Expiry Timer</h3>
                <div className="timer-grid">
                    {['Plot Twist Scene', 'Sad Scene with OST', 'Confrontation Scene', 'Romantic Kiss'].map((trend, i) => (
                        <div key={i} className="timer-card">
                            <div className="trend-name">{trend}</div>
                            <div className="countdown">Expires in: 6h 23m</div>
                            <div className="first-mover-score">First Mover Score: 85/100</div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="recent-notifications">
                <h3>📬 Recent Alerts</h3>
                {notifications.slice(-5).reverse().map((notif, i) => (
                    <div key={i} className="notification-item">
                        🔥 {notif.name} - {new Date().toLocaleTimeString()}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ViralAlert;
