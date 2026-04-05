import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import FacebookSetup from './FacebookSetup';

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

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        setLoading(true);
        // Cek apakah App ID sudah diset
        const savedAppId = await window.electron.getStore('fb_app_id');
        const done = await window.electron.getStore('fb_setup_done');

        if (savedAppId && done) {
            setAppId(savedAppId);
            setSetupDone(true);
            await checkLogin();
        }
        setLoading(false);
    };

    const handleSetupComplete = async (newAppId) => {
        setAppId(newAppId);
        setSetupDone(true);
        await checkLogin();
    };

    const checkLogin = async () => {
        try {
            const result = await window.electron.facebookCheckLogin();
            if (result.loggedIn) {
                setIsLoggedIn(true);
                setUser(result.user);
                setPages(result.pages || []);
                if (result.pages?.length > 0) setSelectedPage(result.pages[0]);
            }
        } catch {
            setIsLoggedIn(false);
        }
    };

    const login = async () => {
        setError(null);
        setLoading(true);
        try {
            const result = await window.electron.facebookLogin(appId);
            if (result.success) {
                setIsLoggedIn(true);
                setPages(result.pages || []);
                if (result.pages?.length > 0) setSelectedPage(result.pages[0]);
            } else {
                setError(result.error || 'Login gagal.');
            }
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    const logout = async () => {
        if (!confirm('Logout dari Facebook?')) return;
        await window.electron.setStore('fb_logged_in', false);
        await window.electron.setStore('fb_user_token', null);
        await window.electron.setStore('fb_pages', []);
        setIsLoggedIn(false);
        setUser(null);
        setPages([]);
        setSelectedPage(null);
        setUploadResult(null);
        setVideoPath(null);
    };

    const resetSetup = async () => {
        if (!confirm('Reset App ID? Kamu perlu input App ID lagi.')) return;
        await window.electron.setStore('fb_app_id', null);
        await window.electron.setStore('fb_setup_done', false);
        await logout();
        setSetupDone(false);
        setAppId('');
    };

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) { setVideoPath(file.path); setUploadResult(null); }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv'] }
    });

    const uploadReel = async () => {
        if (!videoPath) { setError('Pilih video terlebih dahulu'); return; }
        if (!selectedPage) { setError('Pilih Facebook Page terlebih dahulu'); return; }

        setError(null);
        setUploading(true);
        setUploadProgress(0);
        setUploadResult(null);

        const timer = setInterval(() => {
            setUploadProgress(p => p < 85 ? p + 5 : p);
        }, 1500);

        try {
            const result = await window.electron.facebookUploadReel({
                videoPath, pageId: selectedPage.id, caption,
                scheduledTime: scheduledTime ? new Date(scheduledTime).getTime() : null
            });

            clearInterval(timer);
            setUploadProgress(100);
            setUploadResult(result);

            if (result.success) {
                setVideoPath(null);
                setCaption('');
                setScheduledTime('');
            }
        } catch (err) {
            clearInterval(timer);
            setUploadResult({ success: false, error: err.message });
        }
        setUploading(false);
    };

    if (loading) {
        return (
            <div className="facebook-integration">
                <h2>📘 Integrasi Facebook</h2>
                <div className="loading">Memuat...</div>
            </div>
        );
    }

    // Tampilkan setup jika App ID belum diset
    if (!setupDone) {
        return <FacebookSetup onSetupComplete={handleSetupComplete} />;
    }

    return (
        <div className="facebook-integration">
            <h2>📘 Integrasi Facebook</h2>

            {/* App ID info bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', padding: '8px 14px',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: 10, marginBottom: 16, fontSize: 12 }}>
                <span style={{ color: '#555' }}>
                    App ID: <span style={{ color: '#aaa', fontFamily: 'monospace' }}>
                        {appId}
                    </span>
                </span>
                <button onClick={resetSetup}
                        style={{ background: 'none', border: 'none', color: '#555',
                                 cursor: 'pointer', fontSize: 12,
                                 textDecoration: 'underline' }}>
                    Ganti App ID
                </button>
            </div>

            {error && (
                <div style={{ background: 'rgba(255,70,70,0.15)',
                              border: '1px solid rgba(255,70,70,0.4)',
                              borderRadius: 10, padding: '12px 16px',
                              marginBottom: 16, color: '#ff6b6b', fontSize: 13 }}>
                    ⚠️ {error}
                    <button onClick={() => setError(null)}
                            style={{ float: 'right', background: 'none', border: 'none',
                                     color: '#ff6b6b', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
            )}

            {!isLoggedIn ? (
                <div className="login-section">
                    <div className="info-box" style={{ marginBottom: 24 }}>
                        <h4>🔐 Login Diperlukan</h4>
                        <p style={{ color: '#ccc', fontSize: 13, marginTop: 8 }}>
                            Login untuk menghubungkan Facebook Page dan mengupload
                            video langsung dari Drama Tool.
                        </p>
                    </div>
                    <button onClick={login} className="btn-facebook" disabled={loading}>
                        🔐 Login dengan Facebook
                    </button>
                    <p className="hint" style={{ marginTop: 12 }}>
                        Popup browser akan terbuka untuk login Facebook secara aman.
                    </p>
                </div>
            ) : (
                <div className="upload-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                                  alignItems: 'center', marginBottom: 20 }}>
                        <div style={{ color: '#4ecdc4', fontSize: 13 }}>
                            ✅ Terhubung ke Facebook
                            {user && <span style={{ color: '#aaa', marginLeft: 8 }}>
                                ({user.name})
                            </span>}
                        </div>
                        <button onClick={logout} className="btn-secondary"
                                style={{ padding: '6px 12px', fontSize: 12 }}>
                            Logout
                        </button>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label>Pilih Facebook Page:</label>
                        {pages.length === 0 ? (
                            <div className="info-box">
                                <p style={{ color: '#aaa', fontSize: 13 }}>
                                    ⚠️ Tidak ada Page ditemukan.{' '}
                                    <button onClick={checkLogin}
                                            style={{ background: 'none', border: 'none',
                                                     color: '#4ecdc4', cursor: 'pointer',
                                                     textDecoration: 'underline', padding: 0 }}>
                                        Refresh
                                    </button>
                                </p>
                            </div>
                        ) : (
                            <select value={selectedPage?.id || ''}
                                    onChange={(e) => setSelectedPage(
                                        pages.find(p => p.id === e.target.value))}>
                                {pages.map(page => (
                                    <option key={page.id} value={page.id}>
                                        {page.name}
                                        {page.fanCount > 0 &&
                                            ` (${page.fanCount.toLocaleString()} followers)`}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div {...getRootProps()} className="mini-dropzone">
                        <input {...getInputProps()} />
                        {isDragActive ? <p>Lepaskan video...</p>
                                      : <p>📹 Drag & drop video untuk upload</p>}
                    </div>

                    {videoPath && (
                        <p className="selected-file">
                            ✅ {videoPath.split('\\').pop()}
                            <button onClick={() => setVideoPath(null)}
                                    style={{ marginLeft: 8, background: 'none', border: 'none',
                                             color: '#ff6b6b', cursor: 'pointer' }}>✕</button>
                        </p>
                    )}

                    <textarea placeholder="Caption untuk video... (opsional)"
                              value={caption} onChange={(e) => setCaption(e.target.value)}
                              rows={3} style={{ marginTop: 12 }} />

                    <div className="form-group">
                        <label>Jadwal Upload (opsional):</label>
                        <input type="datetime-local" value={scheduledTime}
                               onChange={(e) => setScheduledTime(e.target.value)}
                               min={new Date(Date.now() + 10 * 60 * 1000)
                                   .toISOString().slice(0, 16)} />
                        <p className="hint">Kosongkan untuk publish sekarang</p>
                    </div>

                    {uploading && (
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)',
                                          borderRadius: 4, height: 6, overflow: 'hidden' }}>
                                <div style={{ width: `${uploadProgress}%`, height: '100%',
                                              background: 'linear-gradient(90deg,#4ecdc4,#ff6b6b)',
                                              borderRadius: 4, transition: 'width 0.5s ease' }} />
                            </div>
                            <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
                                Mengupload... {uploadProgress}%
                            </p>
                        </div>
                    )}

                    <button onClick={uploadReel}
                            disabled={uploading || !videoPath || pages.length === 0}
                            className="btn-primary"
                            style={{ width: '100%', padding: '12px 0',
                                     fontSize: 15, marginBottom: 16 }}>
                        {uploading ? `⏳ ${uploadProgress}%`
                            : scheduledTime ? '📅 Jadwalkan Upload'
                            : '📤 Upload ke Facebook Sekarang'}
                    </button>

                    {uploadResult && (
                        <div style={{
                            background: uploadResult.success
                                ? 'rgba(78,205,196,0.1)' : 'rgba(255,70,70,0.1)',
                            border: `1px solid ${uploadResult.success
                                ? 'rgba(78,205,196,0.4)' : 'rgba(255,70,70,0.4)'}`,
                            borderRadius: 10, padding: 16 }}>
                            {uploadResult.success ? (
                                <>
                                    <h4 style={{ color: '#4ecdc4', marginBottom: 8 }}>
                                        ✅ Upload Berhasil!
                                    </h4>
                                    {uploadResult.url && (
                                        <button onClick={() =>
                                                window.electron.openExternal(uploadResult.url)}
                                                style={{ background: '#1877f2', color: 'white',
                                                         border: 'none', borderRadius: 8,
                                                         padding: '8px 16px', cursor: 'pointer',
                                                         fontSize: 13 }}>
                                            🔗 Lihat di Facebook
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <h4 style={{ color: '#ff6b6b', marginBottom: 8 }}>
                                        ❌ Upload Gagal
                                    </h4>
                                    <p style={{ fontSize: 13, color: '#aaa' }}>
                                        {uploadResult.error}
                                    </p>
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
