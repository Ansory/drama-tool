const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Config
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (config) => ipcRenderer.invoke('update-config', config),
  
  // API Keys
  getApiKeys: () => ipcRenderer.invoke('get-api-keys'),
  addApiKey: (key, name) => ipcRenderer.invoke('add-api-key', key, name),
  removeApiKey: (id) => ipcRenderer.invoke('remove-api-key', id),
  testApiKey: (key) => ipcRenderer.invoke('test-api-key', key),
  
  // Video Processing
  processVideo: (videoPath, options) => ipcRenderer.invoke('process-video', videoPath, options),
  uploadToFacebook: (videoPath, caption, hashtags, longVideoUrl) => 
    ipcRenderer.invoke('upload-to-facebook', videoPath, caption, hashtags, longVideoUrl),
  
  // Events
  onMenuNewProject: (callback) => ipcRenderer.on('menu-new-project', callback),
  onMenuOpenProject: (callback) => ipcRenderer.on('menu-open-project', callback),
  onMenuImportVideo: (callback) => ipcRenderer.on('menu-import-video', callback),
  onOpenApiManager: (callback) => ipcRenderer.on('open-api-manager', callback),
  onQuickUpload: (callback) => ipcRenderer.on('quick-upload', callback),
  onToggleTheme: (callback) => ipcRenderer.on('toggle-theme', callback),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
  onCacheCleared: (callback) => ipcRenderer.on('cache-cleared', callback),
  
  // Utils
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options)
});