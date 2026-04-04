import React, { useState, useEffect } from 'react';

const NotificationSystem = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [newSubscription, setNewSubscription] = useState({ platform: 'whatsapp', identifier: '' });
    const [testMessage, setTestMessage] = useState({ title: '', message: '' });

    useEffect(() => {
        loadSubscriptions();
        requestNotificationPermission();
    }, []);

    const loadSubscriptions = async () => {
        const subs = await window.electron.notifyGetSubscriptions();
        setSubscriptions(subs);
    };

    const requestNotificationPermission = () => {
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    };

    const subscribe = async () => {
        if (!newSubscription.identifier) {
            alert('Masukkan identifier (nomor WA / Telegram ID)');
            return;
        }
        await window.electron.notifySubscribe(newSubscription);
        setSubscriptions([...subscriptions, { ...newSubscription, subscribedAt: Date.now() }]);
        setNewSubscription({ platform: 'whatsapp', identifier: '' });
    };

    const sendTestNotification = async () => {
        if (!testMessage.title || !testMessage.message) {
            alert('Isi pesan test terlebih dahulu');
            return;
        }
        
        // Send to all platforms
        for (const sub of subscriptions) {
            await window.electron.notifySend({
                type: 'test',
                title: testMessage.title,
                message: testMessage.message,
                platform: sub.platform
            });
        }
        alert('Test notification sent!');
    };

    const platforms = [
        { id: 'whatsapp', name: 'WhatsApp', icon: '💬', placeholder: '628123456789' },
        { id: 'telegram', name: 'Telegram', icon: '✈️', placeholder: '@username' },
        { id: 'discord', name: 'Discord', icon: '🎮', placeholder: 'Webhook URL' },
        { id: 'desktop', name: 'Desktop', icon: '💻', placeholder: '(otomatis)' }
    ];

    return (
        <div className="notification-system">
            <h2>🔔 Notifikasi Real-time</h2>
            
            <div className="subscribe-section">
                <h3>📱 Subscribe Notifikasi</h3>
                <div className="form-row">
                    <select value={newSubscription.platform} onChange={(e) => setNewSubscription({...newSubscription, platform: e.target.value})}>
                        {platforms.map(p => (
                            <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                        ))}
                    </select>
                    <input 
                        type="text" 
                        placeholder={platforms.find(p => p.id === newSubscription.platform)?.placeholder}
                        value={newSubscription.identifier}
                        onChange={(e) => setNewSubscription({...newSubscription, identifier: e.target.value})}
                    />
                    <button onClick={subscribe}>Subscribe</button>
                </div>
            </div>
            
            <div className="subscriptions-list">
                <h3>📋 Subscriptions Aktif</h3>
                {subscriptions.length === 0 ? (
                    <p className="info-text">Belum ada subscription. Tambahkan di atas.</p>
                ) : (
                    subscriptions.map((sub, i) => (
                        <div key={i} className="subscription-item">
                            <span className="sub-icon">{platforms.find(p => p.id === sub.platform)?.icon}</span>
                            <span className="sub-platform">{sub.platform}</span>
                            <span className="sub-identifier">{sub.identifier}</span>
                            <span className="sub-date">{new Date(sub.subscribedAt).toLocaleDateString()}</span>
                        </div>
                    ))
                )}
            </div>
            
            <div className="test-section">
                <h3>🧪 Kirim Test Notification</h3>
                <div className="form-group">
                    <input type="text" placeholder="Judul Notifikasi" value={testMessage.title} onChange={(e) => setTestMessage({...testMessage, title: e.target.value})} />
                </div>
                <div className="form-group">
                    <textarea placeholder="Isi Pesan" value={testMessage.message} onChange={(e) => setTestMessage({...testMessage, message: e.target.value})} rows={3} />
                </div>
                <button onClick={sendTestNotification}>Kirim Test</button>
            </div>
            
            <div className="event-types">
                <h3>📌 Jenis Notifikasi yang Dikirim</h3>
                <ul>
                    <li>🔥 <strong>Viral Alert</strong> - Konten sedang viral</li>
                    <li>✅ <strong>Upload Success</strong> - Video berhasil diupload</li>
                    <li>⚠️ <strong>Upload Failed</strong> - Video gagal diupload</li>
                    <li>🚨 <strong>Copyright Strike</strong> - Ada strike dari Meta</li>
                    <li>📊 <strong>Weekly Report</strong> - Laporan performa mingguan</li>
                </ul>
            </div>
        </div>
    );
};

export default NotificationSystem;
