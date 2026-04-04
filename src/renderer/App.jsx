import React, { useState } from 'react';
import VideoEditor from './components/VideoEditor';
import WatermarkInpainting from './components/WatermarkInpainting';
import SubtitleRemover from './components/SubtitleRemover';
import ThumbnailGenerator from './components/ThumbnailGenerator';
import VideoSplitter from './components/VideoSplitter';
import ContentPlanner from './components/ContentPlanner';
import FYPredictor from './components/FYPredictor';
import AudioManager from './components/AudioManager';
import HashtagAnalytics from './components/HashtagAnalytics';
import ViralAlert from './components/ViralAlert';
import './App.css';

function App() {
    const [activeTab, setActiveTab] = useState('editor');

    const tabs = [
        // Core Video Editing (Modul 1-5)
        { id: 'editor', name: '🎬 Video Editor', category: 'Core', component: VideoEditor },
        { id: 'watermark', name: '💧 Watermark', category: 'Core', component: WatermarkInpainting },
        { id: 'subtitle', name: '🗑️ Subtitle Remover', category: 'Core', component: SubtitleRemover },
        { id: 'thumbnail', name: '🖼️ Thumbnail', category: 'Core', component: ThumbnailGenerator },
        { id: 'splitter', name: '✂️ Video Splitter', category: 'Core', component: VideoSplitter },
        // Planning & Optimasi (Modul 6-10)
        { id: 'planner', name: '📅 Content Planner', category: 'Planning', component: ContentPlanner },
        { id: 'fyp', name: '📈 FYP Predictor', category: 'Planning', component: FYPredictor },
        { id: 'audio', name: '🎵 Audio Manager', category: 'Planning', component: AudioManager },
        { id: 'hashtag', name: '🔖 Hashtag Analytics', category: 'Planning', component: HashtagAnalytics },
        { id: 'viral', name: '🚨 Viral Alert', category: 'Planning', component: ViralAlert }
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || VideoEditor;

    // Group tabs by category for sidebar
    const coreTabs = tabs.filter(t => t.category === 'Core');
    const planningTabs = tabs.filter(t => t.category === 'Planning');

    return (
        <div className="app">
            <div className="sidebar">
                <div className="logo">
                    <h1>🎬 DRAMA TOOL</h1>
                    <p>Video Generator</p>
                </div>
                
                <div className="nav-category">
                    <div className="category-title">🎬 CORE VIDEO EDITING</div>
                    {coreTabs.map(tab => (
                        <div key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            {tab.name}
                        </div>
                    ))}
                </div>
                
                <div className="nav-category">
                    <div className="category-title">📈 PLANNING & OPTIMASI</div>
                    {planningTabs.map(tab => (
                        <div key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            {tab.name}
                        </div>
                    ))}
                </div>
            </div>
            <div className="main-content">
                <ActiveComponent />
            </div>
        </div>
    );
}

export default App;
