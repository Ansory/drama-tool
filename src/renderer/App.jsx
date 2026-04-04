import React, { useState } from 'react';
import VideoEditor from './components/VideoEditor';
import WatermarkInpainting from './components/WatermarkInpainting';
import SubtitleRemover from './components/SubtitleRemover';
import ThumbnailGenerator from './components/ThumbnailGenerator';
import VideoSplitter from './components/VideoSplitter';
import './App.css';

function App() {
    const [activeTab, setActiveTab] = useState('editor');

    const tabs = [
        { id: 'editor', name: '🎬 Video Editor', component: VideoEditor },
        { id: 'watermark', name: '💧 Watermark', component: WatermarkInpainting },
        { id: 'subtitle', name: '🗑️ Subtitle Remover', component: SubtitleRemover },
        { id: 'thumbnail', name: '🖼️ Thumbnail', component: ThumbnailGenerator },
        { id: 'splitter', name: '✂️ Video Splitter', component: VideoSplitter }
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || VideoEditor;

    return (
        <div className="app">
            <div className="sidebar">
                <div className="logo">
                    <h1>🎬 DRAMA TOOL</h1>
                    <p>Video Generator</p>
                </div>
                <nav>
                    {tabs.map(tab => (
                        <div key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            {tab.name}
                        </div>
                    ))}
                </nav>
            </div>
            <div className="main-content">
                <ActiveComponent />
            </div>
        </div>
    );
}

export default App;
