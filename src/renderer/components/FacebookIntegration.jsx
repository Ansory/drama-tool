import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const FacebookIntegration = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [pages, setPages] = useState([]);
    const [selectedPage, setSelectedPage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [videoPath, setVideoPath] = useState(null);
    const [caption, setCaption] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [uploadResult, setUploadResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkLogin();
    }, []);

    // FIX: Pakai electron store (bukan localStorage) agar konsisten dan tidak ghost-login
    const checkLogin = async () => {
        setLoading(true);
        try {
            const loggedIn = await window.electron.getStore('fb_logged_in');
            if (loggedIn === true) {
                setIsLoggedIn(true);
                await loadPages();
            } else {
                setIsLoggedIn(false);
            }
        } catch {
            setIsLoggedIn(false);
        }
        setLoading(false);
    };

    const login = async () => {
        const result = await window.electron.facebookLogin();
        if (result.success) {
            // FIX: Simpan status login ke electron store, bukan localStorage
            await window.electron.setStore('fb_logged_in', true);
            setIsLoggedIn(true);
            if (result.pages && result.pages.length > 0) {
                setPages(result.pages);
                setSelectedPage(result.pages[0]);
            } else {
                await loadPages();
            }
        } else {
            alert('Login gagal: ' + (result.error || 'Silakan coba lagi'));
        }
    };

    const logout = async () => {
        if (!confirm('Logout dari Facebook?')) return;
        await window.electron.setStore('fb_logged_in', false);
        await window.electron.setStore('fb_pages', []);
        setIsLoggedIn(false);
        setPages([]);
        setSelectedPage(null);
        setUploadResult(null);
        setVideoPath(null);
    };

    const loadPages = async () => {
        const pagesData = await window.electron.getPages();
        setPages(pagesData || []);
        if (pagesData && pagesData.length > 0) {
            setSelectedPage(pagesData[0]);
        }
    };

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) setVideoPath(file.path);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv'] }
    });

    const uploadReel = async () => {
        if (!videoPath) {
            alert('Pilih video terlebih dahulu');
            return;
        }
        if (!selectedPage) {
            alert('Pilih Facebook Page terlebih dahulu');
            return;
        }
        setUploading(true);
        const result = await window.electron.facebookUploadReel({
            videoPath,
            pageId: selectedPage.id,
            caption,
            scheduledTime: scheduledTime ? new Date(scheduledTime).getTime() : null
        });
        setUploadResult(result);
        setUploading(false);
    };

    // Loading state saat cek login
    if (loading) {
        return (
            <div className="facebook-integration">
                <h2>📘 Integrasi Facebook</h2>
                <div className="loading">Memeriksa status login...</div>
            </div>
        );
    }

    return (
        <div className="facebook-integration">
            <h2>📘 Integrasi Facebook</h2>

            {!isLoggedIn ? (
                // Tampilkan login screen jika belum login
                <div className="login-section">
                    <div className="info-box" style={{ marginBottom: 24 }}>
                        <h4>🔐 Login Diperlukan</h4>
                        <p style={{ color: '#ccc', fontSize: 13, marginTop: 8 }}>
                            Login untuk menghubungkan Facebook Page dan mengupload video langsung dari Drama Tool.
                        </p>
                    </div>
                    <button onClick={login} className="btn-facebook">
                        🔐 Login dengan Facebook
                    </button>
                    <p className="hint" style={{ marginTop: 12 }}>
                        Login aman — token disimpan lokal di perangkat Anda
                    </p>
                </div>
            ) : (
                // Upload section setelah login
                <div className="upload-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div className="login-status" style={{ color: '#4ecdc4', fontSize: 13 }}>
                            ✅ Terhubung ke Facebook
                        </div>
                        <button onClick={logout} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                            Logout
                        </button>
                    </div>

                    <div className="page-selector">
                        <label>Pilih Facebook Page:</label>
                        {pages.length === 0 ? (
                            <div className="info-box">
                                <p style={{ color: '#aaa', fontSize: 13 }}>
                                    Tidak ada Page ditemukan. Pastikan akun Facebook Anda memiliki Page yang dikelola.
                                </p>
                            </div>
                        ) : (
                            <select
                                value={selectedPage?.id || ''}
                                onChange={(e) => setSelectedPage(pages.find(p => p.id === e.target.value))}
                            >
                                {pages.map(page => (
                                    <option key={page.id} value={page.id}>{page.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div {...getRootProps()} className="mini-dropzone">
                        <input {...getInputProps()} />
                        {isDragActive
                            ? <p>Lepaskan video di sini...</p>
                            : <p>📹 Drag & drop video untuk upload</p>
                        }
                    </div>
                    {videoPath && (
                        <p className="selected-file">
                            ✅ Video: {videoPath.split('\\').pop()}
                        </p>
                    )}

                    <textarea
                        placeholder="Caption untuk video..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        rows={3}
                    />

                    <div className="form-group">
                        <label>Jadwal Upload (opsional):</label>
                        <input
                            type="datetime-local"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={uploadReel}
                        disabled={uploading || !videoPath || pages.length === 0}
                        className="btn-primary"
                    >
                        {uploading ? '⏳ Uploading...' : '📤 Upload ke Facebook'}
                    </button>

                    {uploadResult && (
                        <div className={`info-box`} style={{ marginTop: 16, borderColor: uploadResult.success ? '#4ecdc4' : '#ff4444' }}>
                            {uploadResult.success ? (
                                <>
                                    <h4>✅ Upload Berhasil!</h4>
                                    <p>Post ID: {uploadResult.postId}</p>
                                    {uploadResult.url && (
                                        <a
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); window.electron.openExternal(uploadResult.url); }}
                                            style={{ color: '#4ecdc4', fontSize: 13 }}
                                        >
                                            Lihat Postingan →
                                        </a>
                                    )}
                                </>
                            ) : (
                                <>
                                    <h4 style={{ color: '#ff4444' }}>❌ Upload Gagal</h4>
                                    <p style={{ color: '#aaa', fontSize: 13 }}>{uploadResult.error}</p>
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
