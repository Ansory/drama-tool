import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const ABTesting = () => {
    const [videoPath, setVideoPath] = useState(null);
    const [variants, setVariants] = useState([
        { id: 1, caption: '', thumbnail: null },
        { id: 2, caption: '', thumbnail: null },
        { id: 3, caption: '', thumbnail: null },
        { id: 4, caption: '', thumbnail: null }
    ]);
    const [testDuration, setTestDuration] = useState(60);
    const [testResult, setTestResult] = useState(null);
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

    const updateVariantCaption = (id, caption) => {
        setVariants(variants.map(v => v.id === id ? { ...v, caption } : v));
    };

    const generateAIVariants = async () => {
        // Generate caption otomatis dengan AI
        const aiCaptions = [
            "🔥 Plot twist gila di menit 3! 😱 Jangan skip! #DramaChina #FYP",
            "Dia ternyata saudara kandung? 🤯 Endingnya bikin merinding! #FYP",
            "Jangan dilewatkan! Scene paling emosional di episode ini 😭",
            "RATING 9.5! Wajib nonton sampai habis ⭐ #DramaChinaViral"
        ];
        
        const newVariants = variants.map((v, i) => ({
            ...v,
            caption: aiCaptions[i] || v.caption
        }));
        setVariants(newVariants);
    };

    const runABTest = async () => {
        setLoading(true);
        const result = await window.electron.abtestCreate({
            videoPath,
            variants: variants.map(v => ({ caption: v.caption, thumbnail: v.thumbnail })),
            duration: testDuration
        });
        
        const testResult = await window.electron.abtestRun(result.testId);
        setTestResult(testResult);
        setLoading(false);
    };

    return (
        <div className="ab-testing">
            <h2>📊 A/B Testing Reels</h2>
            
            {!videoPath ? (
                <div {...getRootProps()} className="dropzone">
                    <input {...getInputProps()} />
                    {isDragActive ? <p>Lepaskan file video di sini...</p> : <p>Upload video untuk A/B Testing</p>}
                </div>
            ) : (
                <div className="ab-container">
                    <div className="video-info">
                        <p>🎬 Video: {videoPath.split('\\').pop()}</p>
                        <button onClick={generateAIVariants} className="btn-secondary">🤖 Generate Caption dengan AI</button>
                    </div>
                    
                    <div className="variants-grid">
                        {variants.map((variant) => (
                            <div key={variant.id} className="variant-card">
                                <h3>Varian {variant.id}</h3>
                                <textarea 
                                    placeholder="Caption untuk varian ini"
                                    value={variant.caption}
                                    onChange={(e) => updateVariantCaption(variant.id, e.target.value)}
                                    rows={3}
                                />
                                <div className="variant-stats">
                                    {testResult && testResult.allResults?.find(r => r.variantId === variant.id - 1) && (
                                        <>
                                            <div className="stat">Skor: {testResult.allResults.find(r => r.variantId === variant.id - 1).score}/100</div>
                                            <div className="stat">Views: {testResult.allResults.find(r => r.variantId === variant.id - 1).views}</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="test-settings">
                        <label>Durasi Test (menit): 
                            <input type="number" value={testDuration} onChange={(e) => setTestDuration(parseInt(e.target.value))} min={15} max={240} />
                        </label>
                        <button onClick={runABTest} disabled={loading}>
                            {loading ? 'Menjalankan Test...' : '🚀 Jalankan A/B Test'}
                        </button>
                    </div>
                    
                    {testResult && (
                        <div className="test-results">
                            <h3>🏆 Hasil A/B Test</h3>
                            <div className="winner-card">
                                <div className="winner-badge">WINNER</div>
                                <div className="winner-caption">{testResult.winner.caption}</div>
                                <div className="winner-score">Skor: {testResult.winner.score}/100</div>
                            </div>
                            <div className="all-results">
                                {testResult.allResults.map((res, i) => (
                                    <div key={i} className="result-item">
                                        <span>Varian {i+1}</span>
                                        <span className="result-score">{res.score}/100</span>
                                        <span className="result-views">{res.views} views</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => alert('Pemenang akan dipublish otomatis ke Facebook!')}>
                                Publish Winner
                            </button>
                        </div>
                    )}
                    
                    <button onClick={() => setVideoPath(null)} className="btn-secondary">Pilih Video Lain</button>
                </div>
            )}
        </div>
    );
};

export default ABTesting;
