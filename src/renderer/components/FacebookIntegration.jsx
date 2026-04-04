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

    useEffect(() => {
        checkLogin();
    }, []);

    const checkLogin = async () => {
        const loggedIn = localStorage.getItem('fb_logged_in') === 'true';
        setIsLoggedIn(loggedIn);
        if (loggedIn) {
            loadPages();
        }
    };

    const login = async () => {
        const result = await window.electron.facebookLogin();
        if (result.success) {
            setIsLoggedIn(true);
            setPages(result.pages);
            localStorage.setItem('fb_logged_in', 'true');
        }
    };

    const loadPages = async () => {
        const pagesData = await window.electron.getPages();
        setPages(pagesData);
        if (pagesData.length > 0) {
            setSelectedPage(pagesData[0]);
        }
    };

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

    const uploadReel = async () => {
        if (!videoPath || !selectedPage) {
            alert('Pilih video dan page terlebih dahulu');
            return;
        }
        setUploading(true);
        const result = await window.electron.facebookUploadReel({
            videoPath,
            caption,
            scheduledTime: scheduledTime ? new Date(scheduledTime).getTime() : null
        });
        setUploadResult(result);
        setUploading(false);
    };

    return (
        <div className="facebook-integration">
            <h2>📘 Integrasi Facebook</h2>
            
            {!isLoggedIn ? (
                <div className="login-section">
                    <button onClick={login} className="btn-facebook">
                        🔐 Login dengan Facebook
                    </button>
                    <p className="hint">Login untuk upload video ke Page Anda</p>
                </div>
            ) : (
                <div className="upload-section">
                    <div className="page-selector">
                        <label>Pilih Facebook Page:</label>
                        <select value={selectedPage?.id} onChange={(e) => setSelectedPage(pages.find(p => p.id === e.target.value))}>
                            {pages.map(page => (
                                <option key={page.id} value={page.id}>{page.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div {...getRootProps()} className="mini-dropzone">
                        <input {...getInputProps()} />
                        {isDragActive ? <p>Lepaskan video di sini...</p> : <p>📹 Drag & drop video untuk upload</p>}
                    </div>
                    {videoPath && <p className="selected-file">Video: {videoPath.split('\\').pop()}</p>}
                    
                    <textarea 
                        placeholder="Caption untuk video..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        rows={3}
                    />
                    
                    <input 
                        type="datetime-local" 
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                    />
                    
                    <button onClick={uploadReel} disabled={uploading} className="btn-primary">
                        {uploading ? 'Uploading...' : '📤 Upload ke Facebook'}
                    </button>
                    
                    {uploadResult && (
                        <div className="upload-result">
                            <h4>✅ Upload Berhasil!</h4>
                            <p>Post ID: {uploadResult.postId}</p>
                            <a href={uploadResult.url} target="_blank">Lihat Postingan</a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FacebookIntegration;
