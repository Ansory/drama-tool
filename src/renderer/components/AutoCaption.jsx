import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const AutoCaption = () => {
    const [videoPath, setVideoPath] = useState(null);
    const [dramaName, setDramaName] = useState('');
    const [sceneType, setSceneType] = useState('drama');
    const [generated, setGenerated] = useState(null);
    const [loading, setLoading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setVideoPath(file.path);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.mov', '.avi'] }
    });

    const generateTitle = async () => {
        if (!dramaName) {
            alert('Masukkan nama drama terlebih dahulu');
            return;
        }
        setLoading(true);
        const result = await window.electron.autogenTitle(videoPath, dramaName);
        setGenerated(prev => ({ ...prev, titles: result.titles }));
        setLoading(false);
    };

    const generateCaption = async () => {
        if (!dramaName) {
            alert('Masukkan nama drama terlebih dahulu');
            return;
        }
        setLoading(true);
        const result = await window.electron.autogenCaption(videoPath, dramaName, sceneType);
        setGenerated(prev => ({ ...prev, shortCaption: result.shortCaption, longCaption: result.longCaption }));
        setLoading(false);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied!');
    };

    const selectTitle = (title) => {
        setGenerated(prev => ({ ...prev, selectedTitle: title }));
    };

    return (
        <div className="auto-caption">
            <h2>🤖 Auto Generate Judul & Caption</h2>
            
            {!videoPath ? (
                <div {...getRootProps()} className="dropzone">
                    <input {...getInputProps()} />
                    {isDragActive ? <p>Lepaskan file video di sini...</p> : <p>Upload video untuk generate caption</p>}
                </div>
            ) : (
                <div className="generator-container">
                    <div className="video-info">
                        <p>🎬 Video: {videoPath.split('\\').pop()}</p>
                    </div>
                    
                    <div className="input-group">
                        <label>Nama Drama:</label>
                        <input type="text" placeholder="Contoh: The Double" value={dramaName} onChange={(e) => setDramaName(e.target.value)} />
                    </div>
                    
                    <div className="input-group">
                        <label>Jenis Scene:</label>
                        <select value={sceneType} onChange={(e) => setSceneType(e.target.value)}>
                            <option value="sad">Sedih / Menangis</option>
                            <option value="romance">Romantis</option>
                            <option value="action">Action / Perkelahian</option>
                            <option value="plot-twist">Plot Twist</option>
                            <option value="confrontation">Konfrontasi / Tamparan</option>
                            <option value="drama">Drama Umum</option>
                        </select>
                    </div>
                    
                    <div className="button-group">
                        <button onClick={generateTitle} disabled={loading}>🎯 Generate Judul</button>
                        <button onClick={generateCaption} disabled={loading}>💬 Generate Caption</button>
                    </div>
                    
                    {loading && <div className="loading">AI sedang bekerja...</div>}
                    
                    {generated?.titles && (
                        <div className="generated-section">
                            <h3>📝 Rekomendasi Judul</h3>
                            <div className="titles-list">
                                {generated.titles.map((title, i) => (
                                    <div key={i} className={`title-card ${generated.selectedTitle === title ? 'selected' : ''}`} onClick={() => selectTitle(title)}>
                                        <div className="title-text">{title}</div>
                                        <button className="btn-small" onClick={(e) => { e.stopPropagation(); copyToClipboard(title); }}>Copy</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {generated?.shortCaption && (
                        <div className="generated-section">
                            <h3>📝 Caption Pendek (untuk Reels)</h3>
                            <div className="caption-card">
                                <p>{generated.shortCaption}</p>
                                <button onClick={() => copyToClipboard(generated.shortCaption)}>Copy</button>
                            </div>
                            
                            <h3>📝 Caption Panjang (untuk Video)</h3>
                            <div className="caption-card">
                                <p>{generated.longCaption}</p>
                                <button onClick={() => copyToClipboard(generated.longCaption)}>Copy</button>
                            </div>
                        </div>
                    )}
                    
                    <button onClick={() => setVideoPath(null)} className="btn-secondary">Pilih Video Lain</button>
                </div>
            )}
        </div>
    );
};

export default AutoCaption;
