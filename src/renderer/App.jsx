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
import CopyrightChecker from './components/CopyrightChecker';
import RightsManager from './components/RightsManager';
import AntiStrike from './components/AntiStrike';
import InfringementResponse from './components/InfringementResponse';
import BackupRestore from './components/BackupRestore';
import Scheduler from './components/Scheduler';
import TeamCollab from './components/TeamCollab';
import ExportShare from './components/ExportShare';
import AssetManager from './components/AssetManager';
import AudienceAnalytics from './components/AudienceAnalytics';
import AutoReplyComment from './components/AutoReplyComment';
import LinkComment from './components/LinkComment';
import SocialListening from './components/SocialListening';
import AffiliateIntegration from './components/AffiliateIntegration';
import ProfitTracker from './components/ProfitTracker';
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
        // Hak Cipta & Keamanan (Modul 16-20)
{ id: 'copyright', name: '⚖️ Copyright Checker', category: 'Security', component: CopyrightChecker },
{ id: 'rights', name: '🔒 Rights Manager', category: 'Security', component: RightsManager },
{ id: 'antistrike', name: '🛡️ Anti Strike', category: 'Security', component: AntiStrike },
{ id: 'infringement', name: '📜 Infringement Response', category: 'Security', component: InfringementResponse },
{ id: 'backup', name: '💾 Backup & Restore', category: 'Security', component: BackupRestore },
// Manajemen & Kolaborasi (Modul 21-25)
{ id: 'scheduler', name: '📅 Scheduler', category: 'Management', component: Scheduler },
{ id: 'team', name: '👥 Team Collab', category: 'Management', component: TeamCollab },
{ id: 'export', name: '📤 Export & Share', category: 'Management', component: ExportShare },
{ id: 'asset', name: '🗂️ Asset Manager', category: 'Management', component: AssetManager },
{ id: 'audience', name: '📊 Audience Analytics', category: 'Management', component: AudienceAnalytics },
    // Social Engagement (Modul 26-28)
{ id: 'autoreply', name: '💬 Auto Reply Comment', category: 'Social', component: AutoReplyComment },
{ id: 'linkcomment', name: '🔗 Link Comment', category: 'Social', component: LinkComment },
{ id: 'sociallistening', name: '👂 Social Listening', category: 'Social', component: SocialListening },
// Monetisasi (Modul 29-30)
{ id: 'affiliate', name: '🛍️ Affiliate Integration', category: 'Monetization', component: AffiliateIntegration },
{ id: 'profit', name: '💰 Profit Tracker', category: 'Monetization', component: ProfitTracker },
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || VideoEditor;

    // Group tabs by category for sidebar
    const coreTabs = tabs.filter(t => t.category === 'Core');
    const planningTabs = tabs.filter(t => t.category === 'Planning');
    const securityTabs = tabs.filter(t => t.category === 'Security');
const managementTabs = tabs.filter(t => t.category === 'Management');

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
        <div className="nav-category">
    <div className="category-title">🛡️ HAK CIPTA & KEAMANAN</div>
    {securityTabs.map(tab => (...))}
</div>
    
<div className="nav-category">
    <div className="category-title">🤝 MANAJEMEN & KOLABORASI</div>
    {managementTabs.map(tab => (...))}
</div>
    );
}
    
    <div className="nav-category">
    <div className="category-title">💬 SOCIAL ENGAGEMENT</div>
    {socialTabs.map(tab => (...))}
</div>
<div className="nav-category">
    <div className="category-title">💰 MONETISASI</div>
    {monetizationTabs.map(tab => (...))}
</div>

export default App;
