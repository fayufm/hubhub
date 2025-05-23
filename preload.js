const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  searchRepos: (query) => ipcRenderer.invoke('search-repos', query),
  getRepoReleases: (repoFullName) => ipcRenderer.invoke('get-repo-releases', repoFullName),
  getRepoReadme: (repoFullName) => ipcRenderer.invoke('get-repo-readme', repoFullName),
  downloadFile: (url, fileName) => ipcRenderer.invoke('download-file', url, fileName),
  getTrendingRepos: () => ipcRenderer.invoke('get-trending-repos'),
  getRepoIcon: (repoFullName) => ipcRenderer.invoke('get-repo-icon', repoFullName),
  getRepoByFullName: (repoFullName) => ipcRenderer.invoke('get-repo-by-fullname', repoFullName),
  openInDefaultBrowser: (url) => ipcRenderer.invoke('open-in-browser', url),
  openInBrowser: (url) => ipcRenderer.invoke('open-in-browser', url),
  
  // 添加获取API速率限制的方法
  getApiRateLimit: () => ipcRenderer.invoke('get-api-rate-limit'),
  
  // 窗口控制功能 - 使用invoke代替send以便更好地处理错误
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // 设置相关功能
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  selectDownloadPath: () => ipcRenderer.invoke('select-download-path'),
  getDefaultDownloadPath: () => ipcRenderer.invoke('get-default-download-path'),
  
  // 背景相关功能
  selectBackgroundImage: () => ipcRenderer.invoke('select-background-image'),
  setBackgroundFromUrl: (url) => ipcRenderer.invoke('set-background-from-url', url),
  
  // 事件监听
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', () => callback()),
  
  // 全屏状态变化监听器
  onFullscreenChange: (callback) => {
    ipcRenderer.on('fullscreen-change', (event, isFullscreen) => {
      callback(isFullscreen);
    });
  },
  
  // 下载相关事件监听
  onDownloadStarted: (callback) => {
    ipcRenderer.on('download-started', (event, data) => {
      callback(data);
    });
  },
  
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, data) => {
      callback(data);
    });
  },
  
  onDownloadFinished: (callback) => {
    ipcRenderer.on('download-finished', (event, data) => {
      callback(data);
    });
  },
  
  onDownloadError: (callback) => {
    ipcRenderer.on('download-error', (event, data) => {
      callback(data);
    });
  }
}); 