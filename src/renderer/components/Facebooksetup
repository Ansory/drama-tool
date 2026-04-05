import React, { useState, useEffect } from 'react';

/**
 * FacebookSetup - halaman untuk user input App ID Facebook mereka sendiri
 * Muncul sebelum halaman Facebook Integration jika App ID belum diset
 */
const FacebookSetup = ({ onSetupComplete }) => {
    const [appId, setAppId]     = useState('');
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState('');
    const [step, setStep]       = useState(1); // 1=intro, 2=input, 3=done

    useEffect(() => {
        loadSavedAppId();
    }, []);

    const loadSavedAppId = async () => {
        const saved = await window.electron.getStore('fb_app_id');
        if (saved) setAppId(saved);
    };

    const handleSave = async () => {
        if (!appId || appId.trim().length < 10) {
            setError('App ID tidak valid. App ID biasanya 15-16 digit angka.');
            return;
        }
        if (!/^\d+$/.test(appId.trim())) {
            setError('App ID hanya berisi angka.');
            return;
        }

        setSaving(true);
        setError('');

        await window.electron.setStore('fb_app_id', appId.trim());
        await window.electron.setStore('fb_setup_done', true);

        setTimeout(() => {
            setSaving(false);
            onSetupComplete(appId.trim());
        }, 800);
    };

    return (
        <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
            <h2>📘 Setup Integrasi Facebook</h2>
            <p style={{ color: '#aaa', fontSize: 14, marginBottom: 24 }}>
                Untuk mengupload video ke Facebook, kamu perlu membuat Facebook App
                sendiri. Ini gratis dan hanya perlu dilakukan sekali.
            </p>

            {/* Step indicator */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
                {[1, 2, 3].map(s => (
                    <div key={s} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: s <= step
                            ? 'linear-gradient(90deg, #ff6b6b, #4ecdc4)'
                            : 'rgba(255,255,255,0.1)',
                        transition: 'background 0.3s'
                    }} />
                ))}
            </div>

            {step === 1 && (
                <div>
                    <h3>Langkah 1 — Buat Facebook App</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12,
                                  margin: '20px 0' }}>
                        {[
                            { num: 1, text: 'Buka', link: 'https://developers.facebook.com/apps',
                              linkText: 'developers.facebook.com/apps' },
                            { num: 2, text: 'Klik "Create App" → pilih "Business" → Next' },
                            { num: 3, text: 'Isi App Name: "Drama Tool [nama kamu]" → Create App' },
                            { num: 4, text: 'Di dashboard → "Add Product" → cari "Facebook Login" → Set Up' },
                            { num: 5, text: 'Pilih "Web" → Site URL: https://localhost → Save' },
                            { num: 6, text: 'Menu kiri: Facebook Login → Settings' },
                            { num: 7, text: 'Valid OAuth Redirect URIs: tambah https://localhost/callback → Save' },
                            { num: 8, text: 'Toggle App ke "Live Mode" (Settings → Basic)' },
                            { num: 9, text: 'Salin App ID dari Settings → Basic' },
                        ].map(item => (
                            <div key={item.num} style={{
                                display: 'flex', gap: 12, alignItems: 'flex-start',
                                padding: '10px 14px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.06)'
                            }}>
                                <span style={{
                                    background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
                                    borderRadius: '50%', width: 24, height: 24,
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: 12,
                                    fontWeight: 700, flexShrink: 0
                                }}>{item.num}</span>
                                <span style={{ fontSize: 13, color: '#ccc', lineHeight: 1.5 }}>
                                    {item.text}
                                    {item.link && (
                                        <button
                                            onClick={() => window.electron.openExternal(item.link)}
                                            style={{ background: 'none', border: 'none',
                                                     color: '#4ecdc4', cursor: 'pointer',
                                                     textDecoration: 'underline',
                                                     fontSize: 13, padding: '0 4px' }}
                                        >
                                            {item.linkText}
                                        </button>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="info-box">
                        <h4>💡 Kenapa harus App sendiri?</h4>
                        <p style={{ fontSize: 13, color: '#ccc', marginTop: 8 }}>
                            Dengan App sendiri, token Facebook kamu hanya tersimpan di perangkatmu
                            sendiri — tidak ada pihak lain (termasuk pembuat Drama Tool) yang
                            bisa akses akun Facebook kamu. Lebih aman!
                        </p>
                    </div>

                    <button onClick={() => setStep(2)} className="btn-primary"
                            style={{ marginTop: 20, width: '100%', padding: '12px 0' }}>
                        Lanjut → Masukkan App ID
                    </button>
                </div>
            )}

            {step === 2 && (
                <div>
                    <h3>Langkah 2 — Masukkan App ID</h3>
                    <p style={{ color: '#aaa', fontSize: 13, marginBottom: 20 }}>
                        App ID ada di halaman <strong>Settings → Basic</strong> di
                        Meta Developer Console. Formatnya 15-16 digit angka.
                    </p>

                    <label style={{ display: 'block', fontSize: 13, color: '#aaa',
                                    marginBottom: 8 }}>
                        Facebook App ID:
                    </label>
                    <input
                        type="text"
                        value={appId}
                        onChange={(e) => {
                            setAppId(e.target.value.replace(/\D/g, ''));
                            setError('');
                        }}
                        placeholder="1234567890123456"
                        maxLength={20}
                        style={{ fontFamily: 'monospace', fontSize: 16,
                                 letterSpacing: 1, marginBottom: 8 }}
                        autoFocus
                    />

                    {error && (
                        <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>
                            ⚠️ {error}
                        </p>
                    )}

                    <div className="info-box" style={{ marginBottom: 20 }}>
                        <h4>🔒 App ID aman untuk di-input di sini</h4>
                        <p style={{ fontSize: 13, color: '#ccc', marginTop: 6 }}>
                            App ID bukan secret — ini hanya identifier publik. Yang rahasia
                            adalah App Secret, dan itu <strong>tidak</strong> diminta di sini.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setStep(1)} className="btn-secondary"
                                style={{ flex: 1, padding: '12px 0' }}>
                            ← Kembali
                        </button>
                        <button onClick={handleSave} className="btn-primary"
                                disabled={saving || appId.length < 10}
                                style={{ flex: 2, padding: '12px 0' }}>
                            {saving ? '✅ Menyimpan...' : '💾 Simpan & Lanjutkan'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacebookSetup;
