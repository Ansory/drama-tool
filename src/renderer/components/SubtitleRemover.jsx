import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const SubtitleRemover = () => {
    const [videoPath, setVideoPath] = useState(null);
    const [subtitles, setSubtitles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [algorithm, setAlgorithm] = useState('sttn');

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setVideoPath(file.path);
            // Auto detect subtitle areas
            const detected = await window.electron.subtitleDetect(file.path);
            setSubtitles(detected || []);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv'] }
    });

    const handleRemoveSubtitles = async () => {
        setProcessing(true);
        const outputPath = `${videoPath}_nosubtitle_${Date.now()}.mp4`;
        try {
            await window.electron.subtitleRemove({
                videoPath,
                outputPath,
                subtitleAreas: subtitles,
                algorithm
            });
            alert(`Subtitle berhasil dihapus! Disimpan di: ${outputPath}`);
        } catch (error) {
            alert('Error: ' + error.message);
        }
        setProcessing(false);
    };

    return (
        <div className="subtitle-remover">
            <h2>🗑️ Penghilang Subtitle</h2>
            
            {!videoPath ? (
                <div {...getRootProps()} className="dropzone">
                    <input {...getInputProps()} />
                    {isDragActive ? <p>Lepaskan file video di sini...</p> : <p>Drag & drop video untuk deteksi subtitle</p>}
                </div>
            ) : (
                <div className="video-info">
                    <h3>Video: {videoPath.split('\\').pop()}</h3>
                    
                    <div className="algorithm-select">
                        <h4>Pilih Algoritma:</h4>
                        <label><input type="radio" value="sttn" checked={algorithm === 'sttn'} onChange={() => setAlgorithm('sttn')} /> STTN (Terbaik untuk live action)</label>
                        <label><input type="radio" value="lama" checked={algorithm === 'lama'} onChange={() => setAlgorithm('lama')} /> LAMA (Cepat, untuk animasi)</label>
                        <label><input type="radio" value="propainter" checked={algorithm === 'propainter'} onChange={() => setAlgorithm('propainter')} /> ProPainter (Kualitas tertinggi, lambat)</label>
                    </div>
                    
                    {subtitles.length > 0 && (
                        <div className="detected-subtitles">
                            <h4>📝 Subtitle Terdeteksi:</h4>
                            {subtitles.map((sub, i) => (
                                <div key={i} className="subtitle-item">
                                    Posisi: y={sub.y}, height={sub.height}, duration: {sub.start}s - {sub.end}s
                                </div>
                            ))}
                            <button onClick={handleRemoveSubtitles} disabled={processing}>🗑️ Hapus Subtitle</button>
                        </div>
                    )}
                    
                    {processing && <div className="progress">Processing... Ini bisa memakan waktu beberapa menit</div>}
                    <button onClick={() => setVideoPath(null)} className="btn-secondary">Pilih Video Lain</button>
                </div>
            )}
        </div>
    );
};

export default SubtitleRemover;
