import React, { useState, useEffect } from 'react';

const ProfitTracker = () => {
    const [currentProfit, setCurrentProfit] = useState(null);
    const [profitHistory, setProfitHistory] = useState([]);
    const [period, setPeriod] = useState('weekly');
    const [inputData, setInputData] = useState({
        views: 0,
        clicks: 0,
        conversions: 0
    });

    useEffect(() => {
        loadProfitHistory();
    }, [period]);

    const loadProfitHistory = async () => {
        const history = await window.electron.profitHistory({ period });
        setProfitHistory(history);
    };

    const calculateProfit = async () => {
        const result = await window.electron.profitCalculate(inputData);
        setCurrentProfit(result);
        
        // Save to history
        await window.electron.profitSave({ period, data: result });
        loadProfitHistory();
    };

    const formatRupiah = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const formatUSD = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);
    };

    return (
        <div className="profit-tracker">
            <h2>💰 Profit Tracker</h2>
            
            <div className="input-section">
                <h3>📊 Kalkulator Pendapatan</h3>
                <div className="form-group">
                    <label>Total Views (Facebook Reels):</label>
                    <input type="number" value={inputData.views} onChange={(e) => setInputData({...inputData, views: parseInt(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                    <label>Total Klik Link Afiliasi:</label>
                    <input type="number" value={inputData.clicks} onChange={(e) => setInputData({...inputData, clicks: parseInt(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                    <label>Total Konversi (Pembelian):</label>
                    <input type="number" value={inputData.conversions} onChange={(e) => setInputData({...inputData, conversions: parseInt(e.target.value) || 0})} />
                </div>
                <button onClick={calculateProfit}>Hitung Pendapatan</button>
            </div>
            
            {currentProfit && (
                <div className="result-section">
                    <h3>📈 Estimasi Pendapatan</h3>
                    <div className="profit-cards">
                        <div className="profit-card">
                            <div className="profit-label">Dari Views (CPM $2.5)</div>
                            <div className="profit-value-usd">{formatUSD(currentProfit.revenueViews)}</div>
                            <div className="profit-value-idr">{formatRupiah(currentProfit.estimatedRupiah * (currentProfit.revenueViews / currentProfit.totalRevenue))}</div>
                        </div>
                        <div className="profit-card">
                            <div className="profit-label">Dari Afiliasi</div>
                            <div className="profit-value-usd">{formatUSD(currentProfit.revenueAffiliate)}</div>
                            <div className="profit-value-idr">{formatRupiah(currentProfit.estimatedRupiah * (currentProfit.revenueAffiliate / currentProfit.totalRevenue))}</div>
                        </div>
                        <div className="profit-card total">
                            <div className="profit-label">TOTAL</div>
                            <div className="profit-value-usd">{formatUSD(currentProfit.totalRevenue)}</div>
                            <div className="profit-value-idr">{formatRupiah(currentProfit.estimatedRupiah)}</div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="history-section">
                <h3>📋 Riwayat Pendapatan</h3>
                <div className="period-selector">
                    <button className={period === 'daily' ? 'active' : ''} onClick={() => setPeriod('daily')}>Harian</button>
                    <button className={period === 'weekly' ? 'active' : ''} onClick={() => setPeriod('weekly')}>Mingguan</button>
                    <button className={period === 'monthly' ? 'active' : ''} onClick={() => setPeriod('monthly')}>Bulanan</button>
                </div>
                
                <div className="history-chart">
                    {profitHistory.length === 0 ? (
                        <p className="info-text">Belum ada data. Masukkan data pendapatan di atas.</p>
                    ) : (
                        <div className="history-list">
                            {profitHistory.slice(-7).reverse().map((item, i) => (
                                <div key={i} className="history-item">
                                    <div className="history-date">{new Date(item.timestamp).toLocaleDateString()}</div>
                                    <div className="history-amount">{formatRupiah(item.estimatedRupiah)}</div>
                                    <div className="history-detail">{item.revenueViews.toFixed(2)} views | {item.revenueAffiliate.toFixed(2)} afiliasi</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="tips-section">
                <h4>💡 Tips Meningkatkan Pendapatan</h4>
                <ul>
                    <li>📹 Posting konsisten 1-2 video per hari untuk meningkatkan views</li>
                    <li>🛍️ Gunakan link afiliasi di pinned comment setiap video</li>
                    <li>🎯 Fokus ke produk fashion dan skincare (konversi tinggi untuk audiens drama China)</li>
                    <li>📊 Pantau performa setiap video, pelajari mana yang paling banyak klik afiliasi</li>
                    <li>🚀 Targetkan 10k views per video untuk mulai mendapatkan pendapatan signifikan</li>
                </ul>
            </div>
        </div>
    );
};

export default ProfitTracker;
