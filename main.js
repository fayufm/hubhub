const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const { dialog } = require('electron');
const log = require('electron-log');
const { shell } = require('electron');
const https = require('https');

/**
 * GitHub API请求优化
 * 1. 添加请求队列，限制请求频率，避免触发滥用检测
 * 2. 使用指数退避策略进行自动重试
 * 3. 正确处理API限制和滥用检测错误
 * 4. 自动验证和清理GitHub令牌
 * 5. 添加详细的错误信息和日志
 */

// 禁用GPU加速，防止GPU进程崩溃
app.disableHardwareAcceleration();

// 添加命令行开关，解决GPU相关问题
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu-rasterization');
app.commandLine.appendSwitch('disable-gpu-sandbox');

// 检测是否为便携模式
const isPortable = !app.isPackaged || process.env.PORTABLE_EXECUTABLE_DIR;

// 如果是便携模式，将用户数据设置到应用程序目录下
if (isPortable) {
  const portableDataPath = path.join(
    process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath('exe')),
    'HubHubData'
  );
  
  // 确保目录存在
  if (!fs.existsSync(portableDataPath)) {
    try {
      fs.mkdirSync(portableDataPath, { recursive: true });
    } catch (error) {
      log.error('创建便携数据目录失败:', error);
    }
  }
  
  // 设置用户数据路径
  app.setPath('userData', portableDataPath);
  log.info('已启用便携模式，数据目录:', portableDataPath);
}

// 确保应用程序只有一个实例
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  log.info('另一个实例已运行，退出当前实例');
  app.quit();
} else {
  // 当有人尝试运行第二个实例时，聚焦到第一个实例的窗口
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// 配置axios以处理SSL证书问题
axios.defaults.httpsAgent = new https.Agent({
  rejectUnauthorized: false // 禁用证书验证，解决"unable to verify the first certificate"问题
});

// 默认设置
let settings = {
  theme: 'github', // github, light, dark
  primaryColor: '#2ea44f',
  downloadPath: app.getPath('downloads'),
  githubToken: '', // 用户需要在设置中添加自己的GitHub Token
  specialThemes: {
    flower: false
  },
  background: {
    type: 'none', // none, custom
    source: 'url', // url, file
    url: '',
    filePath: '',
    opacity: 0.3,
    blur: 5
  }
};

// 应用图标路径
const iconPath = path.join(__dirname, 'app.ico');

// 设置文件路径
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
const backgroundsDir = path.join(app.getPath('userData'), 'backgrounds');

// 在文件开头添加缓存变量
const API_RATE_LIMIT_CACHE = {
  data: null,
  timestamp: 0,
  CACHE_DURATION: 60000 // 缓存时间1分钟
};

// 确保背景图片目录存在
function ensureBackgroundsDir() {
  if (!fs.existsSync(backgroundsDir)) {
    fs.mkdirSync(backgroundsDir, { recursive: true });
  }
}

// 加载设置
function loadSettings() {
  try {
    ensureBackgroundsDir();
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      const loadedSettings = JSON.parse(data);
      settings = { ...settings, ...loadedSettings };
      
      // 清理GitHub令牌
      cleanGithubToken();
    }
  } catch (error) {
    log.error('加载设置失败:', error);
  }
}

// 清理GitHub令牌
function cleanGithubToken() {
  if (!settings.githubToken) return;
  
  // 移除可能的错误字符，如分号、空格等
  let token = settings.githubToken.trim();
  
  // 检查是否包含多个令牌（通过分号或空格分隔）
  if (token.includes(';') || token.includes(' ')) {
    // 尝试提取有效的令牌
    const tokens = token.split(/[;\s]+/).filter(t => t.length > 0);
    
    // 检查是否有以ghp_或github_pat开头的令牌
    const validToken = tokens.find(t => t.startsWith('ghp_') || t.startsWith('github_pat_'));
    
    if (validToken) {
      log.info('从多个令牌中提取有效令牌');
      settings.githubToken = validToken;
    } else if (tokens.length > 0) {
      // 如果没有找到有效格式的令牌，使用第一个非空令牌
      log.info('未找到有效格式令牌，使用第一个令牌');
      settings.githubToken = tokens[0];
    }
    
    // 保存更新后的设置
    saveSettings();
  }
  
  log.info('GitHub令牌格式检查完成');
}

// 保存设置
function saveSettings() {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
  } catch (error) {
    log.error('保存设置失败:', error);
  }
}

// 加载设置
loadSettings();

let mainWindow;
let splashWindow;

// 为Mac便携版添加特殊处理
if (process.platform === 'darwin') {
  // 配置日志到应用程序目录
  const logPath = isPortable ? 
    path.join(app.getPath('userData'), 'logs') : 
    path.join(app.getPath('logs'));
    
  if (!fs.existsSync(logPath)) {
    fs.mkdirSync(logPath, { recursive: true });
  }
  
  log.transports.file.resolvePath = () => path.join(logPath, 'hubhub.log');
  
  // 如果是便携模式，确保下载路径设置正确
  if (isPortable && (!settings.downloadPath || settings.downloadPath === app.getPath('downloads'))) {
    settings.downloadPath = path.join(app.getPath('userData'), 'Downloads');
    if (!fs.existsSync(settings.downloadPath)) {
      fs.mkdirSync(settings.downloadPath, { recursive: true });
    }
    saveSettings();
  }
}

// 创建启动画面窗口
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 200,
    height: 200,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    center: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: iconPath
  });

  // 加载启动画面HTML
  splashWindow.loadFile('splash.html');
  
  // 启动画面不显示在任务栏
  splashWindow.setSkipTaskbar(true);
  
  // 设置一个定时器，确保启动画面至少显示1秒
  setTimeout(() => {
    createWindow();
  }, 1000);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: iconPath,
    frame: false, // 移除标准窗口框架（标题栏）
    titleBarStyle: 'hidden',
    autoHideMenuBar: true, // 隐藏菜单栏
    show: false, // 初始不显示窗口，等内容加载完成后再显示
    opacity: 0 // 初始透明度为0，用于实现淡入效果
  });

  // 在Windows上强制设置任务栏图标
  if (process.platform === 'win32') {
    mainWindow.setIcon(iconPath);
    // 尝试使用另一种方法设置任务栏图标
    mainWindow.setOverlayIcon(iconPath, 'HubHub应用');
    // 清除并重新设置应用图标
    setTimeout(() => {
      mainWindow.setThumbarButtons([]);
      mainWindow.setIcon(iconPath);
    }, 1000);
  }

  // 监听窗口的全屏变化事件
  mainWindow.on('enter-full-screen', () => {
    log.info('进入全屏模式');
    // 通知渲染进程窗口已全屏
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('fullscreen-change', true);
    }
  });

  mainWindow.on('leave-full-screen', () => {
    log.info('退出全屏模式');
    // 通知渲染进程窗口已退出全屏
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('fullscreen-change', false);
    }
  });

  // 加载主页面
  mainWindow.loadFile('index.html');
  
  // 当主窗口准备好显示时
  mainWindow.once('ready-to-show', () => {
    // 如果有启动画面，先关闭它
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
    
    // 显示主窗口并添加淡入效果
    mainWindow.show();
    fadeInWindow(mainWindow);
    
    // 检查API速率限制
    checkApiRateLimit();
  });
  
  // 开发环境打开开发者工具
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

// 实现窗口淡入效果的函数
function fadeInWindow(win, step = 0.05) {
  let opacity = 0;
  const fadeIn = setInterval(() => {
    if (opacity >= 1) {
      clearInterval(fadeIn);
      return;
    }
    opacity += step;
    win.setOpacity(opacity);
  }, 16); // 约60fps的刷新率
}

// 应用准备就绪时
app.whenReady().then(() => {
  // 设置应用程序图标和ID
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.hubhub.app');
    
    // 确保任务栏图标正确显示
    try {
      app.setPath('userData', path.join(app.getPath('appData'), 'hubhub'));
    } catch (error) {
      log.error('设置userData路径失败:', error);
    }
  }
  
  // 加载设置
  loadSettings();
  
  // 尝试使用提供的令牌
  if (!settings.githubToken || settings.githubToken.trim() === '') {
    // 如果没有设置令牌，尝试使用备用令牌
    const backupTokens = [
      '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',
      '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'
    ];
    
    // 尝试验证每个令牌
    validateGithubTokens(backupTokens).then(validToken => {
      if (validToken) {
        log.info('找到有效的备用令牌');
        settings.githubToken = validToken;
        saveSettings();
      } else {
        log.warn('所有备用令牌都无效');
      }
    });
  }
  
  // 创建启动画面
  createSplashWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// 处理窗口控制
ipcMain.handle('minimize-window', async () => {
    try {
    if (mainWindow) {
      mainWindow.minimize();
      return { success: true };
  }
    return { success: false, error: 'Window not found' };
    } catch (error) {
    log.error('最小化窗口错误:', error);
      return { success: false, error: error.message };
    }
});

ipcMain.handle('close-window', async () => {
    try {
    if (mainWindow) {
      mainWindow.close();
      return { success: true };
    }
    return { success: false, error: 'Window not found' };
    } catch (error) {
    log.error('关闭窗口错误:', error);
      return { success: false, error: error.message };
    }
});

// 保持向后兼容性，支持旧的ipcMain.on方法
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

// 添加请求队列管理
const requestQueue = {
  queue: [],
  processing: false,
  minDelay: 1000, // 请求之间的最小延迟（毫秒）
  lastRequestTime: 0,
  
  // 添加请求到队列
  add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  },
  
  // 处理队列
  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    try {
      // 计算需要等待的时间
      const now = Date.now();
      const timeToWait = Math.max(0, this.lastRequestTime + this.minDelay - now);
      
      if (timeToWait > 0) {
        await new Promise(resolve => setTimeout(resolve, timeToWait));
      }
      
      const { requestFn, resolve, reject } = this.queue.shift();
      
      try {
        // 执行请求
        this.lastRequestTime = Date.now();
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    } finally {
      this.processing = false;
      // 继续处理队列中的下一个请求
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }
};

// 自动重试函数
async function retryRequest(requestFn, maxRetries = 3, retryDelay = 2000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // 处理连接拒绝错误
      if (error.code === 'ECONNREFUSED') {
        log.error(`连接被拒绝: ${error.message}`);
        throw {
          message: `连接被拒绝 (${error.address}:${error.port}): 请检查您的网络连接或代理设置`,
          isConnectionError: true,
          originalError: error
        };
      }
      
      // 检查是否是可重试的错误
      const isRetryable = error.response && 
                         (error.response.status === 403 || 
                          error.response.status === 429 ||
                          error.response.status >= 500);
      
      if (isRetryable && attempt < maxRetries) {
        // 计算延迟时间，使用指数退避策略
        const delay = retryDelay * Math.pow(2, attempt);
        log.warn(`请求失败，${attempt + 1}/${maxRetries}次尝试，等待${delay}ms后重试`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // 如果不是可重试的错误或已达到最大重试次数，则抛出错误
      throw error;
    }
  }
  
  // 如果所有重试都失败，抛出最后一个错误
  throw lastError;
}

// 处理GitHub API请求
ipcMain.handle('search-repos', async (event, query) => {
  try {
    // 使用请求队列
    return await requestQueue.add(async () => {
      const headers = {
        'User-Agent': 'HubHub-App',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      };
      
      // 只有当令牌存在且不为空时才添加Authorization头
      if (settings.githubToken && settings.githubToken.trim() !== '') {
        headers['Authorization'] = `Bearer ${settings.githubToken}`;
      }
      
      const response = await axios.get(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc`, {
        headers: headers
      });
      return response.data;
    });
  } catch (error) {
    log.error('搜索仓库失败:', error);
    
    // 处理连接错误
    if (error.code === 'ECONNREFUSED' || error.isConnectionError) {
      return { 
        error: `网络连接错误: ${error.message || '无法连接到GitHub API'}`,
        isConnectionError: true
      };
    }
    
    // 检查是否是速率限制错误
    if (error.response && error.response.status === 429) {
      return { 
        error: "已达到GitHub API速率限制。请等待一小时后再试，或在设置中添加您的GitHub个人访问令牌以提高限制。",
        isRateLimit: true
      };
    }
    
    // 检查是否是滥用检测错误
    if (error.response && error.response.data && error.response.data.message && 
        error.response.data.message.includes('abuse detection')) {
      return {
        error: "触发了GitHub滥用检测机制。请等待几分钟后再试，或减少请求频率。",
        isAbuse: true
      };
    }
    
    return { error: error.message };
  }
});

// 获取特定仓库详情
ipcMain.handle('get-repo-by-fullname', async (event, repoFullName) => {
  try {
    // 使用请求队列
    return await requestQueue.add(async () => {
      const headers = {
        'User-Agent': 'HubHub-App',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      };
      
      // 只有当令牌存在且不为空时才添加Authorization头
      if (settings.githubToken && settings.githubToken.trim() !== '') {
        headers['Authorization'] = `Bearer ${settings.githubToken}`;
      }
      
      const response = await axios.get(`https://api.github.com/repos/${repoFullName}`, {
        headers: headers
      });
      return response.data;
    });
  } catch (error) {
    log.error('获取仓库详情失败:', error);
    
    // 处理连接错误
    if (error.code === 'ECONNREFUSED' || error.isConnectionError) {
      return { 
        error: `网络连接错误: ${error.message || '无法连接到GitHub API'}`,
        isConnectionError: true
      };
    }
    
    // 检查是否是滥用检测错误
    if (error.response && error.response.data && error.response.data.message && 
        error.response.data.message.includes('abuse detection')) {
      return {
        error: "触发了GitHub滥用检测机制。请等待几分钟后再试，或减少请求频率。",
        isAbuse: true
      };
    }
    
    return { error: error.message };
  }
});

// 获取仓库版本和发布信息
ipcMain.handle('get-repo-releases', async (event, repoFullName) => {
  try {
    // 使用请求队列
    return await requestQueue.add(async () => {
      const headers = {
        'User-Agent': 'HubHub-App',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      };
      
      // 只有当令牌存在且不为空时才添加Authorization头
      if (settings.githubToken && settings.githubToken.trim() !== '') {
        headers['Authorization'] = `Bearer ${settings.githubToken}`;
      }
      
      const response = await axios.get(`https://api.github.com/repos/${repoFullName}/releases`, {
        headers: headers
      });
      return response.data;
    });
  } catch (error) {
    log.error('获取仓库版本失败:', error);
    return { error: error.message };
  }
});

// 获取仓库的README
ipcMain.handle('get-repo-readme', async (event, repoFullName) => {
  try {
    // 使用请求队列和重试函数
    return await requestQueue.add(async () => {
      const headers = {
        'User-Agent': 'HubHub-App',
        'Accept': 'application/vnd.github.raw+json',
        'X-GitHub-Api-Version': '2022-11-28'
      };
      
      // 只有当令牌存在且不为空时才添加Authorization头
      if (settings.githubToken && settings.githubToken.trim() !== '') {
        headers['Authorization'] = `Bearer ${settings.githubToken}`;
      }
      
      // 使用重试函数
      const result = await retryRequest(async () => {
        log.info(`获取README: ${repoFullName}`);
        const response = await axios.get(`https://api.github.com/repos/${repoFullName}/readme`, {
          headers: headers
        });
        return response.data;
      }, 3, 2000);
      
      // 检查结果是否为空
      if (!result) {
        log.warn(`仓库 ${repoFullName} 的README内容为空`);
        return { readme: "该仓库没有README内容或README为空。" };
      }
      
      // 返回格式化的结果
      return { readme: result };
    });
  } catch (error) {
    log.error('获取README失败:', error);
    
    // 处理连接错误
    if (error.code === 'ECONNREFUSED' || error.isConnectionError) {
      return { 
        error: `网络连接错误: ${error.message || '无法连接到GitHub API'}`,
        isConnectionError: true
      };
    }
    
    // 404错误 - 仓库可能不存在README文件
    if (error.response && error.response.status === 404) {
      return { readme: "该仓库没有README文件。" };
    }
    
    // 提供更详细的错误信息
    let errorMessage = error.message;
    if (error.response) {
      errorMessage = `${error.response.status}: ${error.response.statusText}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
      
      // 如果是速率限制错误，添加更多信息
      if (error.response.status === 403 || error.response.status === 429) {
        const resetHeader = error.response.headers['x-ratelimit-reset'];
        if (resetHeader) {
          const resetTime = new Date(parseInt(resetHeader) * 1000);
          errorMessage += ` (重置时间: ${resetTime.toLocaleString()})`;
        }
        
        return {
          error: errorMessage,
          isRateLimit: true
        };
      }
    }
    return { error: errorMessage };
  }
});

// 下载文件
ipcMain.handle('download-file', async (event, url, fileName) => {
  try {
    const savePath = await dialog.showSaveDialog({
      title: '保存文件',
      defaultPath: path.join(settings.downloadPath, fileName),
    });
    
    if (savePath.canceled) {
      return { canceled: true };
    }
    
    const headers = {
      'User-Agent': 'HubHub-App'
    };
    
    // 只有当令牌存在且不为空时才添加Authorization头
    if (settings.githubToken && settings.githubToken.trim() !== '') {
      headers['Authorization'] = `Bearer ${settings.githubToken}`;
    }
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: headers
    });
    
    const totalBytes = parseInt(response.headers['content-length'], 10) || 0;
    let downloadedBytes = 0;
    const downloadId = Date.now().toString(); // 生成唯一下载ID
    
    const writer = fs.createWriteStream(savePath.filePath);
    
    // 创建下载信息对象
    event.sender.send('download-started', {
      id: downloadId,
      fileName: fileName,
      filePath: savePath.filePath,
      totalBytes: totalBytes,
      url: url
    });
    
    // 添加进度监听
    response.data.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      const progress = totalBytes ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
      
      // 发送进度更新事件
      event.sender.send('download-progress', {
        id: downloadId,
        fileName: fileName,
        filePath: savePath.filePath,
        progress: progress,
        downloadedBytes: downloadedBytes,
        totalBytes: totalBytes
      });
    });
    
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        event.sender.send('download-finished', {
          id: downloadId,
          fileName: fileName,
          filePath: savePath.filePath,
          success: true
        });
        
        resolve({ success: true, path: savePath.filePath, id: downloadId });
      });
      
      writer.on('error', error => {
        log.error('下载文件失败:', error);
        
        event.sender.send('download-error', {
          id: downloadId,
          fileName: fileName,
          error: error.message
        });
        
        reject({ error: error.message, id: downloadId });
      });
    });
  } catch (error) {
    log.error('下载文件处理失败:', error);
    return { error: error.message };
  }
});

// 获取热门项目
ipcMain.handle('get-trending-repos', async () => {
  try {
    // 使用请求队列
    return await requestQueue.add(async () => {
      const headers = {
        'User-Agent': 'HubHub-App',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      };
      
      // 只有当令牌存在且不为空时才添加Authorization头
      if (settings.githubToken && settings.githubToken.trim() !== '') {
        headers['Authorization'] = `Bearer ${settings.githubToken}`;
      }
      
      const response = await axios.get('https://api.github.com/search/repositories?q=stars:>10000&sort=stars&order=desc&per_page=20', {
        headers: headers
      });
      return response.data;
    });
  } catch (error) {
    log.error('获取热门项目失败:', error);
    
    // 处理连接错误
    if (error.code === 'ECONNREFUSED' || error.isConnectionError) {
      return { 
        error: `网络连接错误: ${error.message || '无法连接到GitHub API'}`,
        isConnectionError: true
      };
    }
    
    // 检查是否是速率限制错误
    if (error.response && error.response.status === 429) {
      return { 
        error: "已达到GitHub API速率限制。请等待一小时后再试，或在设置中添加您的GitHub个人访问令牌以提高限制。",
        isRateLimit: true
      };
    }
    
    // 检查是否是滥用检测错误
    if (error.response && error.response.data && error.response.data.message && 
        error.response.data.message.includes('abuse detection')) {
      return {
        error: "触发了GitHub滥用检测机制。请等待几分钟后再试，或减少请求频率。",
        isAbuse: true
      };
    }
    
    return { error: error.message };
  }
});

// 获取设置
ipcMain.handle('get-settings', () => {
  return settings;
});

// 保存设置
ipcMain.handle('save-settings', (event, newSettings) => {
  settings = { ...settings, ...newSettings };
  saveSettings();
  return { success: true };
});

// 选择下载路径
ipcMain.handle('select-download-path', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择下载目录'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      settings.downloadPath = result.filePaths[0];
      saveSettings();
      return { path: result.filePaths[0], success: true };
    }
    
    return { canceled: true };
  } catch (error) {
    log.error('选择下载路径失败:', error);
    return { error: error.message };
  }
});

// 获取默认下载路径
ipcMain.handle('get-default-download-path', () => {
  return app.getPath('downloads');
});

// 选择背景图片
ipcMain.handle('select-background-image', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: '选择背景图片',
      filters: [
        { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
      ]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const sourcePath = result.filePaths[0];
      const filename = path.basename(sourcePath);
      const destPath = path.join(backgroundsDir, filename);
      
      // 复制文件到应用数据目录
      fs.copyFileSync(sourcePath, destPath);
      
      // 更新设置
      settings.background = {
        ...settings.background,
        type: 'custom',
        source: 'file',
        filePath: destPath
      };
      saveSettings();
      
      return { 
        success: true, 
        path: destPath, 
        filename: filename 
      };
    }
    
    return { canceled: true };
  } catch (error) {
    log.error('选择背景图片失败:', error);
    return { error: error.message };
  }
});

// 从URL设置背景图片
ipcMain.handle('set-background-from-url', async (event, url) => {
  try {
    // 保存设置
    settings.background = {
      ...settings.background,
      type: 'custom',
      source: 'url',
      url: url
    };
    saveSettings();
    
    return { success: true, url: url };
  } catch (error) {
    log.error('设置背景URL失败:', error);
    return { error: error.message };
  }
});

// 获取仓库图标
ipcMain.handle('get-repo-icon', async (event, repoFullName) => {
  try {
    const [owner, repo] = repoFullName.split('/');
    
    // 创建通用请求头
    const headers = {
      'User-Agent': 'HubHub-App'
    };
    
    // 只有当令牌存在且不为空时才添加Authorization头
    if (settings.githubToken && settings.githubToken.trim() !== '') {
      headers['Authorization'] = `Bearer ${settings.githubToken}`;
    }
    
    // 检查是否已经达到API速率限制，使用缓存数据
    const now = Date.now();
    let remainingRequests = 60; // 默认未认证限制
    
    if (API_RATE_LIMIT_CACHE.data && (now - API_RATE_LIMIT_CACHE.timestamp < API_RATE_LIMIT_CACHE.CACHE_DURATION * 5)) {
      // 使用较长的缓存时间 (5分钟) 来避免频繁检查
      if (API_RATE_LIMIT_CACHE.data.success) {
        remainingRequests = API_RATE_LIMIT_CACHE.data.remaining;
        
        if (remainingRequests <= 5) {
          // 如果剩余请求次数过低，直接返回字母图标
          log.warn('API速率限制接近上限，使用字母图标');
          return {
            success: false,
            letter: repo.charAt(0).toUpperCase(),
            isRateLimit: true
          };
        }
      }
    } else {
      // 只在缓存过期时才真正发起请求
      try {
        const rateLimit = await axios.get('https://api.github.com/rate_limit', {
          headers: headers
        });
        
        remainingRequests = rateLimit.data.resources.core.remaining;
        const limit = rateLimit.data.resources.core.limit;
        const resetTime = new Date(rateLimit.data.resources.core.reset * 1000);
        
        // 更新缓存
        API_RATE_LIMIT_CACHE.data = { 
          success: true, 
          remaining: remainingRequests,
          limit: limit,
          resetTime: resetTime.toLocaleString(),
          isCustomToken: !!(settings.githubToken && settings.githubToken.trim() !== '' && 
                          (settings.githubToken.startsWith('ghp_') || 
                           settings.githubToken.startsWith('github_pat_')))
        };
        API_RATE_LIMIT_CACHE.timestamp = now;
        
        if (remainingRequests <= 5) {
          // 如果剩余请求次数过低，直接返回字母图标
          log.warn('API速率限制接近上限，使用字母图标');
          return {
            success: false,
            letter: repo.charAt(0).toUpperCase(),
            isRateLimit: true
          };
        }
      } catch (error) {
        // 如果检查速率限制时出错，可能已经达到限制
        if (error.response && error.response.status === 429) {
          log.warn('API速率限制已达上限，使用字母图标');
          return {
            success: false,
            letter: repo.charAt(0).toUpperCase(),
            isRateLimit: true
          };
        }
      }
    }
    
    // 尝试获取仓库的社交媒体预览图
    try {
      const previewHeaders = {
        ...headers,
        'Accept': 'application/vnd.github.raw'
      };
      
      const response = await axios.get(`https://api.github.com/repos/${repoFullName}/contents/social-preview.png`, {
        headers: previewHeaders,
        responseType: 'arraybuffer'
      });
      
      if (response.status === 200) {
        // 将图片转为Base64
        return {
          success: true,
          data: `data:image/png;base64,${Buffer.from(response.data).toString('base64')}`
        };
      }
    } catch (error) {
      // 如果没有社交预览图，静默失败
      log.debug('无社交预览图:', error.message);
      
      // 检查是否是速率限制错误
      if (error.response && error.response.status === 429) {
        log.warn('API速率限制已达上限，使用字母图标');
        return {
          success: false,
          letter: repo.charAt(0).toUpperCase(),
          isRateLimit: true
        };
      }
    }
    
    // 尝试获取仓库的logo图片
    try {
      const logoHeaders = {
        ...headers,
        'Accept': 'application/vnd.github.raw'
      };
      
      const response = await axios.get(`https://api.github.com/repos/${repoFullName}/contents/logo.png`, {
        headers: logoHeaders,
        responseType: 'arraybuffer'
      });
      
      if (response.status === 200) {
        // 将图片转为Base64
        return {
          success: true,
          data: `data:image/png;base64,${Buffer.from(response.data).toString('base64')}`
        };
      }
    } catch (error) {
      // 如果没有logo图片，静默失败
      log.debug('无logo图片:', error.message);
      
      // 检查是否是速率限制错误
      if (error.response && error.response.status === 429) {
        log.warn('API速率限制已达上限，使用字母图标');
        return {
          success: false,
          letter: repo.charAt(0).toUpperCase(),
          isRateLimit: true
        };
      }
    }
    
    // 尝试获取组织图标
    try {
      const response = await axios.get(`https://api.github.com/users/${owner}`, {
        headers: headers
      });
      
      if (response.data.avatar_url) {
        return {
          success: true,
          data: response.data.avatar_url
        };
      }
    } catch (error) {
      log.error('获取组织图标失败:', error);
      
      // 检查是否是速率限制错误
      if (error.response && error.response.status === 429) {
        log.warn('API速率限制已达上限，使用字母图标');
        return {
          success: false,
          letter: repo.charAt(0).toUpperCase(),
          isRateLimit: true
        };
      }
    }
    
    // 返回默认图标（第一个字母）
    return {
      success: false,
      letter: repo.charAt(0).toUpperCase()
    };
  } catch (error) {
    log.error('获取仓库图标失败:', error);
    return { 
      success: false, 
      letter: repoFullName.charAt(0).toUpperCase(),
      error: error.message 
    };
  }
});

// 在默认浏览器中打开链接
ipcMain.handle('open-in-browser', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    log.error('打开浏览器失败:', error);
    return { error: error.message };
  }
});

// 获取API速率限制信息
ipcMain.handle('get-api-rate-limit', async () => {
  try {
    // 检查是否有有效缓存
    const now = Date.now();
    if (API_RATE_LIMIT_CACHE.data && (now - API_RATE_LIMIT_CACHE.timestamp < API_RATE_LIMIT_CACHE.CACHE_DURATION)) {
      log.info('使用缓存的GitHub API速率限制数据');
      return API_RATE_LIMIT_CACHE.data;
    }
    
    const headers = {
      'User-Agent': 'HubHub-App',
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    
    // 只有当令牌存在且不为空时才添加Authorization头
    if (settings.githubToken && settings.githubToken.trim() !== '') {
      headers['Authorization'] = `Bearer ${settings.githubToken}`;
    }
    
    const response = await axios.get('https://api.github.com/rate_limit', {
      headers: headers
    });
    
    const rateLimit = response.data.resources.core;
    const remaining = rateLimit.remaining;
    const limit = rateLimit.limit;
    const resetTime = new Date(rateLimit.reset * 1000);
    
    log.info(`获取GitHub API速率限制: ${remaining}/${limit}, 重置时间: ${resetTime.toLocaleString()}`);
    
    const result = { 
      success: true, 
      remaining: remaining,
      limit: limit,
      resetTime: resetTime.toLocaleString(),
      isCustomToken: !!(settings.githubToken && settings.githubToken.trim() !== '' && 
                      (settings.githubToken.startsWith('ghp_') || 
                       settings.githubToken.startsWith('github_pat_')))
    };
    
    // 更新缓存
    API_RATE_LIMIT_CACHE.data = result;
    API_RATE_LIMIT_CACHE.timestamp = now;
    
    return result;
  } catch (error) {
    log.error('获取API速率限制失败:', error);
    return { 
      success: false, 
      error: error.message,
      errorCode: error.response ? error.response.status : 'NETWORK_ERROR'
    };
  }
});

// 检查GitHub API速率限制
async function checkApiRateLimit() {
  try {
    // 使用缓存的数据或重新获取
    let rateLimitData;
    const now = Date.now();
    
    if (API_RATE_LIMIT_CACHE.data && (now - API_RATE_LIMIT_CACHE.timestamp < API_RATE_LIMIT_CACHE.CACHE_DURATION)) {
      rateLimitData = API_RATE_LIMIT_CACHE.data;
      log.info('使用缓存的API速率限制数据进行检查');
    } else {
      const headers = {
        'User-Agent': 'HubHub-App',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      };
      
      // 只有当令牌存在且不为空时才添加Authorization头
      if (settings.githubToken && settings.githubToken.trim() !== '') {
        headers['Authorization'] = `Bearer ${settings.githubToken}`;
      }
      
      const response = await axios.get('https://api.github.com/rate_limit', {
        headers: headers
      });
      
      const rateLimit = response.data.resources.core;
      const remaining = rateLimit.remaining;
      const limit = rateLimit.limit;
      const resetTime = new Date(rateLimit.reset * 1000);
      
      rateLimitData = { 
        success: true, 
        remaining: remaining,
        limit: limit,
        resetTime: resetTime.toLocaleString(),
        isCustomToken: !!(settings.githubToken && settings.githubToken.trim() !== '' && 
                        (settings.githubToken.startsWith('ghp_') || 
                         settings.githubToken.startsWith('github_pat_')))
      };
      
      // 更新缓存
      API_RATE_LIMIT_CACHE.data = rateLimitData;
      API_RATE_LIMIT_CACHE.timestamp = now;
      
      log.info(`GitHub API速率限制: ${remaining}/${limit}, 重置时间: ${resetTime.toLocaleString()}`);
    }
    
    // 只在剩余请求次数低于10%时显示警告
    if (rateLimitData.success && rateLimitData.remaining < rateLimitData.limit * 0.1) {
      const warningMessage = `GitHub API速率限制即将耗尽！剩余: ${rateLimitData.remaining}/${rateLimitData.limit}\n限制将在${rateLimitData.resetTime}重置。\n建议在设置中添加GitHub个人访问令牌以提高限制。`;
      
      dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'API速率限制警告',
        message: warningMessage,
        buttons: ['好的', '打开设置'],
        defaultId: 0,
        cancelId: 0
      }).then(result => {
        if (result.response === 1) {
          // 用户点击了"打开设置"
          mainWindow.webContents.send('open-settings');
        }
      });
    }
  } catch (error) {
    log.error('检查API速率限制失败:', error);
  }
}

// 验证GitHub令牌
async function validateGithubTokens(tokens) {
  for (const token of tokens) {
    try {
      const headers = {
        'User-Agent': 'HubHub-App',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      };
      
      const response = await axios.get('https://api.github.com/rate_limit', {
        headers: headers
      });
      
      if (response.status === 200) {
        log.info(`令牌验证成功，剩余请求次数: ${response.data.resources.core.remaining}`);
        return token;
      }
    } catch (error) {
      log.warn(`令牌验证失败: ${token.substring(0, 8)}...`);
    }
  }
  
  return null;
} 