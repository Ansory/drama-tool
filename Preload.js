/**
 * preload.js
 * Jembatan aman antara Electron main process dan React renderer.
 * FIXED: Ekspos getVersion() sebagai async, tambah getSkippedVersions()
 *        agar UpdateNotification tidak perlu pakai localStorage.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {

  // ── Config ──────────────────────────────────────────────────────────────
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (config) => ipcRenderer.invoke('update-config', config),

  // ── Versi ────────────────────────────────────────────────────────────────
  // FIXED: Dibuat async agar Settings.jsx bisa await sebelum render
  getVersion: () => ipcRenderer.invoke('get-version'),

  // ── Update ───────────────────────────────────────────────────────────────
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),

  // FIXED: Ganti localStorage dengan penyimpanan di main process via electron-store
  getSkippedVersions: () => ipcRenderer.invoke('get-skipped-versions'),
  skipUpdate: (version) => ipcRenderer.invoke('skip-update', version),

  // ── Update event listeners ────────────────────────────────────────────────
  onUpdateAvailable: (callback) =>
    ipcRenderer.on('update-available', callback),
  onUpdateDownloadProgress: (callback) =>
    ipcRenderer.on('update-download-progress', callback),
  onUpdateDownloaded: (callback) =>
    ipcRenderer.on('update-downloaded', callback),
  onUpdateError: (callback) =>
    ipcRenderer.on('update-error', callback),

  // ── Utilitas ─────────────────────────────────────────────────────────────
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
