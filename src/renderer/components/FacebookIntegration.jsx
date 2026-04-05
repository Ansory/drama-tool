import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

// ─── Setup App ID ─────────────────────────────────────────────────────────────
const FacebookSetup = ({ onSetupComplete }) => {
    const [appId, setAppId]   = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState('');
    const [step, setStep]     = useState(1);

    useEffect(() => {
        window.electron.getStore('fb_app_id').then(saved => { if (saved) setAppId(saved); });
    }, []);

    const handleSave = async () => {
        const trimmed = appId.trim();
        if (!trimmed || trimmed.length < 10) { setError('App ID tidak valid (15-16 digit angka).'); return; }
        if (!/^\d+$/.test(trimmed)) { setError('App ID hanya berisi angka.'); return; }
        setSaving(true);
        await window.electron.setStore('fb_app_id', trimmed);
        await window.electron.setStore('fb_setup_done', true);
        setTimeout(() => { setSaving(false); onSetupComplete(trimmed); }, 600);
    };

    return (
        <div style={{ maxWidth: 620, margin: '0 auto', padding: 24 }}>
            <h2>📘 Setup Integrasi Facebook</h2>
            <p style={{ color: '#aaa', fontSize: 14, marginBottom: 24 }}>
                Untuk mengupload video ke Facebook, kamu perlu membuat Facebook App sendiri. Gratis dan hanya sekali.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
                {[1,2].map(s => (
                    <div key={s} style={{ flex:1, height:4, borderRadius:2,
                        background: s<=step ? 'linear-gradient(90deg,#ff6b6b,#4ecdc4)' : 'rgba(255,255,255,0.1)',
                        transition:'background 0.3s' }} />
                ))}
            </div>

            {step === 1 && (
                <div>
                    <h3>Langkah 1 — Buat Facebook App</h3>
                    <div style={{ display:'flex', flexDirection:'column', gap:10, margin:'16px 0' }}>
                        {[
                            { n:1, t:'Buka', link:'https://developers.facebook.com/apps', lt:'developers.facebook.com/apps' },
                            { n:2, t:'Klik "Create App" → pilih "Business" → Next' },
                            { n:3, t:'Isi App Name bebas → Create App' },
                            { n:4, t:'Dashboard → "Add Product" → "Facebook Login" → Set Up → pilih "Web"' },
                            { n:5, t:'Site URL: https://localhost → Save' },
                            { n:6, t:'Facebook Login → Settings → Valid OAuth Redirect URIs: https://localhost/callback → Save' },
                            { n:7, t:'Settings → Basic → toggle ke "Live Mode"' },
                            { n:8, t:'Salin App ID dari Settings → Basic (angka 15-16 digit)' },
                        ].map(item => (
                            <div key={item.n} style={{ display:'flex', gap:12, alignItems:'flex-start',
                                padding:'10px 14px', background:'rgba(255,255,255,0.03)',
                                borderRadius:10, border:'1px solid rgba(255,255,255,0.06)' }}>
                                <span style={{ background:'linear-gradient(135deg,#ff6b6b,#4ecdc4)',
                                    borderRadius:'50%', width:24, height:24, minWidth:24,
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    fontSize:12, fontWeight:700 }}>{item.n}</span>
                                <span style={{ fontSize:13, color:'#ccc', lineHeight:1.6 }}>
                                    {item.t}
                                    {item.link && (
                                        <button onClick={() => window.electron.openExternal(item.link)}
                                            style={{ background:'none', border:'none', color:'#4ecdc4',
                                                cursor:'pointer', textDecoration:'underline',
                                                fontSize:13, padding:'0 4px' }}>{item.lt}</button>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setStep(2)} className="btn-primary"
                        style={{ marginTop:8, width:'100%', padding:'12px 0' }}>
                        Lanjut → Masukkan App ID
                    </button>
                </div>
            )}

            {step === 2 && (
                <div>
                    <h3>Langkah 2 — Masukkan App ID</h3>
                    <p style={{ color:'#aaa', fontSize:13, marginBottom:16 }}>
                        App ID ada di <strong>Settings → Basic</strong> di Meta Developer Console.
                    </p>
                    <input type="text" value={appId}
                        onChange={(e) => { setAppId(e.target.value.replace(/\D/g,'')); setError(''); }}
                        onKeyDown={(e) => e.key==='Enter' && handleSave()}
                        placeholder="1234567890123456" maxLength={20}
                        style={{ fontFamily:'monospace', fontSize:16, letterSpacing:1, marginBottom:8 }}
                        autoFocus />
                    {error && <p style={{ color:'#ff6b6b', fontSize:13, marginBottom:12 }}>⚠️ {error}</p>}
                    <div className="info-box" style={{ marginBottom:20 }}>
                        <h4>🔒 App ID aman diinput di sini</h4>
                        <p style={{ fontSize:13, color:'#ccc', marginTop:6 }}>
                            App ID bukan secret — hanya identifier publik. App Secret tidak diminta di sini.
                        </p>
                    </div>
                    <div style={{ display:'flex', gap:12 }}>
                        <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex:1, padding:'12px 0' }}>← Kembali</button>
                        <button onClick={handleSave} className="btn-primary"
                            disabled={saving || appId.length < 10} style={{ flex:2, padding:'12px 0' }}>
                            {saving ? '✅ Menyimpan...' : '💾 Simpan & Lanjutkan'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── AI Auto-Fill Panel ───────────────────────────────────────────────────────
const AIAutoFill = ({ videoPath, onApply }) => {
    const [dramaName, setDramaName]   = useState('');
    const [sceneHint, setSceneHint]   = useState('auto');
    const [platform, setPlatform]     = useState('facebook');
    const [generating, setGenerating] = useState(false);
    const [result, setResult]         = useState(null);
    const [error, setError]           = useState('');
    const [selectedTitle, setSelectedTitle] = useState(0);

    const generate = async () => {
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
            setError(err.message || 'Gagal generate konten');
        }
        setGenerating(false);
    };

    const handleApply = () => {
        if (!result) return;
        onApply({
            title: result.titles?.[selectedTitle] || '',
            caption: result.caption_long || '',
            hashtags: result.hashtags?.join(' ') || '',
            scheduledTime: result.best_post_time || '',
            thumbnailText: result.thumbnail_text || ''
        });
    };

    const sceneOptions = [
        { value:'auto',          label:'🤖 Auto Detect' },
        { value:'sad_dramatic',  label:'😭 Sedih / Haru' },
        { value:'romantic_bright', label:'💕 Romantis' },
        { value:'action',        label:'⚔️ Action' },
        { value:'plot_twist',    label:'😱 Plot Twist' },
        { value:'confrontation', label:'💥 Konfrontasi' },
        { value:'drama_general', label:'🎭 Drama Umum' },
    ];

    return (
        <div style={{ background:'rgba(78,205,196,0.06)', border:'1px solid rgba(78,205,196,0.2)',
            borderRadius:16, padding:20, marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <span style={{ fontSize:22 }}>🤖</span>
                <div>
                    <h3 style={{ margin:0, fontSize:16, color:'#4ecdc4' }}>AI Auto-Generate Konten</h3>
                    <p style={{ margin:0, fontSize:12, color:'#666' }}>
                        AI akan analisis video dan isi judul, caption, hashtag otomatis
                    </p>
                </div>
            </div>

            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:12 }}>
                <div style={{ flex:2, minWidth:160 }}>
                    <label style={{ fontSize:12, color:'#aaa', display:'block', marginBottom:4 }}>
                        Nama Drama (opsional):
                    </label>
                    <input type="text" value={dramaName}
                        onChange={(e) => setDramaName(e.target.value)}
                        placeholder="Contoh: The Double"
                        style={{ margin:0, padding:'8px 12px', fontSize:13 }} />
                </div>
                <div style={{ flex:1, minWidth:140 }}>
                    <label style={{ fontSize:12, color:'#aaa', display:'block', marginBottom:4 }}>
                        Jenis Scene:
                    </label>
                    <select value={sceneHint} onChange={(e) => setSceneHint(e.target.value)}
                        style={{ margin:0, padding:'8px 12px', fontSize:13 }}>
                        {sceneOptions.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
                <div style={{ flex:1, minWidth:130 }}>
                    <label style={{ fontSize:12, color:'#aaa', display:'block', marginBottom:4 }}>
                        Platform:
                    </label>
                    <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                        style={{ margin:0, padding:'8px 12px', fontSize:13 }}>
                        <option value="facebook">📘 Facebook</option>
                        <option value="instagram">📷 Instagram</option>
                        <option value="tiktok">🎵 TikTok</option>
                        <option value="youtube">▶️ YouTube</option>
                    </select>
                </div>
            </div>

            <button onClick={generate} disabled={generating}
                style={{ width:'100%', padding:'10px 0', fontSize:14, fontWeight:700,
                    background: generating ? '#333' : 'linear-gradient(135deg,#4ecdc4,#45b7b8)',
                    color:'#0f0f1a', border:'none', borderRadius:10, cursor: generating ? 'not-allowed' : 'pointer',
                    marginBottom:16, transition:'all 0.2s' }}>
                {generating ? '🤖 AI sedang menganalisis video...' : '✨ Generate Konten dengan AI'}
            </button>

            {error && (
                <div style={{ background:'rgba(255,70,70,0.1)', border:'1px solid rgba(255,70,70,0.3)',
                    borderRadius:10, padding:'10px 14px', color:'#ff6b6b', fontSize:13, marginBottom:12 }}>
                    ⚠️ {error}
                    {error.includes('API key') && (
                        <span style={{ color:'#aaa' }}> — Tambahkan Gemini API key di menu <strong>Load Balancer</strong>.</span>
                    )}
                </div>
            )}

            {result && (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {/* Badge sumber */}
                    <div style={{ fontSize:11, color: result.generated_by === 'gemini' ? '#4ecdc4' : '#888' }}>
                        {result.generated_by === 'gemini'
                            ? `✅ Dibuat oleh Gemini AI (${result.tokens_used || 0} tokens)`
                            : '📝 Template (tambahkan Gemini API key untuk hasil lebih baik)'}
                    </div>

                    {/* Pilih judul */}
                    <div>
                        <label style={{ fontSize:12, color:'#aaa', display:'block', marginBottom:6 }}>
                            Pilih Judul:
                        </label>
                        {result.titles?.map((title, i) => (
                            <div key={i} onClick={() => setSelectedTitle(i)}
                                style={{ padding:'8px 12px', borderRadius:8, cursor:'pointer',
                                    background: selectedTitle === i
                                        ? 'rgba(78,205,196,0.2)' : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${selectedTitle === i
                                        ? 'rgba(78,205,196,0.5)' : 'rgba(255,255,255,0.06)'}`,
                                    marginBottom:6, fontSize:13, color:'#fff',
                                    transition:'all 0.15s' }}>
                                {selectedTitle === i && <span style={{ color:'#4ecdc4', marginRight:8 }}>✓</span>}
                                {title}
                            </div>
                        ))}
                    </div>

                    {/* Preview caption */}
                    <div>
                        <label style={{ fontSize:12, color:'#aaa', display:'block', marginBottom:4 }}>
                            Caption:
                        </label>
                        <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:'10px 12px',
                            fontSize:13, color:'#ccc', lineHeight:1.6, maxHeight:80, overflow:'auto' }}>
                            {result.caption_long}
                        </div>
                    </div>

                    {/* Hashtag */}
                    <div>
                        <label style={{ fontSize:12, color:'#aaa', display:'block', marginBottom:6 }}>
                            Hashtag ({result.hashtags?.length || 0}):
                        </label>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                            {result.hashtags?.map((tag, i) => (
                                <span key={i} style={{ background:'rgba(78,205,196,0.15)',
                                    padding:'3px 10px', borderRadius:20, fontSize:12, color:'#4ecdc4' }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Info tambahan */}
                    <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                        <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:8,
                            padding:'8px 12px', fontSize:12, flex:1, minWidth:120 }}>
                            ⏰ Waktu terbaik: <strong style={{ color:'#4ecdc4' }}>
                                {result.best_post_time} WIB
                            </strong>
                        </div>
                        <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:8,
                            padding:'8px 12px', fontSize:12, flex:1, minWidth:120 }}>
                            🎬 Thumbnail: <strong style={{ color:'#ff6b6b' }}>
                                {result.thumbnail_text}
                            </strong>
                        </div>
                    </div>

                    {/* Tips viral */}
                    {result.viral_tips?.length > 0 && (
                        <div style={{ background:'rgba(255,107,107,0.08)',
                            border:'1px solid rgba(255,107,107,0.2)',
                            borderRadius:10, padding:'10px 14px' }}>
                            <div style={{ fontSize:12, color:'#ff6b6b', fontWeight:600,
                                marginBottom:6 }}>💡 Tips Viral:</div>
                            {result.viral_tips.map((tip, i) => (
                                <div key={i} style={{ fontSize:12, color:'#aaa', marginBottom:3 }}>
                                    • {tip}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tombol apply */}
                    <button onClick={handleApply}
                        style={{ width:'100%', padding:'11px 0', fontSize:14, fontWeight:700,
                            background:'linear-gradient(135deg,#ff6b6b,#ff5252)',
                            color:'white', border:'none', borderRadius:10, cursor:'pointer' }}>
                        ✅ Terapkan ke Form Upload
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const FacebookIntegration = () => {
    const [setupDone, setSetupDone]           = useState(false);
    const [appId, setAppId]                   = useState('');
    const [isLoggedIn, setIsLoggedIn]         = useState(false);
    const [user, setUser]                     = useState(null);
    const [pages, setPages]                   = useState([]);
    const [selectedPage, setSelectedPage]     = useState(null);
    const [uploading, setUploading]           = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [videoPath, setVideoPath]           = useState(null);
    const [caption, setCaption]               = useState('');
    const [scheduledTime, setScheduledTime]   = useState('');
    const [uploadResult, setUploadResult]     = useState(null);
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState(null);
    const [showAI, setShowAI]                 = useState(false);

    useEffect(() => { init(); }, []);

    const init = async () => {
        setLoading(true);
        const savedAppId = await window.electron.getStore('fb_app_id');
        const done       = await window.electron.getStore('fb_setup_done');
        if (savedAppId && done) { setAppId(savedAppId); setSetupDone(true); await checkLogin(); }
        setLoading(false);
    };

    const handleSetupComplete = async (newAppId) => {
        setAppId(newAppId); setSetupDone(true); await checkLogin();
    };

    const checkLogin = async () => {
        try {
            const result = await window.electron.facebookCheckLogin();
            if (result.loggedIn) {
                setIsLoggedIn(true); setUser(result.user);
                setPages(result.pages || []);
                if (result.pages?.length > 0) setSelectedPage(result.pages[0]);
            }
        } catch { setIsLoggedIn(false); }
    };

    const login = async () => {
        setError(null); setLoading(true);
        try {
            const result = await window.electron.facebookLogin(appId);
            if (result.success) {
                setIsLoggedIn(true); setPages(result.pages || []);
                if (result.pages?.length > 0) setSelectedPage(result.pages[0]);
            } else { setError(result.error || 'Login gagal.'); }
        } catch (err) { setError(err.message); }
        setLoading(false);
    };

    const logout = async () => {
        if (!confirm('Logout dari Facebook?')) return;
        await window.electron.setStore('fb_logged_in', false);
        await window.electron.setStore('fb_user_token', null);
        await window.electron.setStore('fb_pages', []);
        setIsLoggedIn(false); setUser(null); setPages([]);
        setSelectedPage(null); setUploadResult(null); setVideoPath(null);
    };

    const resetSetup = async () => {
        if (!confirm('Reset App ID?')) return;
        await window.electron.setStore('fb_app_id', null);
        await window.electron.setStore('fb_setup_done', false);
        await logout(); setSetupDone(false); setAppId('');
    };

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setVideoPath(file.path);
            setUploadResult(null);
            // Auto-tampilkan AI panel setelah video dipilih
            setShowAI(true);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv'] }
    });

    // Callback dari AI panel — isi form otomatis
    const handleAIApply = ({ title, caption: cap, hashtags, scheduledTime: st, thumbnailText }) => {
        setCaption(`${cap}\n\n${hashtags}`);
        if (st) {
            // Convert "HH:MM" ke datetime-local format (pakai tanggal hari ini)
            const today = new Date();
            const [h, m] = st.split(':');
            today.setHours(parseInt(h), parseInt(m), 0, 0);
            // Jika waktu sudah lewat, pakai besok
            if (today < new Date()) today.setDate(today.getDate() + 1);
            setScheduledTime(today.toISOString().slice(0, 16));
        }
    };

    const uploadReel = async () => {
        if (!videoPath) { setError('Pilih video terlebih dahulu'); return; }
        if (!selectedPage) { setError('Pilih Facebook Page terlebih dahulu'); return; }
        setError(null); setUploading(true); setUploadProgress(0); setUploadResult(null);

        const timer = setInterval(() => { setUploadProgress(p => p < 85 ? p + 5 : p); }, 1500);
        try {
            const result = await window.electron.facebookUploadReel({
                videoPath, pageId: selectedPage.id, caption,
                scheduledTime: scheduledTime ? new Date(scheduledTime).getTime() : null
            });
            clearInterval(timer); setUploadProgress(100); setUploadResult(result);
            if (result.success) { setVideoPath(null); setCaption(''); setScheduledTime(''); setShowAI(false); }
        } catch (err) {
            clearInterval(timer);
            setUploadResult({ success: false, error: err.message });
        }
        setUploading(false);
    };

    if (loading) return (
        <div className="facebook-integration">
            <h2>📘 Integrasi Facebook</h2>
            <div className="loading">Memuat...</div>
        </div>
    );

    if (!setupDone) return <FacebookSetup onSetupComplete={handleSetupComplete} />;

    return (
        <div className="facebook-integration">
            <h2>📘 Integrasi Facebook</h2>

            {/* App ID bar */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'8px 14px', background:'rgba(255,255,255,0.03)',
                borderRadius:10, marginBottom:16, fontSize:12 }}>
                <span style={{ color:'#555' }}>
                    App ID: <span style={{ color:'#aaa', fontFamily:'monospace' }}>{appId}</span>
                </span>
                <button onClick={resetSetup} style={{ background:'none', border:'none',
                    color:'#555', cursor:'pointer', fontSize:12, textDecoration:'underline' }}>
                    Ganti App ID
                </button>
            </div>

            {error && (
                <div style={{ background:'rgba(255,70,70,0.15)', border:'1px solid rgba(255,70,70,0.4)',
                    borderRadius:10, padding:'12px 16px', marginBottom:16, color:'#ff6b6b', fontSize:13 }}>
                    ⚠️ {error}
                    <button onClick={() => setError(null)} style={{ float:'right', background:'none',
                        border:'none', color:'#ff6b6b', cursor:'pointer', fontSize:16 }}>×</button>
                </div>
            )}

            {!isLoggedIn ? (
                <div className="login-section">
                    <div className="info-box" style={{ marginBottom:24 }}>
                        <h4>🔐 Login Diperlukan</h4>
                        <p style={{ color:'#ccc', fontSize:13, marginTop:8 }}>
                            Login untuk menghubungkan Facebook Page dan mengupload video.
                        </p>
                    </div>
                    <button onClick={login} className="btn-facebook" disabled={loading}>
                        🔐 Login dengan Facebook
                    </button>
                </div>
            ) : (
                <div className="upload-section">
                    {/* Header */}
                    <div style={{ display:'flex', justifyContent:'space-between',
                        alignItems:'center', marginBottom:20 }}>
                        <div style={{ color:'#4ecdc4', fontSize:13 }}>
                            ✅ Terhubung ke Facebook
                            {user && <span style={{ color:'#aaa', marginLeft:8 }}>({user.name})</span>}
                        </div>
                        <button onClick={logout} className="btn-secondary"
                            style={{ padding:'6px 12px', fontSize:12 }}>Logout</button>
                    </div>

                    {/* Pilih Page */}
                    <div style={{ marginBottom:16 }}>
                        <label>Pilih Facebook Page:</label>
                        {pages.length === 0 ? (
                            <div className="info-box">
                                <p style={{ color:'#aaa', fontSize:13 }}>
                                    ⚠️ Tidak ada Page.{' '}
                                    <button onClick={checkLogin} style={{ background:'none', border:'none',
                                        color:'#4ecdc4', cursor:'pointer', textDecoration:'underline', padding:0 }}>
                                        Refresh
                                    </button>
                                </p>
                            </div>
                        ) : (
                            <select value={selectedPage?.id || ''}
                                onChange={(e) => setSelectedPage(pages.find(p => p.id === e.target.value))}>
                                {pages.map(page => (
                                    <option key={page.id} value={page.id}>
                                        {page.name}{page.fanCount > 0 && ` (${page.fanCount.toLocaleString()} followers)`}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Dropzone */}
                    <div {...getRootProps()} className="mini-dropzone">
                        <input {...getInputProps()} />
                        {isDragActive ? <p>Lepaskan video...</p>
                            : <p>📹 Drag & drop video — AI akan otomatis isi konten!</p>}
                    </div>

                    {videoPath && (
                        <div style={{ display:'flex', justifyContent:'space-between',
                            alignItems:'center', marginBottom:8 }}>
                            <p className="selected-file" style={{ margin:0 }}>
                                ✅ {videoPath.split('\\').pop()}
                            </p>
                            <div style={{ display:'flex', gap:8 }}>
                                <button onClick={() => setShowAI(!showAI)}
                                    style={{ background: showAI ? 'rgba(78,205,196,0.2)' : 'rgba(255,255,255,0.08)',
                                        border: showAI ? '1px solid rgba(78,205,196,0.4)' : '1px solid rgba(255,255,255,0.1)',
                                        color: showAI ? '#4ecdc4' : '#aaa', borderRadius:8,
                                        padding:'6px 12px', cursor:'pointer', fontSize:12 }}>
                                    🤖 {showAI ? 'Sembunyikan AI' : 'Tampilkan AI'}
                                </button>
                                <button onClick={() => { setVideoPath(null); setShowAI(false); }}
                                    style={{ background:'none', border:'none', color:'#ff6b6b',
                                        cursor:'pointer', fontSize:18 }}>✕</button>
                            </div>
                        </div>
                    )}

                    {/* AI Auto-Fill Panel */}
                    {videoPath && showAI && (
                        <AIAutoFill videoPath={videoPath} onApply={handleAIApply} />
                    )}

                    {/* Caption */}
                    <div style={{ position:'relative' }}>
                        <textarea placeholder="Caption untuk video... (atau gunakan AI di atas)"
                            value={caption} onChange={(e) => setCaption(e.target.value)}
                            rows={4} style={{ marginTop:12 }} />
                        <span style={{ position:'absolute', bottom:8, right:12,
                            fontSize:11, color: caption.length > 2000 ? '#ff6b6b' : '#555' }}>
                            {caption.length}/2200
                        </span>
                    </div>

                    {/* Jadwal */}
                    <div className="form-group">
                        <label>Jadwal Upload (opsional):</label>
                        <input type="datetime-local" value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            min={new Date(Date.now() + 10*60*1000).toISOString().slice(0,16)} />
                        <p className="hint">Kosongkan untuk publish sekarang</p>
                    </div>

                    {/* Progress */}
                    {uploading && (
                        <div style={{ marginBottom:12 }}>
                            <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:4,
                                height:6, overflow:'hidden' }}>
                                <div style={{ width:`${uploadProgress}%`, height:'100%',
                                    background:'linear-gradient(90deg,#4ecdc4,#ff6b6b)',
                                    borderRadius:4, transition:'width 0.5s ease' }} />
                            </div>
                            <p style={{ fontSize:12, color:'#aaa', marginTop:4 }}>
                                Mengupload... {uploadProgress}%
                            </p>
                        </div>
                    )}

                    {/* Tombol Upload */}
                    <button onClick={uploadReel}
                        disabled={uploading || !videoPath || pages.length === 0}
                        className="btn-primary"
                        style={{ width:'100%', padding:'12px 0', fontSize:15, marginBottom:16 }}>
                        {uploading ? `⏳ ${uploadProgress}%`
                            : scheduledTime ? '📅 Jadwalkan Upload'
                            : '📤 Upload ke Facebook Sekarang'}
                    </button>

                    {/* Hasil */}
                    {uploadResult && (
                        <div style={{ background: uploadResult.success
                                ? 'rgba(78,205,196,0.1)' : 'rgba(255,70,70,0.1)',
                            border:`1px solid ${uploadResult.success
                                ? 'rgba(78,205,196,0.4)' : 'rgba(255,70,70,0.4)'}`,
                            borderRadius:10, padding:16 }}>
                            {uploadResult.success ? (
                                <>
                                    <h4 style={{ color:'#4ecdc4', marginBottom:8 }}>✅ Upload Berhasil!</h4>
                                    {uploadResult.url && (
                                        <button onClick={() => window.electron.openExternal(uploadResult.url)}
                                            style={{ background:'#1877f2', color:'white', border:'none',
                                                borderRadius:8, padding:'8px 16px', cursor:'pointer', fontSize:13 }}>
                                            🔗 Lihat di Facebook
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <h4 style={{ color:'#ff6b6b', marginBottom:8 }}>❌ Upload Gagal</h4>
                                    <p style={{ fontSize:13, color:'#aaa' }}>{uploadResult.error}</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FacebookIntegration;
