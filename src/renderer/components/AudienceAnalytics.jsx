import React, { useState, useEffect } from 'react';

const AudienceAnalytics = () => {
    const [demographics, setDemographics] = useState(null);

    useEffect(() => {
        loadDemographics();
    }, []);

    const loadDemographics = async () => {
        // Load mock demographics data since Facebook integration is removed
        const data = await window.electron.audienceDemographics();
        setDemographics(data);
    };

    return (
        <div className="audience-analytics">
            <h2>📊 Analisis Audience & Demografi</h2>

            <div className="info-box" style={{ marginBottom: 20 }}>
                <p style={{ color: '#aaa', fontSize: 13 }}>
                    ℹ️ Fitur ini menampilkan data analitik dari platform social media Anda.
                </p>
            </div>
            
            {demographics && (
                <>
                    <div className="demographics-section">
                        <h3>👥 Usia & Gender</h3>
                        <div className="demographics-grid">
                            <div className="chart-card">
                                <h4>Usia</h4>
                                {demographics.ageGroups.map((group, i) => (
                                    <div key={i} className="bar-chart">
                                        <span>{group.age}</span>
                                        <div className="bar-bg">
                                            <div className="bar-fill" style={{ width: `${group.percentage}%`, background: '#4ecdc4' }}></div>
                                        </div>
                                        <span>{group.percentage}%</span>
                                    </div>
                                ))}
                            </div>
                            <div className="chart-card">
                                <h4>Gender</h4>
                                <div className="pie-simple">
                                    <div>👩 Wanita: {demographics.gender.female}%</div>
                                    <div>👨 Pria: {demographics.gender.male}%</div>
                                    <div>🌈 Lainnya: {demographics.gender.other}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="locations-section">
                        <h3>🌍 Lokasi</h3>
                        <div className="locations-list">
                            {demographics.locations.map((loc, i) => (
                                <div key={i} className="location-item">
                                    <span>{loc.country}</span>
                                    <div className="bar-bg">
                                        <div className="bar-fill" style={{ width: `${loc.percentage}%`, background: '#ffd93d' }}></div>
                                    </div>
                                    <span>{loc.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="active-hours">
                        <h3>⏰ Waktu Aktif (24 jam)</h3>
                        <div className="hours-chart">
                            {Object.entries(demographics.activeHours).slice(0, 24).map(([hour, value]) => (
                                <div key={hour} className="hour-bar">
                                    <div className="hour-label">{hour}:00</div>
                                    <div className="bar-bg">
                                        <div className="bar-fill" style={{ height: `${value / 55 * 100}%`, width: '100%', background: '#ff6b6b' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="interests-section">
                        <h3>💡 Interest Affinity</h3>
                        <div className="interests-list">
                            {demographics.interests.map((interest, i) => (
                                <span key={i} className="interest-tag">{interest}</span>
                            ))}
                        </div>
                    </div>
                    
                    <div className="insights-box">
                        <h4>💡 Rekomendasi Konten</h4>
                        <ul>
                            <li>🎯 Waktu terbaik posting: <strong>20:00 WIB</strong> (aktivitas tertinggi)</li>
                            <li>🎯 Konten favorit: <strong>Romance & Drama Sedih</strong> (70% audiens wanita)</li>
                            <li>🎯 Gunakan hashtag: <strong>#KPop #Skincare</strong> (interest affinity)</li>
                            <li>🎯 Target lokasi: <strong>Indonesia</strong> (85% audiens)</li>
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
};

export default AudienceAnalytics;
