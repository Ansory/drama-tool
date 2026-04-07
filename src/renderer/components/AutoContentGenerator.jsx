import React, { useState } from 'react';

const sceneOptions = [
    { value: 'auto',             label: '🤖 Auto Detect' },
    { value: 'sad_dramatic',     label: '😭 Sedih / Haru' },
    { value: 'romantic_bright',  label: '💕 Romantis' },
    { value: 'action',           label: '⚔️ Action' },
    { value: 'plot_twist',       label: '😱 Plot Twist' },
    { value: 'confrontation',    label: '💥 Konfrontasi' },
    { value: 'drama_general',    label: '🎭 Drama Umum' },
];

const platformOptions = [
    { value: 'facebook',  label: '📘 Facebook' },
    { value: 'instagram', label: '📷 Instagram' },
    { value: 'tiktok',    label: '🎵 TikTok' },
    { value: 'youtube',   label: '▶️ YouTube' },
];

const AutoContentGenerator = () => {
    const [videoPath, setVideoPath]         = useState('');
    const [dramaName, setDramaName]         = useState('');
    const [sceneHint, setSceneHint]         = useState('auto');
    const [platform, setPlatform]           = useState('facebook');
    const [generating, setGenerating]       = useState(false);
    const [result, setResult]               = useState(null);
    const [error, setError]                 = useState('');
    const [selectedTitle, setSelectedTitle] = useState(0);
    const [copied, setCopied]               = useState('');

    const handleSelectVideo = async () => {
        const res = await window.electron.showOpenDialog({
            filters: [{ name: 'Video', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv'] }],
            properties: ['openFile']
        });
        if (res && !res.canceled && res.filePaths && res.filePaths[0]) {
            setVideoPath(res.filePaths[0]);
            setResult(null);
            setError('');
        }
    };

    const handleGenerate = async () => {
        if (!videoPath) {
            setError('Pilih file video terlebih dahulu.');
            return;
        }
        setGenerating(true);
        setError('');
        setResult(null);
        try {
            const res = await window.electron.autoGenerateContent({
                videoPath, dramaName, sceneHint, platform
            });
            if (res.error && !res.fallback) {
                setError(res.error);
            } else {
                setResult(res.fallback || res);
                setSelectedTitle(0);
            }
        } catch (err) {
            setError(err.message || 'Gagal generate konten. Coba lagi.');
        }
        setGenerating(false);
    };

    const copyText = async (text, key) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(key);
            setTimeout(() => setCopied(''), 2000);
        } catch {
            setCopied(`${key}_fail`);
            setTimeout(() => setCopied(''), 2000);
        }
    };

    const copyAll = () => {
        if (!result) return;
        const title    = result.titles?.[selectedTitle] || '';
        const caption  = result.caption_long || '';
        const hashtags = result.hashtags?.join(' ') || '';
        copyText([title, caption, hashtags].filter(Boolean).join('\n\n'), 'all');
    };

    const videoFileName = videoPath ? videoPath.split(/[\\/]/).pop() : '';

    /* ─── shared inline styles ─── */
    const card = {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    };

    const label12 = { fontSize: 12, color: '#aaa', display: 'block', marginBottom: 4 };

    const inputStyle = {
        width: '100%',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 10,
        padding: '10px 14px',
        color: '#fff',
        fontSize: 13,
        outline: 'none',
        boxSizing: 'border-box',
    };

    const copyBtn = (text, key, label) => (
        <button
            onClick={() => copyText(text, key)}
            style={{
                background: copied === key ? 'rgba(78,205,196,0.2)' : copied === `${key}_fail` ? 'rgba(255,70,70,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${copied === key ? 'rgba(78,205,196,0.5)' : copied === `${key}_fail` ? 'rgba(255,70,70,0.4)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8,
                padding: '5px 12px',
                fontSize: 12,
                color: copied === key ? '#4ecdc4' : copied === `${key}_fail` ? '#ff6b6b' : '#aaa',
                cursor: 'pointer',
                transition: 'all 0.2s',
            }}
        >
            {copied === key ? '✅ Tersalin!' : copied === `${key}_fail` ? '❌ Gagal copy' : label}
        </button>
    );

    return (
        <div style={{ padding: '24px 28px', maxWidth: 820, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 22, color: '#4ecdc4', display: 'flex', alignItems: 'center', gap: 10 }}>
                    🤖 Auto Content Generator
                </h2>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#888' }}>
                    Analisis video drama secara otomatis dan hasilkan judul, caption, serta hashtag dengan AI.
                </p>
            </div>

            {/* ── Form Card ── */}
            <div style={card}>
                {/* Video Picker */}
                <div style={{ marginBottom: 16 }}>
                    <label style={label12}>File Video:</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <button
                            onClick={handleSelectVideo}
                            style={{
                                background: 'rgba(78,205,196,0.12)',
                                border: '1px solid rgba(78,205,196,0.35)',
                                borderRadius: 10,
                                padding: '9px 18px',
                                fontSize: 13,
                                color: '#4ecdc4',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                            }}
                        >
                            🎬 Pilih Video
                        </button>
                        <div style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 10,
                            padding: '9px 14px',
                            fontSize: 12,
                            color: videoPath ? '#ccc' : '#555',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {videoFileName || 'Belum ada file dipilih…'}
                        </div>
                    </div>
                </div>

                {/* Inputs Row */}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
                    {/* Drama Name */}
                    <div style={{ flex: 2, minWidth: 180 }}>
                        <label style={label12}>Nama Drama (opsional):</label>
                        <input
                            type="text"
                            value={dramaName}
                            onChange={(e) => setDramaName(e.target.value)}
                            placeholder="Contoh: The Double, Ratu Air Mata…"
                            style={inputStyle}
                        />
                    </div>

                    {/* Scene Hint */}
                    <div style={{ flex: 1, minWidth: 160 }}>
                        <label style={label12}>Jenis Scene:</label>
                        <select
                            value={sceneHint}
                            onChange={(e) => setSceneHint(e.target.value)}
                            style={inputStyle}
                        >
                            {sceneOptions.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Platform */}
                    <div style={{ flex: 1, minWidth: 140 }}>
                        <label style={label12}>Platform Target:</label>
                        <select
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            style={inputStyle}
                        >
                            {platformOptions.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    style={{
                        width: '100%',
                        padding: '12px 0',
                        fontSize: 15,
                        fontWeight: 700,
                        background: generating
                            ? 'rgba(255,255,255,0.06)'
                            : 'linear-gradient(135deg, #4ecdc4, #45b7b8)',
                        color: generating ? '#666' : '#0f0f1a',
                        border: 'none',
                        borderRadius: 12,
                        cursor: generating ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        letterSpacing: 0.5,
                    }}
                >
                    {generating ? '🤖 AI sedang menganalisis video…' : '✨ Generate Konten dengan AI'}
                </button>
            </div>

            {/* ── Error State ── */}
            {error && (
                <div style={{
                    background: 'rgba(255,70,70,0.1)',
                    border: '1px solid rgba(255,70,70,0.3)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    color: '#ff6b6b',
                    fontSize: 13,
                    marginBottom: 16,
                }}>
                    ⚠️ {error}
                    {error.toLowerCase().includes('api key') && (
                        <span style={{ color: '#aaa' }}>
                            {' '}— Tambahkan Gemini API key di menu <strong style={{ color: '#4ecdc4' }}>🔑 Load Balancer</strong>.
                        </span>
                    )}
                </div>
            )}

            {/* ── Result ── */}
            {result && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Source Badge */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: result.generated_by === 'gemini'
                            ? 'rgba(78,205,196,0.12)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${result.generated_by === 'gemini'
                            ? 'rgba(78,205,196,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: 20,
                        padding: '5px 14px',
                        fontSize: 12,
                        color: result.generated_by === 'gemini' ? '#4ecdc4' : '#888',
                        alignSelf: 'flex-start',
                    }}>
                        {result.generated_by === 'gemini'
                            ? `✅ Dibuat oleh Gemini AI (${result.tokens_used || 0} tokens)`
                            : '📝 Template — Tambahkan Gemini API key di Load Balancer untuk hasil lebih baik'}
                    </div>

                    {/* ── Titles ── */}
                    <div style={card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>🎯 Pilih Judul:</span>
                            {copyBtn(result.titles?.[selectedTitle] || '', 'title', '📋 Copy Judul')}
                        </div>
                        {result.titles?.map((title, i) => (
                            <div
                                key={i}
                                onClick={() => setSelectedTitle(i)}
                                style={{
                                    padding: '9px 13px',
                                    borderRadius: 10,
                                    cursor: 'pointer',
                                    background: selectedTitle === i
                                        ? 'rgba(78,205,196,0.15)' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${selectedTitle === i
                                        ? 'rgba(78,205,196,0.45)' : 'rgba(255,255,255,0.06)'}`,
                                    marginBottom: 6,
                                    fontSize: 13,
                                    color: '#fff',
                                    transition: 'all 0.15s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <span style={{ color: '#4ecdc4', minWidth: 16 }}>
                                    {selectedTitle === i ? '✓' : ''}
                                </span>
                                {title}
                            </div>
                        ))}
                    </div>

                    {/* ── Captions ── */}
                    <div style={card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>📝 Caption Pendek:</span>
                            {copyBtn(result.caption_short || '', 'caption_short', '📋 Copy')}
                        </div>
                        <div style={{
                            background: 'rgba(0,0,0,0.25)',
                            borderRadius: 10,
                            padding: '10px 13px',
                            fontSize: 13,
                            color: '#ccc',
                            lineHeight: 1.6,
                            marginBottom: 14,
                        }}>
                            {result.caption_short || '—'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>📄 Caption Panjang:</span>
                            {copyBtn(result.caption_long || '', 'caption_long', '📋 Copy')}
                        </div>
                        <div style={{
                            background: 'rgba(0,0,0,0.25)',
                            borderRadius: 10,
                            padding: '10px 13px',
                            fontSize: 13,
                            color: '#ccc',
                            lineHeight: 1.6,
                            maxHeight: 120,
                            overflowY: 'auto',
                        }}>
                            {result.caption_long || '—'}
                        </div>
                    </div>

                    {/* ── Hashtags ── */}
                    <div style={card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>
                                🔖 Hashtag ({result.hashtags?.length || 0}):
                            </span>
                            {copyBtn(result.hashtags?.join(' ') || '', 'hashtags', '📋 Copy Hashtag')}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                            {result.hashtags?.map((tag, i) => (
                                <span key={i} style={{
                                    background: 'rgba(78,205,196,0.12)',
                                    border: '1px solid rgba(78,205,196,0.25)',
                                    padding: '4px 12px',
                                    borderRadius: 20,
                                    fontSize: 12,
                                    color: '#4ecdc4',
                                }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* ── Info Row ── */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ ...card, flex: 1, minWidth: 130, marginBottom: 0, padding: '12px 14px' }}>
                            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>⏰ Waktu Posting Terbaik</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#4ecdc4' }}>
                                {result.best_post_time ? `${result.best_post_time} WIB` : '—'}
                            </div>
                        </div>
                        <div style={{ ...card, flex: 1, minWidth: 130, marginBottom: 0, padding: '12px 14px' }}>
                            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>🎬 Teks Thumbnail</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#ff6b6b' }}>
                                {result.thumbnail_text || '—'}
                            </div>
                        </div>
                    </div>

                    {/* ── Viral Tips ── */}
                    {result.viral_tips?.length > 0 && (
                        <div style={{
                            ...card,
                            background: 'rgba(255,107,107,0.07)',
                            border: '1px solid rgba(255,107,107,0.2)',
                        }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#ff6b6b', marginBottom: 8 }}>
                                💡 Tips Viral:
                            </div>
                            {result.viral_tips.map((tip, i) => (
                                <div key={i} style={{ fontSize: 13, color: '#bbb', marginBottom: 4, lineHeight: 1.5 }}>
                                    • {tip}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Video Metadata ── */}
                    {result.metadata && (
                        <div style={card}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#ccc', marginBottom: 10 }}>
                                📊 Metadata Video:
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {[
                                    ['⏱ Durasi',       result.metadata.duration != null
                                        ? `${Number(result.metadata.duration).toFixed(1)}s` : null],
                                    ['📐 Resolusi',     result.metadata.resolution],
                                    ['🎞 FPS',          result.metadata.fps],
                                    ['☀️ Brightness',   result.metadata.brightness != null
                                        ? `${Number(result.metadata.brightness).toFixed(1)}` : null],
                                    ['🏃 Motion Score', result.metadata.motion_score != null
                                        ? `${Number(result.metadata.motion_score).toFixed(2)}` : null],
                                ].filter(([, v]) => v != null).map(([label, val]) => (
                                    <div key={label} style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.07)',
                                        borderRadius: 10,
                                        padding: '7px 12px',
                                        fontSize: 12,
                                        flex: '1 1 100px',
                                        minWidth: 90,
                                    }}>
                                        <div style={{ color: '#666', marginBottom: 2 }}>{label}</div>
                                        <div style={{ color: '#ccc', fontWeight: 600 }}>{val}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Copy All Button ── */}
                    <button
                        onClick={copyAll}
                        style={{
                            width: '100%',
                            padding: '12px 0',
                            fontSize: 14,
                            fontWeight: 700,
                            background: copied === 'all'
                                ? 'rgba(78,205,196,0.2)'
                                : copied === 'all_fail'
                                ? 'rgba(255,70,70,0.15)'
                                : 'linear-gradient(135deg, #ff6b6b, #ff5252)',
                            color: copied === 'all' ? '#4ecdc4' : copied === 'all_fail' ? '#ff6b6b' : '#fff',
                            border: `1px solid ${copied === 'all' ? 'rgba(78,205,196,0.4)' : copied === 'all_fail' ? 'rgba(255,70,70,0.4)' : 'transparent'}`,
                            borderRadius: 12,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            letterSpacing: 0.4,
                        }}
                    >
                        {copied === 'all'
                            ? '✅ Semua tersalin ke clipboard!'
                            : copied === 'all_fail'
                            ? '❌ Gagal copy ke clipboard'
                            : '📋 Copy Semua (Judul + Caption + Hashtag)'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AutoContentGenerator;
