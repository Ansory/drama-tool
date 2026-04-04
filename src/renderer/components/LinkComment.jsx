import React, { useState, useEffect } from 'react';

const LinkComment = () => {
    const [posts, setPosts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);
    const [longVideoUrl, setLongVideoUrl] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [pinComment, setPinComment] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadRecentPosts();
    }, []);

    const loadRecentPosts = async () => {
        // Load recent posts from Facebook
        const recentPosts = await window.electron.getRecentPosts();
        setPosts(recentPosts);
    };

    const addLinkComment = async () => {
        if (!selectedPost || !longVideoUrl) {
            alert('Pilih postingan dan masukkan link video panjang');
            return;
        }
        
        setProcessing(true);
        const result = await window.electron.linkAutoComment({
            postId: selectedPost.id,
            longVideoUrl,
            customMessage,
            pinComment
        });
        
        if (result.success) {
            alert('Link berhasil ditambahkan ke komentar!');
            setLongVideoUrl('');
            setCustomMessage('');
        }
        setProcessing(false);
    };

    const templates = [
        { name: 'Default', message: '📺 Full episode: [LINK]' },
        { name: 'Ramah', message: 'Mau nonton full episodenya? Klik di sini ya 👇\n[LINK]' },
        { name: 'Teaser', message: 'Penasaran lanjutannya? Full episode cuma di sini:\n[LINK]' },
        { name: 'Emoji', message: '🎬 FULL EPISODE 🎬\nJangan sampai ketinggalan! 👇\n[LINK]' }
    ];

    const applyTemplate = (template) => {
        setCustomMessage(template.message);
    };

    return (
        <div className="link-comment">
            <h2>🔗 Auto Semat Link Video Panjang</h2>
            
            <div className="post-selection">
                <h3>📌 Pilih Postingan Reels</h3>
                <div className="posts-list">
                    {posts.map(post => (
                        <div key={post.id} className={`post-card ${selectedPost?.id === post.id ? 'selected' : ''}`} onClick={() => setSelectedPost(post)}>
                            <div className="post-thumb">🎬</div>
                            <div className="post-info">
                                <div className="post-caption">{post.caption?.substring(0, 50)}...</div>
                                <div className="post-stats">❤️ {post.likes} | 💬 {post.comments}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="link-settings">
                <h3>🔗 Pengaturan Link</h3>
                <div className="form-group">
                    <label>URL Video Panjang (Full Episode):</label>
                    <input type="url" placeholder="https://facebook.com/.../video/123456789" value={longVideoUrl} onChange={(e) => setLongVideoUrl(e.target.value)} />
                </div>
                
                <div className="form-group">
                    <label>Template Pesan:</label>
                    <div className="template-buttons">
                        {templates.map((template, i) => (
                            <button key={i} className="btn-small" onClick={() => applyTemplate(template)}>
                                {template.name}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="form-group">
                    <label>Custom Message:</label>
                    <textarea 
                        value={customMessage} 
                        onChange={(e) => setCustomMessage(e.target.value)}
                        rows={4}
                        placeholder="Tulis pesan komentar di sini. Gunakan [LINK] sebagai placeholder untuk URL video panjang"
                    />
                </div>
                
                <div className="form-group">
                    <label className="checkbox">
                        <input type="checkbox" checked={pinComment} onChange={(e) => setPinComment(e.target.checked)} />
                        Pin komentar (jadikan komentar teratas)
                    </label>
                </div>
                
                <button onClick={addLinkComment} disabled={processing} className="btn-primary">
                    {processing ? 'Memproses...' : '📤 Tambahkan Link ke Komentar'}
                </button>
            </div>
            
            <div className="preview-box">
                <h3>👁️ Preview Komentar</h3>
                <div className="preview-comment">
                    {customMessage.replace('[LINK]', longVideoUrl || '[LINK AKAN MUNCUL DISINI]')}
                </div>
            </div>
            
            <div className="info-box">
                <h4>💡 Manfaat Strategi Ini</h4>
                <ul>
                    <li>📈 Meningkatkan views video panjang (full episode)</li>
                    <li>💬 Meningkatkan engagement (banyak komen "SUDAH" / "BELUM")</li>
                    <li>🎯 Membangun audiens loyal yang tahu di mana cari full episode</li>
                    <li>🔥 Algoritma Facebook menyukai interaksi positif</li>
                </ul>
            </div>
        </div>
    );
};

export default LinkComment;
