import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const AffiliateIntegration = () => {
    const [videoPath, setVideoPath] = useState(null);
    const [detectedProducts, setDetectedProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [affiliateLinks, setAffiliateLinks] = useState([]);
    const [loading, setLoading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setVideoPath(file.path);
            setLoading(true);
            const result = await window.electron.affiliateDetectProducts(file.path);
            setDetectedProducts(result.products);
            setLoading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv'] }
    });

    const generateAffiliateLink = async (product, platform) => {
        const result = await window.electron.affiliateGenerateLink({
            productId: product.id || product.name,
            platform
        });
        setAffiliateLinks([...affiliateLinks, { ...product, link: result.link, commission: result.commission, platform }]);
    };

    const copyLink = (link) => {
        navigator.clipboard.writeText(link);
        alert('Link disalin!');
    };

    const platforms = [
        { name: 'Shopee', icon: '🛍️', color: '#ee4d2d' },
        { name: 'Tokopedia', icon: '🛒', color: '#42b549' },
        { name: 'Lazada', icon: '📦', color: '#0f1461' },
        { name: 'Blibli', icon: '🔵', color: '#3b75c4' }
    ];

    return (
        <div className="affiliate-integration">
            <h2>🛍️ Shopee/Affiliate Integration</h2>
            
            {!videoPath ? (
                <div {...getRootProps()} className="dropzone">
                    <input {...getInputProps()} />
                    {isDragActive ? <p>Lepaskan file video di sini...</p> : <p>Upload video untuk deteksi produk</p>}
                </div>
            ) : (
                <div className="affiliate-container">
                    {loading ? (
                        <div className="loading">Mendeteksi produk dalam video...</div>
                    ) : (
                        <>
                            <div className="detected-products">
                                <h3>🔍 Produk Terdeteksi</h3>
                                <div className="products-grid">
                                    {detectedProducts.map((product, i) => (
                                        <div key={i} className={`product-card ${selectedProduct === product ? 'selected' : ''}`} onClick={() => setSelectedProduct(product)}>
                                            <div className="product-icon">👗</div>
                                            <div className="product-name">{product.name}</div>
                                            <div className="product-confidence">Confidence: {product.confidence}%</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {selectedProduct && (
                                <div className="affiliate-actions">
                                    <h3>🔗 Generate Link Afiliasi</h3>
                                    <div className="platform-buttons">
                                        {platforms.map((platform) => (
                                            <button key={platform.name} onClick={() => generateAffiliateLink(selectedProduct, platform.name.toLowerCase())} style={{ background: platform.color }}>
                                                {platform.icon} {platform.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {affiliateLinks.length > 0 && (
                                <div className="affiliate-links">
                                    <h3>📋 Link Afiliasi Tergenerate</h3>
                                    {affiliateLinks.map((link, i) => (
                                        <div key={i} className="link-item">
                                            <div className="link-info">
                                                <span>{link.icon} {link.platform}</span>
                                                <span>{link.name}</span>
                                                <span className="commission">Komisi: {(link.commission * 100)}%</span>
                                            </div>
                                            <div className="link-actions">
                                                <input type="text" readOnly value={link.link} />
                                                <button onClick={() => copyLink(link.link)}>Copy</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    
                    <button onClick={() => setVideoPath(null)} className="btn-secondary">Upload Video Lain</button>
                </div>
            )}
            
            <div className="info-box">
                <h4>💡 Tips Monetisasi dengan Afiliasi</h4>
                <ul>
                    <li>🛍️ Tempelkan link produk di pinned comment</li>
                    <li>🎯 Rekomendasikan produk yang relevan dengan scene</li>
                    <li>📊 Pantau klik dan konversi di dashboard</li>
                    <li>💰 Drama China cocok untuk fashion, skincare, aksesoris</li>
                </ul>
            </div>
        </div>
    );
};

export default AffiliateIntegration;
