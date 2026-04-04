import React, { useState, useEffect } from 'react';

const ContentPlanner = () => {
    const [trends, setTrends] = useState([]);
    const [calendar, setCalendar] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [newContent, setNewContent] = useState({
        title: '',
        drama: '',
        sceneType: '',
        scheduledTime: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTrends();
        loadCalendar();
    }, []);

    const loadTrends = async () => {
        setLoading(true);
        const result = await window.electron.contentScrapeTrends('drama china');
        setTrends(result.trends || []);
        setLoading(false);
    };

    const loadCalendar = async () => {
        const now = new Date();
        const data = await window.electron.contentGetCalendar(now.getMonth() + 1, now.getFullYear());
        setCalendar(data);
    };

    const saveToCalendar = async () => {
        if (!selectedDate) return;
        
        const updatedCalendar = [...calendar, {
            id: Date.now(),
            date: selectedDate,
            ...newContent,
            createdAt: new Date().toISOString()
        }];
        
        const now = new Date();
        await window.electron.contentSaveCalendar(now.getMonth() + 1, now.getFullYear(), updatedCalendar);
        setCalendar(updatedCalendar);
        setNewContent({ title: '', drama: '', sceneType: '', scheduledTime: '' });
        setSelectedDate(null);
    };

    const getSceneTypeScore = (type) => {
        const scores = {
            'action': 88,
            'romance': 85,
            'sad': 92,
            'plot-twist': 95,
            'comedy': 75,
            'confrontation': 90
        };
        return scores[type] || 70;
    };

    return (
        <div className="content-planner">
            <h2>📅 Planning Konten</h2>
            
            <div className="trending-section">
                <h3>🔥 Tren Drama China Hari Ini</h3>
                {loading && <div className="loading">Memuat tren...</div>}
                <div className="trends-list">
                    {trends.map((trend, i) => (
                        <div key={i} className="trend-item">
                            <span className="trend-rank">#{i+1}</span>
                            <span className="trend-name">{trend.name}</span>
                            <span className="trend-volume">{trend.volume} posting</span>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="scene-database">
                <h3>📚 Database Scene Populer</h3>
                <div className="scene-grid">
                    {['plot-twist', 'sad', 'action', 'romance', 'confrontation'].map((type) => (
                        <div key={type} className="scene-card">
                            <div className="scene-icon">
                                {type === 'plot-twist' && '🎭'}
                                {type === 'sad' && '😭'}
                                {type === 'action' && '⚔️'}
                                {type === 'romance' && '💕'}
                                {type === 'confrontation' && '💥'}
                            </div>
                            <div className="scene-name">{type.toUpperCase()}</div>
                            <div className="scene-score">Viral Score: {getSceneTypeScore(type)}/100</div>
                            <button className="btn-small">Pilih</button>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="calendar-section">
                <h3>📆 Kalender Konten</h3>
                <div className="calendar-controls">
                    <input type="date" onChange={(e) => setSelectedDate(e.target.value)} />
                    <button onClick={() => setSelectedDate(null)}>Clear</button>
                </div>
                
                {selectedDate && (
                    <div className="add-content-form">
                        <h4>Tambah Konten untuk {selectedDate}</h4>
                        <input type="text" placeholder="Judul Video" value={newContent.title} onChange={(e) => setNewContent({...newContent, title: e.target.value})} />
                        <input type="text" placeholder="Nama Drama" value={newContent.drama} onChange={(e) => setNewContent({...newContent, drama: e.target.value})} />
                        <select value={newContent.sceneType} onChange={(e) => setNewContent({...newContent, sceneType: e.target.value})}>
                            <option value="">Pilih Jenis Scene</option>
                            <option value="plot-twist">Plot Twist</option>
                            <option value="sad">Adegan Sedih</option>
                            <option value="action">Adegan Action</option>
                            <option value="romance">Adegan Romantis</option>
                            <option value="confrontation">Konfrontasi</option>
                        </select>
                        <input type="time" value={newContent.scheduledTime} onChange={(e) => setNewContent({...newContent, scheduledTime: e.target.value})} />
                        <button onClick={saveToCalendar}>Tambah ke Kalender</button>
                    </div>
                )}
                
                <div className="calendar-list">
                    {calendar.map((item) => (
                        <div key={item.id} className="calendar-item">
                            <div className="item-date">{item.date}</div>
                            <div className="item-title">{item.title}</div>
                            <div className="item-drama">{item.drama}</div>
                            <div className="item-time">{item.scheduledTime}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ContentPlanner;
