import React, { useState, useEffect } from 'react';

import ActivationPage from './components/ActivationPage';

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
import ABTesting from './components/ABTesting';
import EngagementPredictor from './components/EngagementPredictor';
import AutoCaption from './components/AutoCaption';
import AutoHashtag from './components/AutoHashtag';
import ScriptGenerator from './components/ScriptGenerator';
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
import LoadBalancer from './components/LoadBalancer';
import FacebookIntegration from './components/FacebookIntegration';
import Settings from './components/Settings';
import ContentRepurposing from './components/ContentRepurposing';
import BurnoutProtection from './components/BurnoutProtection';
import EditingTemplate from './components/EditingTemplate';
import CompetitorAnalysis from './components/CompetitorAnalysis';
import RoyaltyFree from './components/RoyaltyFree';
import GrowthTracker from './components/GrowthTracker';
import ImportFromSocial from './components/ImportFromSocial';
import NotificationSystem from './components/NotificationSystem';
import UpdateNotification from './components/UpdateNotification';

import './App.css';

function App() {
    const [activeTab, setActiveTab]         = useState('editor');
    const [licenseStatus, setLicenseStatus] = useState('checking'); // checking | valid | invalid
    const [licenseInfo, setLicenseInfo]     = useState(null);

    useEffect(() => {
        checkLicense();
    }, []);

    const checkLicense = async () => {
        try {
            const result = await window.electron.checkLicense();
            if (result.valid) {
                setLicenseStatus('valid');
                setLicenseInfo(result.license);
            } else {
                setLicenseStatus('invalid');
            }
        } catch {
            // Jika IPC belum ada (dev mode), langsung masuk
            setLicenseStatus('valid');
        }
    };

    const handleActivated = (license) => {
        setLicenseInfo(license);
        setLicenseStatus('valid');
    };

    const tabs = [
        { id: 'editor',        name: '🎬 Video Editor',          category: 'Core',           component: VideoEditor },
        { id: 'watermark',     name: '💧 Watermark',             category: 'Core',           component: WatermarkInpainting },
        { id: 'subtitle',      name: '🗑️ Subtitle Remover',      category: 'Core',           component: SubtitleRemover },
        { id: 'thumbnail',     name: '🖼️ Thumbnail',             category: 'Core',           component: ThumbnailGenerator },
        { id: 'splitter',      name: '✂️ Video Splitter',         category: 'Core',           component: VideoSplitter },
        { id: 'planner',       name: '📅 Content Planner',       category: 'Planning',       component: ContentPlanner },
        { id: 'fyp',           name: '📈 FYP Predictor',         category: 'Planning',       component: FYPredictor },
        { id: 'audio',         name: '🎵 Audio Manager',         category: 'Planning',       component: AudioManager },
        { id: 'hashtag',       name: '🔖 Hashtag Analytics',     category: 'Planning',       component: HashtagAnalytics },
        { id: 'viral',         name: '🚨 Viral Alert',           category: 'Planning',       component: ViralAlert },
        { id: 'abtest',        name: '📊 A/B Testing',           category: 'AI',             component: ABTesting },
        { id: 'engagement',    name: '📈 Engagement Predictor',  category: 'AI',             component: EngagementPredictor },
        { id: 'autocaption',   name: '🤖 Auto Caption',          category: 'AI',             component: AutoCaption },
        { id: 'autohashtag',   name: '🔖 Auto Hashtag',          category: 'AI',             component: AutoHashtag },
        { id: 'script',        name: '📝 Script Generator',      category: 'AI',             component: ScriptGenerator },
        { id: 'copyright',     name: '⚖️ Copyright Checker',     category: 'Security',       component: CopyrightChecker },
        { id: 'rights',        name: '🔒 Rights Manager',        category: 'Security',       component: RightsManager },
        { id: 'antistrike',    name: '🛡️ Anti Strike',           category: 'Security',       component: AntiStrike },
        { id: 'infringement',  name: '📜 Infringement Response', category: 'Security',       component: InfringementResponse },
        { id: 'backup',        name: '💾 Backup & Restore',      category: 'Security',       component: BackupRestore },
        { id: 'scheduler',     name: '📅 Scheduler',             category: 'Management',     component: Scheduler },
        { id: 'team',          name: '👥 Team Collab',           category: 'Management',     component: TeamCollab },
        { id: 'export',        name: '📤 Export & Share',        category: 'Management',     component: ExportShare },
        { id: 'asset',         name: '🗂️ Asset Manager',         category: 'Management',     component: AssetManager },
        { id: 'audience',      name: '📊 Audience Analytics',    category: 'Management',     component: AudienceAnalytics },
        { id: 'autoreply',     name: '💬 Auto Reply Comment',    category: 'Social',         component: AutoReplyComment },
        { id: 'linkcomment',   name: '🔗 Link Comment',          category: 'Social',         component: LinkComment },
        { id: 'sociallistening', name: '👂 Social Listening',    category: 'Social',         component: SocialListening },
        { id: 'affiliate',     name: '🛍️ Affiliate Integration', category: 'Monetization',   component: AffiliateIntegration },
        { id: 'profit',        name: '💰 Profit Tracker',        category: 'Monetization',   component: ProfitTracker },
        { id: 'loadbalancer',  name: '🔑 Load Balancer',         category: 'Infrastructure', component: LoadBalancer },
        { id: 'facebook',      name: '📘 Facebook Integration',  category: 'Infrastructure', component: FacebookIntegration },
        { id: 'autoupdate',    name: '⚙️ Settings / Update',     category: 'Infrastructure', component: Settings },
        { id: 'repurpose',     name: '🔄 Repurpose',             category: 'Tools',          component: ContentRepurposing },
        { id: 'burnout',       name: '🧘 Burnout Protection',    category: 'Tools',          component: BurnoutProtection },
        { id: 'template',      name: '🎨 Editing Template',      category: 'Tools',          component: EditingTemplate },
        { id: 'competitor',    name: '🔍 Competitor Analysis',   category: 'Bonus',          component: CompetitorAnalysis },
        { id: 'royalty',       name: '📚 Royalty Free',          category: 'Bonus',          component: RoyaltyFree },
        { id: 'growth',        name: '📈 Growth Tracker',        category: 'Bonus',          component: GrowthTracker },
        { id: 'import',        name: '📥 Import Social',         category: 'Bonus',          component: ImportFromSocial },
        { id: 'notify',        name: '🔔 Notification',          category: 'Bonus',          component: NotificationSystem },
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || VideoEditor;
    const byCategory = (cat) => tabs.filter(t => t.category === cat);

    // ── Loading state ──
    if (licenseStatus === 'checking') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
                          height: '100vh', background: '#0f0f1a', color: '#aaa',
                          fontSize: 16, flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: 48 }}>🎬</div>
                <p>Memuat Drama Tool...</p>
            </div>
        );
    }

    // ── Aktivasi screen ──
    if (licenseStatus === 'invalid') {
        return <ActivationPage onActivated={handleActivated} />;
    }

    // ── App utama ──
    return (
        <div className="app">
            <UpdateNotification />

            <div className="sidebar">
                <div className="logo">
                    <h1>🎬 DRAMA TOOL</h1>
                    <p>Video Generator</p>
                    {licenseInfo && (
                        <p style={{ fontSize: 10, color: '#555', marginTop: 4 }}>
                            {licenseInfo.variantName || 'Licensed'}
                        </p>
                    )}
                </div>

                {[
                    ['🎬 CORE VIDEO EDITING',      'Core'],
                    ['📈 PLANNING & OPTIMASI',      'Planning'],
                    ['🤖 AI & AUTO GENERATE',       'AI'],
                    ['🛡️ HAK CIPTA & KEAMANAN',    'Security'],
                    ['🤝 MANAJEMEN & KOLABORASI',   'Management'],
                    ['💬 SOCIAL ENGAGEMENT',        'Social'],
                    ['💰 MONETISASI',               'Monetization'],
                    ['🔧 INFRASTRUKTUR',            'Infrastructure'],
                    ['🛠️ TOOLS',                   'Tools'],
                    ['🎁 BONUS',                    'Bonus'],
                ].map(([title, cat]) => (
                    <div key={cat} className="nav-category">
                        <div className="category-title">{title}</div>
                        {byCategory(cat).map(tab => (
                            <div
                                key={tab.id}
                                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.name}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="main-content">
                <ActiveComponent />
            </div>
        </div>
    );
}

export default App;
