import React, { useState } from 'react';

const RoyaltyFree = () => {
    const [keyword, setKeyword] = useState('');
    const [contentType, setContentType] = useState('trailer');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const searchContent = async () => {
        if (!keyword) {
            alert('Masukkan keyword drama');
            return;
        }
        setLoading(true);
        const data = await window.electron.royaltySearch({ keyword, type: contentType });
        setResults(data);
        setLoading(false);
    };

    const contentTypes = [
        { id: 'trailer', name: '🎬 Trailer Resmi', icon: '🎬' },
        { id: 'bts', name: '🎥 Behind The Scene', icon: '🎥' },
        { id: 'interview', name: '🎙️ Interview Aktor', icon: '🎙️' },
        { id: 'ost', name: '🎵 Official OST', icon: '🎵' }
    ];

    return (
        <div className="royalty-free">
            <h2>📚 Sumber Konten Royalty-Free</h2>
            
            <div className="search-section">
                <input 
                    type="text" 
                    placeholder="Nama Drama (contoh: The Double)"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />
                <div className="type-buttons">
                    {contentTypes.map((type) => (
                        <button 
                            key={type.id} 
                            className={`type-btn ${contentType === type.id ? 'active' : ''}`}
                            onClick={() => setContentType(type.id)}
                        >
                            {type.name}
                        </button>
                    ))}
                </div>
                <button onClick={searchContent} disabled={loading}>
                    {loading ? 'Mencari...' : '🔍 Cari Konten'}
                </button>
            </div>
            
            {results.length > 0 && (
                <div className="results-section">
                    <h3>📋 Hasil Pencarian</h3>
                    {results.map((item, i) => (
                        <div key={i} className="content-item">
                            <div className="content-info">
                                <div className="content-title">{item.title}</div>
                                <div className="content-meta">{item.source} | Durasi: {item.duration}</div>
                            </div>
                            <div className="content-actions">
                                <a href={item.url} target="_blank" rel="noopener noreferrer">Preview</a>
                                <button onClick={() => alert('Download fitur akan segera hadir')}>Download</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="info-box">
                <h4>📖 Tentang Fair Use</h4>
                <p>Konten dari sumber resmi (trailer, BTS, interview) memiliki risiko copyright lebih rendah jika digunakan untuk review dan analisis.</p>
                <ul>
                    <li>✅ Potongan trailer max 30 detik</li>
                    <li>✅ Tambahkan voiceover asli</li>
                    <li>✅ Berikan credit ke sumber asli</li>
                    <li>✅ Jangan gunakan full episode</li>
                </ul>
            </div>
        </div>
    );
};

export default RoyaltyFree;
