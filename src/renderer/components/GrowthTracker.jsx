import React, { useState, useEffect } from 'react';

const GrowthTracker = () => {
    const [growthData, setGrowthData] = useState(null);
    const [pageId, setPageId] = useState('');
    const [pages, setPages] = useState([]);

    useEffect(() => {
        loadPages();
    }, []);

    const loadPages = async () => {
        const fbPages = await window.electron.getPages();
        setPages(fbPages);
        if (fbPages.length > 0) {
            setPageId(fbPages[0].id);
            trackGrowth(fbPages[0].id);
        }
    };

    const trackGrowth = async (id) => {
        const data = await window.electron.growthTrack(id);
        setGrowthData(data);
    };

    return (
        <div className="growth-tracker">
            <h2>📈 Page Growth Tracker</h2>
            
            <div className="page-selector">
                <select value={pageId} onChange={(e) => {
                    setPageId(e.target.value);
                    trackGrowth(e.target.value);
                }}>
                    {pages.map(page => (
                        <option key={page.id} value={page.id}>{page.name}</option>
                    ))}
                </select>
            </div>
            
            {growthData && (
                <>
                    <div className="today-stats">
                        <h3>📊 Statistik Hari Ini</h3>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-value">{growthData.todayData.followers.toLocaleString()}</div>
                                <div className="stat-label">Total Followers</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">+{growthData.todayData.newFollowers}</div>
                                <div className="stat-label">Followers Baru</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{growthData.todayData.unfollows}</div>
                                <div className="stat-label">Unfollows</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{growthData.growthRate}%</div>
                                <div className="stat-label">Growth Rate</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="engagement-stats">
                        <h3>📊 Engagement Rate</h3>
                        <div className="engagement-bar">
                            <div className="engagement-fill" style={{ width: `${growthData.todayData.engagement * 10}%`, background: '#4ecdc4' }}></div>
                            <span className="engagement-value">{growthData.todayData.engagement}%</span>
                        </div>
                        <p className="hint">Rata-rata industri: 3.5%</p>
                    </div>
                    
                    <div className="history-section">
                        <h3>📈 Riwayat 7 Hari Terakhir</h3>
                        <div className="history-chart">
                            {growthData.history?.map((day, i) => (
                                <div key={i} className="history-bar">
                                    <div className="bar-label">{new Date(day.date).toLocaleDateString('id-ID', { weekday: 'short' })}</div>
                                    <div className="bar-bg">
                                        <div className="bar-fill" style={{ height: `${(day.newFollowers / 100) * 100}%`, background: '#ff6b6b' }}></div>
                                    </div>
                                    <div className="bar-value">{day.newFollowers}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="page-score">
                        <h3>🎯 Page Score</h3>
                        <div className="score-circle">
                            <div className="score-value">{Math.min(100, Math.floor(growthData.todayData.engagement * 20))}</div>
                            <div className="score-label">/100</div>
                        </div>
                        <div className="score-status">
                            {growthData.todayData.engagement >= 4 ? 'Sehat! ✅' : 'Perlu improvement 🟡'}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default GrowthTracker;
