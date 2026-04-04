import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const ContentRepurposing = () => {
    const [videoPath, setVideoPath] = useState(null);
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState([]);

    const platforms = [
        { id: 'facebook-reel', name: 'Facebook Reels', icon: '📘', dimension: '1080x1920' },
        { id: 'youtube-shorts', name: 'YouTube Shorts', icon: '▶️', dimension: '1080x1920' },
        { id: 'tiktok', name: 'TikTok', icon: '🎵', dimension: '1080x1920' },
        { id: 'instagram-reel', name: 'Instagram Reels', icon: '📷', dimension: '1080x1920' },
        { id: 'twitter', name: 'Twitter/X', icon: '🐦', dimension: '1280x720' },
        { id: 'linkedin', name: 'LinkedIn', icon: '🔗', dimension: '1080x1080' }
    ];

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setVideoPath(file.path);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv'] }
    });

    const togglePlatform = (platformId) => {
        if (selectedPlatforms.includes(platformId)) {
            setSelectedPlatforms(selectedPlatforms.filter(p => p !== platformId));
        } else {
            setSelectedPlatforms([...selectedPlatforms, platformId]);
        }
    };

    const processRepurpose = async () => {
        if (!videoPath || selectedPlatforms.length === 0) {
            alert('Pilih video dan minimal 1 platform');
            return;
        }
        
        setProcessing(true);
        const newResults = [];
        
        for (const platformId of selectedPlatforms) {
            const platform = platforms.find(p => p.id === platformId);
            const outputPath = videoPath.replace(/\.[^/.]+$/, `_${platformId}.mp4`);
            await window.electron.repurposeResize({
                inputPath: videoPath,
                outputPath,
                platform: platformId
            });
            newResults.push({ platform: platform.name, outputPath, icon: platform.icon });
        }
        
        setResults(newResults);
        setProcessing(false);
    };

    return (
        <div className="content-repurposing">
            <h2>🔄 Content Repurposing</h2>
            
            {!videoPath ? (
                <div {...getRootProps()} className="dropzone">
                    <input {...getInputProps()} />
                    {isDragActive ? <p>Lepaskan file video di sini...</p> : <p>Upload video untuk repurpose ke berbagai platform</p>}
                </div>
            ) : (
                <div className="repurpose-container">
                    <div className="video-info">
                        <p>🎬 Video: {videoPath.split('\\').pop()}</p>
                    </div>
                    
                    <div className="platforms-grid">
                        <h3>Pilih Platform Target:</h3>
                        <div className="platform-buttons">
                            {platforms.map((platform) => (
                                <button 
                                    key={platform.id} 
                                    className={`platform-btn ${selectedPlatforms.includes(platform.id) ? 'selected' : ''}`}
                                    onClick={() => togglePlatform(platform.id)}
                                >
                                    {platform.icon} {platform.name}
                                    <span className="dimension">{platform.dimension}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <button onClick={processRepurpose} disabled={processing} className="btn-primary">
                        {processing ? 'Memproses...' : `🔄 Repurpose ke ${selectedPlatforms.length} Platform`}
                    </button>
                    
                    {results.length > 0 && (
                        <div className="results-section">
                            <h3>✅ Hasil Repurpose</h3>
                            {results.map((result, i) => (
                                <div key={i} className="result-item">
                                    <span className="result-icon">{result.icon}</span>
                                    <span className="result-platform">{result.platform}</span>
                                    <span className="result-path">{result.outputPath.split('\\').pop()}</span>
                                    <button onClick={() => window.electron.shellShowItemInFolder(result.outputPath)}>📁 Buka</button>
                                </div>
                            ))}
                            <button onClick={() => alert('One-click publish akan segera hadir!')}>📤 Publish ke Semua Platform</button>
                        </div>
                    )}
                    
                    <button onClick={() => setVideoPath(null)} className="btn-secondary">Pilih Video Lain</button>
                </div>
            )}
        </div>
    );
};

export default ContentRepurposing;
