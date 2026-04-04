import React, { useState } from 'react';

const InfringementResponse = () => {
    const [strikeEmail, setStrikeEmail] = useState('');
    const [parsedStrike, setParsedStrike] = useState(null);
    const [appealLetter, setAppealLetter] = useState('');
    const [strikeInfo, setStrikeInfo] = useState({
        name: '',
        email: '',
        videoId: '',
        reason: ''
    });

    const parseStrike = async () => {
        const result = await window.electron.strikeParse(strikeEmail);
        setParsedStrike(result);
        setStrikeInfo({
            ...strikeInfo,
            videoId: result.videoId,
            reason: result.reason
        });
    };

    const generateAppeal = async () => {
        const result = await window.electron.strikeGenerateAppeal(strikeInfo);
        setAppealLetter(result.appealLetter);
    };

    const copyAppeal = () => {
        navigator.clipboard.writeText(appealLetter);
        alert('Surat banding telah disalin!');
    };

    return (
        <div className="infringement-response">
            <h2>⚖️ Infringement Response System</h2>
            
            <div className="section">
                <h3>📧 Parse Copyright Strike Email</h3>
                <textarea 
                    placeholder="Tempelkan isi email copyright strike dari Meta di sini..."
                    value={strikeEmail}
                    onChange={(e) => setStrikeEmail(e.target.value)}
                    rows={6}
                />
                <button onClick={parseStrike}>Parse Email</button>
                
                {parsedStrike && (
                    <div className="parsed-result">
                        <h4>Hasil Parse:</h4>
                        <p><strong>Video ID:</strong> {parsedStrike.videoId}</p>
                        <p><strong>Claimant:</strong> {parsedStrike.claimant}</p>
                        <p><strong>Reason:</strong> {parsedStrike.reason}</p>
                        <p><strong>Strike Date:</strong> {parsedStrike.strikeDate}</p>
                    </div>
                )}
            </div>
            
            <div className="section">
                <h3>📝 Generate Counter-Notification</h3>
                <div className="form-group">
                    <label>Nama Lengkap:</label>
                    <input type="text" value={strikeInfo.name} onChange={(e) => setStrikeInfo({...strikeInfo, name: e.target.value})} />
                </div>
                <div className="form-group">
                    <label>Email:</label>
                    <input type="email" value={strikeInfo.email} onChange={(e) => setStrikeInfo({...strikeInfo, email: e.target.value})} />
                </div>
                <div className="form-group">
                    <label>Alasan Banding:</label>
                    <textarea 
                        value={strikeInfo.reason} 
                        onChange={(e) => setStrikeInfo({...strikeInfo, reason: e.target.value})}
                        rows={3}
                        placeholder="Contoh: Konten ini memenuhi kriteria fair use untuk tujuan review dan analisis..."
                    />
                </div>
                <button onClick={generateAppeal}>Generate Surat Banding</button>
                
                {appealLetter && (
                    <div className="appeal-letter">
                        <h4>Surat Banding:</h4>
                        <pre>{appealLetter}</pre>
                        <button onClick={copyAppeal}>📋 Copy Surat</button>
                    </div>
                )}
            </div>
            
            <div className="legal-templates">
                <h3>📚 Legal Templates</h3>
                <div className="template-list">
                    <div className="template-item" onClick={() => setStrikeInfo({...strikeInfo, reason: 'Konten ini menggunakan prinsip fair use untuk tujuan review, kritik, dan edukasi. Saya telah menambahkan voiceover asli dan melakukan editing signifikan.'})}>
                        📄 Fair Use Defense
                    </div>
                    <div className="template-item" onClick={() => setStrikeInfo({...strikeInfo, reason: 'Saya memiliki lisensi resmi untuk menggunakan konten ini. Bukti lisensi terlampir.'})}>
                        📄 Licensed Content
                    </div>
                    <div className="template-item" onClick={() => setStrikeInfo({...strikeInfo, reason: 'Saya adalah pemilik asli konten ini. Konten tersebut diupload tanpa izin dari saya.'})}>
                        📄 Original Content Claim
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfringementResponse;
