const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Video Generator (Modul 1)
    videoGetInfo: (path) => ipcRenderer.invoke('video:get-info', path),
    videoCrop: (options) => ipcRenderer.invoke('video:crop', options),
    videoResize: (options) => ipcRenderer.invoke('video:resize', options),
    videoAddSubtitle: (options) => ipcRenderer.invoke('video:add-subtitle', options),
    videoChangeSpeed: (options) => ipcRenderer.invoke('video:change-speed', options),
    
    // Watermark (Modul 2)
    watermarkDetect: (path) => ipcRenderer.invoke('watermark:detect', path),
    watermarkRemove: (options) => ipcRenderer.invoke('watermark:remove', options),
    watermarkAdd: (options) => ipcRenderer.invoke('watermark:add', options),
    
    // Subtitle Remover (Modul 3)
    subtitleDetect: (path) => ipcRenderer.invoke('subtitle:detect', path),
    subtitleRemove: (options) => ipcRenderer.invoke('subtitle:remove', options),
    
    // Thumbnail Generator (Modul 4)
    thumbnailExtract: (options) => ipcRenderer.invoke('thumbnail:extract', options),
    thumbnailAddText: (options) => ipcRenderer.invoke('thumbnail:add-text', options),
    
    // Video Splitter (Modul 5)
    videoSplitScenes: (options) => ipcRenderer.invoke('video:split-scenes', options),
    videoDetectScenes: (path) => ipcRenderer.invoke('video:detect-scenes', path),
    
    // Utils
    openDialog: (options) => ipcRenderer.invoke('dialog:open', options),
    saveDialog: (options) => ipcRenderer.invoke('dialog:save', options)
});
