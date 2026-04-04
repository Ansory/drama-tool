import React, { useState } from 'react';

// Core Video Editing (Modul 1-5)
import VideoEditor from './components/VideoEditor';
import WatermarkInpainting from './components/WatermarkInpainting';
import SubtitleRemover from './components/SubtitleRemover';
import ThumbnailGenerator from './components/ThumbnailGenerator';
import VideoSplitter from './components/VideoSplitter';

// Planning & Optimasi (Modul 6-10)
import ContentPlanner from './components/ContentPlanner';
import FYPredictor from './components/FYPredictor';
import AudioManager from './components/AudioManager';
import HashtagAnalytics from './components/HashtagAnalytics';
import ViralAlert from './components/ViralAlert';

// AI & Testing (Modul 11-15)
import ABTesting from './components/ABTesting';
import EngagementPredictor from './components/EngagementPredictor';
import AutoCaption from './components/AutoCaption';
import AutoHashtag from './components/AutoHashtag';
import ScriptGenerator from './components/ScriptGenerator';

// Hak Cipta & Keamanan (Modul 16-20)
import CopyrightChecker from './components/CopyrightChecker';
import RightsManager from './components/RightsManager';
import AntiStrike from './components/AntiStrike';
import InfringementResponse from './components/InfringementResponse';
import BackupRestore from './components/BackupRestore';

// Manajemen & Kolaborasi (Modul 21-25)
import Scheduler from './components/Scheduler';
import TeamCollab from './components/TeamCollab';
import ExportShare from './components/ExportShare';
import AssetManager from './components/AssetManager';
import AudienceAnalytics from './components/AudienceAnalytics';

// Social Engagement (Modul 26-28)
import AutoReplyComment from './components/AutoReplyComment';
import LinkComment from './components/LinkComment';
import SocialListening from './components/SocialListening';

// Monetisasi (Modul 29-30)
import AffiliateIntegration from './components/AffiliateIntegration';
import ProfitTracker from './components/ProfitTracker';

// Infrastruktur (Modul 31-33)
import LoadBalancer from './components/LoadBalancer';
import FacebookIntegration from './components/FacebookIntegration';
import AutoUpdate from './components/AutoUpdate';

// Tools (Modul 35-37)
import ContentRepurposing from './components/ContentRepurposing';
import BurnoutProtection from './components/BurnoutProtection';
import EditingTemplate from './components/EditingTemplate';

// Bonus (Modul 38-42)
import CompetitorAnalysis from './components/CompetitorAnalysis';
import RoyaltyFree from './components/RoyaltyFree';
import GrowthTracker from './components/GrowthTracker';
import ImportFromSocial from './components/ImportFromSocial';
import NotificationSystem from './components/NotificationSystem';

import './App.css';

function App() {
    const [activeTab, setActiveTab] = useState('editor');

    // Daftar semua tabs
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
        { id: 'viral', name: '🚨 Viral Alert', category: 'Planning', component: ViralAlert },
        
        // AI & Testing (Modul 11-15)
        { id: 'abtest', name: '📊 A/B Testing', category: 'AI', component: ABTesting },
        { id: 'engagement', name: '📈 Engagement Predictor', category: 'AI', component: EngagementPredictor },
        { id: 'autocaption', name: '🤖 Auto Caption', category: 'AI', component: AutoCaption },
        { id: 'autohashtag', name: '🔖 Auto Hashtag', category: 'AI', component: AutoHashtag },
        { id: 'script', name: '📝 Script Generator', category: 'AI', component: ScriptGenerator },
        
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
        
        // Infrastruktur (Modul 31-33)
        { id: 'loadbalancer', name: '🔑 Load Balancer', category: 'Infrastructure', component: LoadBalancer },
        { id: 'facebook', name: '📘 Facebook Integration', category: 'Infrastructure', component: FacebookIntegration },
        { id: 'autoupdate', name: '🔄 Auto Update', category: 'Infrastructure', component: AutoUpdate },
        
        // Tools (Modul 35-37)
        { id: 'repurpose', name: '🔄 Repurpose', category: 'Tools', component: ContentRepurposing },
        { id: 'burnout', name: '🧘 Burnout Protection', category: 'Tools', component: BurnoutProtection },
        { id: 'template', name: '🎨 Editing Template', category: 'Tools', component: EditingTemplate },
        
        // Bonus (Modul 38-42)
        { id: 'competitor', name: '🔍 Competitor Analysis', category: 'Bonus', component: CompetitorAnalysis },
        { id: 'royalty', name: '📚 Royalty Free', category: 'Bonus', component: RoyaltyFree },
        { id: 'growth', name: '📈 Growth Tracker', category: 'Bonus', component: GrowthTracker },
        { id: 'import', name: '📥 Import Social', category: 'Bonus', component: ImportFromSocial },
        { id: 'notify', name: '🔔 Notification', category: 'Bonus', component: NotificationSystem }
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || VideoEditor;

    // Group tabs by category
    const coreTabs = tabs.filter(t => t.category === 'Core');
    const planningTabs = tabs.filter(t => t.category === 'Planning');
    const aiTabs = tabs.filter(t => t.category === 'AI');
    const securityTabs = tabs.filter(t => t.category === 'Security');
    const managementTabs = tabs.filter(t => t.category === 'Management');
    const socialTabs = tabs.filter(t => t.category === 'Social');
    const monetizationTabs = tabs.filter(t => t.category === 'Monetization');
    const infraTabs = tabs.filter(t => t.category === 'Infrastructure');
    const toolsTabs = tabs.filter(t => t.category === 'Tools');
    const bonusTabs = tabs.filter(t => t.category === 'Bonus');

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
                
                <div className="nav-category">
                    <div className="category-title">🤖 AI & AUTO GENERATE</div>
                    {aiTabs.map(tab => (
                        <div key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            {tab.name}
                        </div>
                    ))}
                </div>
                
                <div className="nav-category">
                    <div className="category-title">🛡️ HAK CIPTA & KEAMANAN</div>
                    {securityTabs.map(tab => (
                        <div key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            {tab.name}
                        </div>
                    ))}
                </div>
                
                <div className="nav-category">
                    <div className="category-title">🤝 MANAJEMEN & KOLABORASI</div>
                    {managementTabs.map(tab => (
                        <div key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            {tab.name}
                        </div>
                    ))}
                </div>
                
                <div className="nav-category">
                    <div className="category-title">💬 SOCIAL ENGAGEMENT</div>
                    {socialTabs.map(tab => (
                        <div key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            {tab.name}
                        </div>
                    ))}
                </div>
                
                <div className="nav-category">
                    <div className="category-title">💰 MONETISASI</div>
                    {monetizationTabs.map(tab => (
                        <div key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            {tab.name}
                        </div>
                    ))}
                </div>
                
                <div className="nav-category">
                    <div className="category-title">🔧 INFRASTRUKTUR</div>
                    {infraTabs.map(tab => (
                        <div key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            {tab.name}
                        </div>
                    ))}
                </div>
                
                <div className="nav-category">
                    <div className="category-title">🛠️ TOOLS</div>
                    {toolsTabs.map(tab => (
                        <div key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            {tab.name}
                        </div>
                    ))}
                </div>
                
                <div className="nav-category">
                    <div className="category-title">🎁 BONUS</div>
                    {bonusTabs.map(tab => (
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
