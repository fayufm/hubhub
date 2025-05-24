const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const https = require('https');
const http = require('http');

// 初始化electron-store
Store.initRenderer();

// 禁用证书验证
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 主窗口
let mainWindow;

// 下载项管理
const downloads = new Map();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // 移除默认窗口边框
    titleBarStyle: 'hidden', // 隐藏标题栏但保留窗口控制按钮
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    backgroundColor: '#f5f5f5', // 设置背景色
    icon: path.join(__dirname, 'assets/26.ico') // 设置应用图标
  });

  // 隐藏默认菜单栏
  mainWindow.setMenuBarVisibility(false);
  mainWindow.removeMenu();

  mainWindow.loadFile('index.html');
  // 开发时打开开发者工具
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 窗口控制 - 最小化
ipcMain.on('window-minimize', () => {
  mainWindow.minimize();
});

// 窗口控制 - 最大化/还原
ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

// 窗口控制 - 关闭
ipcMain.on('window-close', () => {
  mainWindow.close();
});

// 选择下载路径
ipcMain.handle('select-download-path', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  
  return null;
});

// 选择文件
ipcMain.handle('select-file', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    ...options
  });
  
  return result;
});

// 读取文件
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    return fs.readFileSync(filePath);
  } catch (error) {
    console.error('读取文件失败:', error);
    throw error;
  }
});

// 开始下载
ipcMain.on('start-download', (event, { url, filename, downloadPath, id }) => {
  // 确保下载目录存在
  if (!fs.existsSync(downloadPath)) {
    try {
      fs.mkdirSync(downloadPath, { recursive: true });
    } catch (err) {
      event.sender.send('download-error', { id, error: '创建下载目录失败' });
      return;
    }
  }
  
  const filePath = path.join(downloadPath, filename);
  const file = fs.createWriteStream(filePath);
  
  // 选择http或https模块
  const requestModule = url.startsWith('https') ? https : http;
  
  // 初始化下载状态
  downloads.set(id, {
    url,
    filename,
    filePath,
    status: 'downloading',
    progress: 0,
    size: 0,
    downloaded: 0,
    speed: 0,
    startTime: Date.now()
  });
  
  // 发送请求
  const request = requestModule.get(url, (response) => {
    // 检查是否重定向
    if (response.statusCode === 301 || response.statusCode === 302) {
      const redirectUrl = response.headers.location;
      event.sender.send('download-redirect', { id, url: redirectUrl });
      downloads.delete(id);
      return;
    }
    
    // 检查响应状态
    if (response.statusCode !== 200) {
      event.sender.send('download-error', { 
        id, 
        error: `下载失败，状态码: ${response.statusCode}` 
      });
      downloads.delete(id);
      return;
    }
    
    // 获取文件大小
    const totalSize = parseInt(response.headers['content-length'], 10);
    const downloadInfo = downloads.get(id);
    downloadInfo.size = totalSize;
    downloads.set(id, downloadInfo);
    
    // 更新进度
    let downloaded = 0;
    
    response.on('data', (chunk) => {
      file.write(chunk);
      downloaded += chunk.length;
      
      // 计算进度
      const progress = Math.floor((downloaded / totalSize) * 100);
      const currentTime = Date.now();
      const elapsedTime = (currentTime - downloadInfo.startTime) / 1000; // 秒
      const speed = downloaded / elapsedTime; // 字节/秒
      
      // 更新下载信息
      const updatedInfo = {
        ...downloadInfo,
        progress,
        downloaded,
        speed
      };
      downloads.set(id, updatedInfo);
      
      // 通知渲染进程更新进度
      event.sender.send('download-progress', {
        id,
        progress,
        downloaded,
        size: totalSize,
        speed
      });
    });
    
    response.on('end', () => {
      file.end();
      
      // 更新下载状态
      const finalInfo = downloads.get(id);
      finalInfo.status = 'completed';
      finalInfo.progress = 100;
      downloads.set(id, finalInfo);
      
      // 通知渲染进程下载完成
      event.sender.send('download-complete', {
        id,
        filePath
      });
    });
  });
  
  request.on('error', (error) => {
    file.end();
    
    // 更新下载状态
    if (downloads.has(id)) {
      const errorInfo = downloads.get(id);
      errorInfo.status = 'error';
      downloads.set(id, errorInfo);
    }
    
    // 通知渲染进程下载错误
    event.sender.send('download-error', {
      id,
      error: error.message
    });
  });
});

// 取消下载
ipcMain.on('cancel-download', (event, { id }) => {
  if (downloads.has(id)) {
    const downloadInfo = downloads.get(id);
    
    // 如果文件正在写入，尝试关闭它
    if (downloadInfo.status === 'downloading') {
      try {
        // 删除未完成的文件
        if (fs.existsSync(downloadInfo.filePath)) {
          fs.unlinkSync(downloadInfo.filePath);
        }
      } catch (err) {
        console.error('删除未完成的文件失败:', err);
      }
    }
    
    // 更新状态并通知渲染进程
    downloadInfo.status = 'cancelled';
    downloads.set(id, downloadInfo);
    event.sender.send('download-cancelled', { id });
  }
}); 