const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // ============ UTILS ============
    platform: process.platform,
    versions: {
        node: process.versions.node,
        electron: process.versions.electron,
        chrome: process.versions.chrome
    },

    // ============ MODUL 1: VIDEO GENERATOR ============
    videoGetInfo: (path) => ipcRenderer.invoke('video:get-info', path),
    videoCrop: (options) => ipcRenderer.invoke('video:crop', options),
    videoResize: (options) => ipcRenderer.invoke('video:resize', options),
    videoAddSubtitle: (options) => ipcRenderer.invoke('video:add-subtitle', options),
    videoChangeSpeed: (options) => ipcRenderer.invoke('video:change-speed', options),

    // ============ MODUL 2: WATERMARK ============
    watermarkDetect: (path) => ipcRenderer.invoke('watermark:detect', path),
    watermarkRemove: (options) => ipcRenderer.invoke('watermark:remove', options),
    watermarkAdd: (options) => ipcRenderer.invoke('watermark:add', options),

    // ============ MODUL 3: SUBTITLE REMOVER ============
    subtitleDetect: (path) => ipcRenderer.invoke('subtitle:detect', path),
    subtitleRemove: (options) => ipcRenderer.invoke('subtitle:remove', options),

    // ============ MODUL 4: THUMBNAIL GENERATOR ============
    thumbnailExtract: (options) => ipcRenderer.invoke('thumbnail:extract', options),
    thumbnailAddText: (options) => ipcRenderer.invoke('thumbnail:add-text', options),

    // ============ MODUL 5: VIDEO SPLITTER ============
    videoSplitScenes: (options) => ipcRenderer.invoke('video:split-scenes', options),
    videoDetectScenes: (path) => ipcRenderer.invoke('video:detect-scenes', path),

    // ============ MODUL 6: CONTENT PLANNER ============
    contentScrapeTrends: (keyword) => ipcRenderer.invoke('content:scrape-trends', keyword),
    contentGetCalendar: (month, year) => ipcRenderer.invoke('content:get-calendar', month, year),
    contentSaveCalendar: (month, year, data) => ipcRenderer.invoke('content:save-calendar', month, year, data),

    // ============ MODUL 7: FYP PREDICTOR ============
    fypPredict: (path) => ipcRenderer.invoke('fyp:predict', path),
    fypFeedback: (videoId, performance) => ipcRenderer.invoke('fyp:feedback', videoId, performance),

    // ============ MODUL 8: AUDIO MANAGER ============
    audioGetTrending: () => ipcRenderer.invoke('audio:get-trending'),
    audioExtract: (videoPath, outputPath) => ipcRenderer.invoke('audio:extract', videoPath, outputPath),
    audioReduceNoise: (inputPath, outputPath) => ipcRenderer.invoke('audio:reduce-noise', inputPath, outputPath),

    // ============ MODUL 9: HASHTAG ANALYTICS ============
    hashtagAnalyze: (hashtag) => ipcRenderer.invoke('hashtag:analyze', hashtag),
    hashtagTrack: (hashtag, performance) => ipcRenderer.invoke('hashtag:track', hashtag, performance),
    hashtagSuggest: (keyword) => ipcRenderer.invoke('hashtag:suggest', keyword),

    // ============ MODUL 10: VIRAL ALERT ============
    viralCheck: () => ipcRenderer.invoke('viral:check'),
    viralSubscribe: (webhookUrl) => ipcRenderer.invoke('viral:subscribe', webhookUrl),

    // ============ MODUL 11: A/B TESTING ============
    abtestCreate: (options) => ipcRenderer.invoke('abtest:create', options),
    abtestRun: (testId) => ipcRenderer.invoke('abtest:run', testId),

    // ============ MODUL 12: ENGAGEMENT PREDICTOR ============
    engagementPredict: (videoPath) => ipcRenderer.invoke('engagement:predict', videoPath),

    // ============ MODUL 13: AUTO CAPTION ============
    autogenTitle: (videoPath, dramaName) => ipcRenderer.invoke('autogen:title', videoPath, dramaName),
    autogenCaption: (videoPath, dramaName, sceneType) => ipcRenderer.invoke('autogen:caption', videoPath, dramaName, sceneType),

    // ============ MODUL 14: AUTO HASHTAG ============
    autogenHashtag: (dramaName, sceneType) => ipcRenderer.invoke('autogen:hashtag', dramaName, sceneType),

    // ============ MODUL 15: SCRIPT GENERATOR ============
    scriptGenerate: (options) => ipcRenderer.invoke('script:generate', options),

    // ============ MODUL 16: COPYRIGHT CHECKER ============
    copyrightPrecheck: (videoPath) => ipcRenderer.invoke('copyright:precheck', videoPath),

    // ============ MODUL 17: RIGHTS MANAGER ============
    rightsRegister: (options) => ipcRenderer.invoke('rights:register', options),
    rightsCreateRule: (options) => ipcRenderer.invoke('rights:create-rule', options),
    rightsWhitelist: (options) => ipcRenderer.invoke('rights:whitelist', options),

    // ============ MODUL 18: ANTI STRIKE ============
    antistrikeScore: (videoPath) => ipcRenderer.invoke('antistrike:score', videoPath),

    // ============ MODUL 19: INFRINGEMENT RESPONSE ============
    strikeParse: (emailContent) => ipcRenderer.invoke('strike:parse', emailContent),
    strikeGenerateAppeal: (strikeInfo) => ipcRenderer.invoke('strike:generate-appeal', strikeInfo),

    // ============ MODUL 20: BACKUP & RESTORE ============
    backupCreate: (backupPath) => ipcRenderer.invoke('backup:create', backupPath),
    backupRestore: (backupFolder) => ipcRenderer.invoke('backup:restore', backupFolder),
    backupList: () => ipcRenderer.invoke('backup:list'),

    // ============ MODUL 21: SCHEDULER ============
    schedulerAdd: (schedule) => ipcRenderer.invoke('scheduler:add', schedule),
    schedulerList: () => ipcRenderer.invoke('scheduler:list'),
    schedulerRemove: (id) => ipcRenderer.invoke('scheduler:remove', id),
    schedulerProcess: () => ipcRenderer.invoke('scheduler:process'),

    // ============ MODUL 22: TEAM COLLAB ============
    teamAddMember: (member) => ipcRenderer.invoke('team:add-member', member),
    teamListMembers: () => ipcRenderer.invoke('team:list-members'),
    teamUpdateRole: (options) => ipcRenderer.invoke('team:update-role', options),

    // ============ MODUL 23: EXPORT & SHARE ============
    exportPDF: (options) => ipcRenderer.invoke('export:pdf', options),
    exportWhatsapp: (options) => ipcRenderer.invoke('export:whatsapp', options),

    // ============ MODUL 24: ASSET MANAGER ============
    assetAdd: (asset) => ipcRenderer.invoke('asset:add', asset),
    assetList: (filter) => ipcRenderer.invoke('asset:list', filter),
    assetDelete: (id) => ipcRenderer.invoke('asset:delete', id),

    // ============ MODUL 25: AUDIENCE ANALYTICS ============
    audienceDemographics: (pageId) => ipcRenderer.invoke('audience:demographics', pageId),

    // ============ MODUL 26: AUTO REPLY COMMENT ============
    commentAutoReply: (options) => ipcRenderer.invoke('comment:auto-reply', options),
    commentClassify: (commentText) => ipcRenderer.invoke('comment:classify', commentText),
    commentSettings: (settings) => ipcRenderer.invoke('comment:settings', settings),
    commentGetSettings: () => ipcRenderer.invoke('comment:get-settings'),

    // ============ MODUL 27: LINK COMMENT ============
    linkAutoComment: (options) => ipcRenderer.invoke('link:auto-comment', options),

    // ============ MODUL 28: SOCIAL LISTENING ============
    socialAnalyzeSentiment: (comments) => ipcRenderer.invoke('social:analyze-sentiment', comments),
    socialTrackKeywords: (keywords) => ipcRenderer.invoke('social:track-keywords', keywords),
    socialGetKeywords: () => ipcRenderer.invoke('social:get-keywords'),
    socialWeeklyReport: (pageId) => ipcRenderer.invoke('social:weekly-report', pageId),

    // ============ MODUL 29: AFFILIATE INTEGRATION ============
    affiliateDetectProducts: (videoPath) => ipcRenderer.invoke('affiliate:detect-products', videoPath),
    affiliateGenerateLink: (options) => ipcRenderer.invoke('affiliate:generate-link', options),
    affiliateTrackClick: (options) => ipcRenderer.invoke('affiliate:track-click', options),

    // ============ MODUL 30: PROFIT TRACKER ============
    profitCalculate: (data) => ipcRenderer.invoke('profit:calculate', data),
    profitHistory: (period) => ipcRenderer.invoke('profit:history', period),
    profitSave: (data) => ipcRenderer.invoke('profit:save', data),

    // ============ MODUL 31: LOAD BALANCER ============
    loadbalancerAddKey: (key) => ipcRenderer.invoke('loadbalancer:add-key', key),
    loadbalancerGetKeys: () => ipcRenderer.invoke('loadbalancer:get-keys'),
    loadbalancerRemoveKey: (id) => ipcRenderer.invoke('loadbalancer:remove-key', id),
    loadbalancerTestKey: (key) => ipcRenderer.invoke('loadbalancer:test-key', key),
    loadbalancerStats: () => ipcRenderer.invoke('loadbalancer:stats'),

    // ============ MODUL 32: FACEBOOK INTEGRATION ============
    facebookLogin: () => ipcRenderer.invoke('facebook:login'),
    facebookUploadReel: (options) => ipcRenderer.invoke('facebook:upload-reel', options),
    facebookUploadVideo: (options) => ipcRenderer.invoke('facebook:upload-video', options),
    facebookGetInsights: (options) => ipcRenderer.invoke('facebook:get-insights', options),

    // ============ MODUL 33: AUTO UPDATE ============
    getConfig: () => ipcRenderer.invoke('updater:get-config'),
    updateConfig: (config) => ipcRenderer.invoke('updater:update-config', config),
    getVersion: () => ipcRenderer.invoke('updater:get-version'),
    checkForUpdates: () => ipcRenderer.invoke('updater:check'),

    // ============ MODUL 35: CONTENT REPURPOSING ============
    repurposeResize: (options) => ipcRenderer.invoke('repurpose:resize', options),

    // ============ MODUL 36: BURNOUT PROTECTION ============
    burnoutTrack: (action) => ipcRenderer.invoke('burnout:track', action),

    // ============ MODUL 37: EDITING TEMPLATE ============
    templateSave: (template) => ipcRenderer.invoke('template:save', template),
    templateGetAll: () => ipcRenderer.invoke('template:get-all'),
    templateApply: (options) => ipcRenderer.invoke('template:apply', options),

    // ============ MODUL 38: COMPETITOR ANALYSIS ============
    competitorAnalyze: (pageUrl) => ipcRenderer.invoke('competitor:analyze', pageUrl),

    // ============ MODUL 39: ROYALTY FREE ============
    royaltySearch: (options) => ipcRenderer.invoke('royalty:search', options),

    // ============ MODUL 40: GROWTH TRACKER ============
    growthTrack: (pageId) => ipcRenderer.invoke('growth:track', pageId),

    // ============ MODUL 41: IMPORT FROM SOCIAL ============
    importDownload: (options) => ipcRenderer.invoke('import:download', options),
    importRemoveWatermark: (options) => ipcRenderer.invoke('import:remove-watermark', options),

    // ============ MODUL 42: NOTIFICATION SYSTEM ============
    notifySend: (notification) => ipcRenderer.invoke('notify:send', notification),
    notifySubscribe: (subscription) => ipcRenderer.invoke('notify:subscribe', subscription),
    notifyGetSubscriptions: () => ipcRenderer.invoke('notify:get-subscriptions'),

    // ============ FACEBOOK HELPERS ============
    getPages: () => ipcRenderer.invoke('get-pages'),
    getRecentPosts: () => ipcRenderer.invoke('get-recent-posts'),

    // ============ UTILITIES ============
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    shellShowItemInFolder: (path) => ipcRenderer.invoke('shell:show-item-in-folder', path),

    // ============ STORE HELPERS ============
    getStore: (key) => ipcRenderer.invoke('store:get', key),
    setStore: (key, value) => ipcRenderer.invoke('store:set', key, value),

    // ============ EVENT LISTENERS ============
    onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, ...args) => callback(...args)),

    on: (channel, callback) => {
        const validChannels = [
            'update-status', 'update-available', 'update-downloaded', 'update-error',
            'update-download-progress', 'viral-alert', 'copyright-strike', 'upload-complete'
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => callback(...args));
        }
    },

    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});
