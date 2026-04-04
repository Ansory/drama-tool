import React, { useState } from 'react';

const ScriptGenerator = () => {
    const [sceneDescription, setSceneDescription] = useState('');
    const [duration, setDuration] = useState(30);
    const [language, setLanguage] = useState('indonesia');
    const [emotion, setEmotion] = useState('excited');
    const [generatedScript, setGeneratedScript] = useState(null);
    const [loading, setLoading] = useState(false);

    const generateScript = async () => {
        if (!sceneDescription) {
            alert('Masukkan deskripsi scene terlebih dahulu');
            return;
        }
        setLoading(true);
        const result = await window.electron.scriptGenerate({
            sceneDescription,
            duration,
            language,
            emotion
        });
        setGeneratedScript(result);
        setLoading(false);
    };

    const copyToClipboard = () => {
        if (generatedScript) {
            navigator.clipboard.writeText(generatedScript.script);
            alert('Script copied!');
        }
    };

    const getEmotionIcon = (emo) => {
        const icons = {
            excited: '🤩',
            sad: '😭',
            angry: '😠',
            curious: '🤔',
            funny: '😂',
            romantic: '💕'
        };
        return icons[emo] || '🎬';
    };

    return (
        <div className="script-generator">
            <h2>📝 Script & Naskah Generator</h2>
            
            <div className="input-group">
                <label>Deskripsi Scene:</label>
                <textarea 
                    placeholder="Contoh: Scene dimana hero menangis setelah ditinggal kekasihnya, dengan latar belakang hujan"
                    value={sceneDescription}
                    onChange={(e) => setSceneDescription(e.target.value)}
                    rows={4}
                />
            </div>
            
            <div className="form-row">
                <div className="input-group">
                    <label>Durasi (detik):</label>
                    <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} min={15} max={120} />
                </div>
                
                <div className="input-group">
                    <label>Bahasa:</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                        <option value="indonesia">Bahasa Indonesia</option>
                        <option value="english">English</option>
                        <option value="mixed">Campuran (Indo + Inggris)</option>
                    </select>
                </div>
                
                <div className="input-group">
                    <label>Emosi:</label>
                    <select value={emotion} onChange={(e) => setEmotion(e.target.value)}>
                        <option value="excited">Antusias / Semangat</option>
                        <option value="sad">Sedih / Haru</option>
                        <option value="angry">Marah / Frustasi</option>
                        <option value="curious">Penasaran</option>
                        <option value="funny">Lucu / Santai</option>
                        <option value="romantic">Romantis</option>
                    </select>
                </div>
            </div>
            
            <button onClick={generateScript} disabled={loading}>
                {loading ? 'Mengenerate...' : `${getEmotionIcon(emotion)} Generate Script`}
            </button>
            
            {generatedScript && (
                <div className="script-result">
                    <h3>📄 Naskah Voiceover ({generatedScript.estimatedDuration} detik)</h3>
                    <div className="script-text">
                        {generatedScript.script}
                    </div>
                    <div className="script-actions">
                        <button onClick={copyToClipboard}>📋 Copy Script</button>
                        <button onClick={() => alert('Fitur voice recording akan segera hadir!')}>🎙️ Rekam Voiceover</button>
                    </div>
                    
                    {generatedScript.keywords && (
                        <div className="script-keywords">
                            <strong>Kata Kunci:</strong>
                            {generatedScript.keywords.map((kw, i) => (
                                <span key={i} className="keyword-tag">{kw}</span>
                            ))}
                        </div>
                    )}
                    
                    <div className="script-tip">
                        💡 <strong>Tips:</strong> Baca naskah dengan intonasi yang sesuai dengan emosi yang dipilih. Rekam di tempat yang sepi untuk hasil terbaik.
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScriptGenerator;
