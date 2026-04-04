import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const AssetManager = () => {
    const [assets, setAssets] = useState([]);
    const [filter, setFilter] = useState({ category: '', search: '' });
    const [selectedAsset, setSelectedAsset] = useState(null);

    useEffect(() => {
        loadAssets();
    }, [filter]);

    const loadAssets = async () => {
        const assetList = await window.electron.assetList(filter);
        setAssets(assetList);
    };

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            const category = prompt('Masukkan kategori (video/thumbnail/audio/watermark):', 'video');
            const tags = prompt('Masukkan tags (pisahkan dengan koma):', 'drama,china');
            await window.electron.assetAdd({
                filePath: file.path,
                tags: tags.split(',').map(t => t.trim()),
                category
            });
            loadAssets();
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 
            'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
            'image/*': ['.png', '.jpg', '.jpeg', '.ico'],
            'audio/*': ['.mp3', '.wav', '.ogg']
        }
    });

    const deleteAsset = async (assetId) => {
        if (confirm('Hapus asset ini?')) {
            await window.electron.assetDelete(assetId);
            loadAssets();
        }
    };

    const getCategoryIcon = (category) => {
        const icons = {
            video: '🎬',
            thumbnail: '🖼️',
            audio: '🎵',
            watermark: '💧'
        };
        return icons[category] || '📁';
    };

    return (
        <div className="asset-manager">
            <h2>🗂️ Manajemen Aset</h2>
            
            <div {...getRootProps()} className="dropzone-small">
                <input {...getInputProps()} />
                {isDragActive ? <p>Lepaskan file di sini...</p> : <p>📁 Drag & drop file untuk menambah aset</p>}
            </div>
            
            <div className="filters">
                <input 
                    type="text" 
                    placeholder="Cari aset..."
                    value={filter.search}
                    onChange={(e) => setFilter({...filter, search: e.target.value})}
                />
                <select value={filter.category} onChange={(e) => setFilter({...filter, category: e.target.value})}>
                    <option value="">Semua Kategori</option>
                    <option value="video">Video</option>
                    <option value="thumbnail">Thumbnail</option>
                    <option value="audio">Audio</option>
                    <option value="watermark">Watermark</option>
                </select>
            </div>
            
            <div className="assets-grid">
                {assets.map((asset) => (
                    <div key={asset.id} className={`asset-card ${selectedAsset?.id === asset.id ? 'selected' : ''}`} onClick={() => setSelectedAsset(asset)}>
                        <div className="asset-icon">{getCategoryIcon(asset.category)}</div>
                        <div className="asset-name">{asset.name}</div>
                        <div className="asset-tags">
                            {asset.tags?.slice(0, 3).map((tag, i) => (
                                <span key={i} className="asset-tag">{tag}</span>
                            ))}
                        </div>
                        <button className="btn-small" onClick={(e) => { e.stopPropagation(); deleteAsset(asset.id); }}>Hapus</button>
                    </div>
                ))}
            </div>
            
            {selectedAsset && (
                <div className="asset-preview">
                    <h3>Preview: {selectedAsset.name}</h3>
                    {selectedAsset.category === 'video' && (
                        <video src={`file://${selectedAsset.path}`} controls style={{ width: '100%', maxHeight: '300px' }} />
                    )}
                    {selectedAsset.category === 'thumbnail' && (
                        <img src={`file://${selectedAsset.path}`} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px' }} />
                    )}
                    {selectedAsset.category === 'audio' && (
                        <audio src={`file://${selectedAsset.path}`} controls style={{ width: '100%' }} />
                    )}
                    <div className="asset-details">
                        <p><strong>Path:</strong> {selectedAsset.path}</p>
                        <p><strong>Tags:</strong> {selectedAsset.tags?.join(', ')}</p>
                        <p><strong>Created:</strong> {new Date(selectedAsset.createdAt).toLocaleString()}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetManager;
