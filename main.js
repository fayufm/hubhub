const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const https = require('https');
const http = require('http');

// 运行引导脚本
try {
  require('./bootstrap');
  console.log('引导脚本已执行');
} catch (error) {
  console.error('引导脚本执行失败:', error);
}

// 初始化electron-store
Store.initRenderer();

// 禁用证书验证 - 确保在应用程序任何位置发出的所有请求都不验证证书
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 主窗口
let mainWindow;

// 下载项管理
const downloads = new Map();

// 默认token（隐藏显示）
// const PRIMARY_TOKEN = '***REMOVED***xxx...'; // ← 示例，实际内容请自行配置
const PRIMARY_TOKEN = '';
// const SECONDARY_TOKEN = '***REMOVED***xxx...'; // ← 示例，实际内容请自行配置
const SECONDARY_TOKEN = '';
// const TERTIARY_TOKEN = '***REMOVED***xxx...'; // ← 示例，实际内容请自行配置
const TERTIARY_TOKEN = '';
// const DEFAULT_TOKEN = '***REMOVED***xxx...'; // ← 示例，实际内容请自行配置
const DEFAULT_TOKEN = '';

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
    icon: path.join(__dirname, 'assets/26.ico'), // 设置应用图标
    show: false // 先隐藏窗口
  });

  // 隐藏默认菜单栏
  mainWindow.setMenuBarVisibility(false);
  mainWindow.removeMenu();

  mainWindow.loadFile('index.html');

  // 窗口准备好后再显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 添加程序退出前的清理函数
app.on('before-quit', () => {
  console.log('应用程序即将退出，清理所有下载任务...');
  cleanupAllDownloads();
});

// 清理所有下载任务的函数
function cleanupAllDownloads() {
  if (downloads.size === 0) {
    console.log('没有需要清理的下载任务');
    return;
  }
  
  console.log(`正在清理 ${downloads.size} 个下载任务`);
  
  // 保存所有下载ID以防在迭代过程中Map发生变化
  const downloadIds = Array.from(downloads.keys());
  
  // 取消每个下载
  downloadIds.forEach(id => {
    const downloadInfo = downloads.get(id);
    if (!downloadInfo) return;
    
    console.log(`清理下载任务: ${id} - ${downloadInfo.filename}`);
    
    // 立即标记为取消状态
    downloadInfo.status = 'cancelled';
    
    // 中断网络请求
    if (downloadInfo.request) {
      try {
        if (typeof downloadInfo.request.abort === 'function') {
          downloadInfo.request.abort();
        }
        
        if (typeof downloadInfo.request.destroy === 'function') {
          downloadInfo.request.destroy();
        }
        
        // 移除所有事件监听器
        if (typeof downloadInfo.request.removeAllListeners === 'function') {
          downloadInfo.request.removeAllListeners();
        }
        
        downloadInfo.request = null;
      } catch (err) {
        console.error(`终止请求出错: ${err.message}`);
      }
    }
    
    // 关闭文件流
    if (downloadInfo.fileStream) {
      try {
        downloadInfo.fileStream.end();
        if (typeof downloadInfo.fileStream.destroy === 'function') {
          downloadInfo.fileStream.destroy();
        }
        downloadInfo.fileStream = null;
      } catch (err) {
        console.error(`关闭文件流出错: ${err.message}`);
      }
    }
  });
  
  // 清空下载映射
  downloads.clear();
  console.log('所有下载任务已清理完毕');
}

// 监听所有窗口关闭事件，确保清理下载
app.on('window-all-closed', () => {
  console.log('所有窗口已关闭，清理所有下载任务...');
  cleanupAllDownloads();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 监听will-quit事件，确保清理下载
app.on('will-quit', () => {
  console.log('应用程序will-quit，清理所有下载任务...');
  cleanupAllDownloads();
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

// 打开文件
ipcMain.on('open-file', (event, { path }) => {
  if (path) {
    const { shell } = require('electron');
    shell.openPath(path).catch(err => {
      console.error('打开文件失败:', err);
    });
  }
});

// 打开文件夹
ipcMain.on('open-folder', (event, { path }) => {
  if (path) {
    const { shell } = require('electron');
    shell.showItemInFolder(path);
  }
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
  
  // 如果存在同名文件但未完成，先删除
  if (fs.existsSync(filePath)) {
    try {
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        fs.unlinkSync(filePath);
        console.log(`删除空文件: ${filePath}`);
      }
    } catch (err) {
      console.error('检查文件失败:', err);
    }
  }
  
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
    startTime: Date.now(),
    request: null,
    fileStream: file
  });
  
  console.log(`开始下载: ${url} -> ${filePath}`);
  
  // 发送请求
  try {
    const request = requestModule.get(url, (response) => {
      // 检查是否重定向
      if (response.statusCode === 301 || response.statusCode === 302) {
        // 关闭文件流防止资源泄漏
        file.end();
        
        // 如果文件已创建但为空，删除它
        try {
          const stats = fs.statSync(filePath);
          if (stats.size === 0) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error('清理空文件失败:', err);
        }
        
        const redirectUrl = response.headers.location;
        console.log(`下载重定向: ${url} -> ${redirectUrl}`);
        
        // 从下载映射中获取并更新信息
        const downloadInfo = downloads.get(id);
        if (downloadInfo) {
          downloadInfo.fileStream = null;
          downloadInfo.request = null;
        }
        
        // 通知渲染进程处理重定向
        event.sender.send('download-redirect', { id, url: redirectUrl });
        
        // 从下载列表中移除
        downloads.delete(id);
        return;
      }
      
      // 检查响应状态
      if (response.statusCode !== 200) {
        file.end();
        
        // 从下载列表中移除
        downloads.delete(id);
        
        event.sender.send('download-error', { 
          id, 
          error: `下载失败，状态码: ${response.statusCode}` 
        });
        return;
      }
      
      // 获取文件大小
      const totalSize = parseInt(response.headers['content-length'], 10);
      const downloadInfo = downloads.get(id);
      
      if (downloadInfo) {
        downloadInfo.size = totalSize || 0; // 防止NaN
        downloads.set(id, downloadInfo);
      } else {
        console.error(`找不到下载信息: ${id}`);
        response.destroy(); // 终止响应
        file.end();
        return;
      }
      
      // 更新进度
      let downloaded = 0;
      
      response.on('data', (chunk) => {
        // 检查下载是否已取消
        const currentInfo = downloads.get(id);
        if (!currentInfo || currentInfo.status === 'cancelled') {
          console.log(`下载已取消，终止接收数据: ${id}`);
          response.destroy(); // 立即终止响应
          file.end();
          return;
        }
        
        // 写入数据
        file.write(chunk);
        downloaded += chunk.length;
        
        // 计算进度
        const progress = Math.floor((downloaded / (totalSize || 1)) * 100);
        const currentTime = Date.now();
        const elapsedTime = (currentTime - downloadInfo.startTime) / 1000; // 秒
        const speed = downloaded / (elapsedTime || 1); // 字节/秒，防止除零
        
        // 更新下载信息
        if (downloads.has(id)) {
          const updatedInfo = downloads.get(id);
          updatedInfo.progress = progress;
          updatedInfo.downloaded = downloaded;
          updatedInfo.speed = speed;
          downloads.set(id, updatedInfo);
          
          // 通知渲染进程更新进度
          event.sender.send('download-progress', {
            id,
            progress,
            downloaded,
            size: totalSize || downloaded, // 如果没有总大小，使用已下载大小
            speed
          });
        }
      });
      
      response.on('end', () => {
        // 检查下载状态
        const finalInfo = downloads.get(id);
        
        if (finalInfo && finalInfo.status !== 'cancelled') {
          file.end();
          
          console.log(`下载完成: ${filePath}`);
          
          // 更新下载状态
          finalInfo.status = 'completed';
          finalInfo.progress = 100;
          finalInfo.request = null;
          finalInfo.fileStream = null;
          downloads.set(id, finalInfo);
          
          // 通知渲染进程下载完成
          event.sender.send('download-complete', {
            id,
            filePath
          });
        } else {
          console.log(`下载已取消或无法找到，不进行完成处理: ${id}`);
          // 确保文件流关闭
          file.end();
        }
      });
      
      response.on('error', (error) => {
        console.error(`响应错误: ${error.message}`);
        file.end();
        
        if (downloads.has(id)) {
          const errorInfo = downloads.get(id);
          errorInfo.status = 'error';
          errorInfo.request = null;
          errorInfo.fileStream = null;
          downloads.set(id, errorInfo);
        }
        
        // 通知渲染进程下载错误
        event.sender.send('download-error', {
          id,
          error: error.message
        });
      });
    });
    
    // 保存请求实例
    if (downloads.has(id)) {
      const downloadInfo = downloads.get(id);
      downloadInfo.request = request;
      downloads.set(id, downloadInfo);
      
      // 设置请求超时
      request.setTimeout(30000, () => {
        console.log(`下载请求超时: ${id}`);
        request.destroy();
        
        if (downloads.has(id)) {
          const timeoutInfo = downloads.get(id);
          timeoutInfo.status = 'error';
          timeoutInfo.request = null;
          downloads.set(id, timeoutInfo);
        }
        
        file.end();
        
        // 通知渲染进程下载错误
        event.sender.send('download-error', {
          id,
          error: '下载请求超时'
        });
      });
    }
    
    // 处理请求错误
    request.on('error', (error) => {
      console.error(`请求错误: ${error.message}`);
      
      // 关闭文件流
      file.end();
      
      // 更新下载状态
      if (downloads.has(id)) {
        const errorInfo = downloads.get(id);
        errorInfo.status = 'error';
        errorInfo.request = null;
        errorInfo.fileStream = null;
        downloads.set(id, errorInfo);
      }
      
      // 通知渲染进程下载错误
      event.sender.send('download-error', {
        id,
        error: error.message
      });
    });
  } catch (error) {
    console.error(`创建下载请求失败: ${error.message}`);
    
    // 关闭文件流
    file.end();
    
    // 从下载列表中移除
    downloads.delete(id);
    
    // 通知渲染进程下载错误
    event.sender.send('download-error', {
      id,
      error: error.message
    });
  }
});

// 取消下载
ipcMain.on('cancel-download', (event, { id }) => {
  console.log(`收到取消下载请求: ${id}`);
  
  if (downloads.has(id)) {
    const downloadInfo = downloads.get(id);
    
    // 立即标记为取消状态
    downloadInfo.status = 'cancelled';
    downloads.set(id, downloadInfo);
    
    console.log(`标记下载为已取消: ${id}`);
    
    // 中断网络请求
    if (downloadInfo.request) {
      console.log(`正在终止网络请求: ${id}`);
      
      try {
        // 尝试各种方法终止请求
        if (typeof downloadInfo.request.abort === 'function') {
          downloadInfo.request.abort();
          console.log(`已调用 abort: ${id}`);
        }
        
        if (typeof downloadInfo.request.destroy === 'function') {
          downloadInfo.request.destroy();
          console.log(`已调用 destroy: ${id}`);
        }

        // 强制关闭所有连接和事件监听
        downloadInfo.request.removeAllListeners('data');
        downloadInfo.request.removeAllListeners('end');
        downloadInfo.request.removeAllListeners('error');
        downloadInfo.request.removeAllListeners('close');
        
        // 清除请求对象引用
        downloadInfo.request = null;
      } catch (err) {
        console.error(`终止请求出错: ${err.message}`);
      }
    }
    
    // 关闭文件流
    if (downloadInfo.fileStream) {
      console.log(`关闭文件流: ${downloadInfo.filePath}`);
      
      try {
        // 强制刷新并关闭文件流
        downloadInfo.fileStream.end();
        downloadInfo.fileStream.destroy();
        downloadInfo.fileStream = null;
      } catch (err) {
        console.error(`关闭文件流出错: ${err.message}`);
      }
    }
    
    // 删除未完成的文件
    if (downloadInfo.filePath && fs.existsSync(downloadInfo.filePath)) {
      try {
        // 确保文件句柄已释放后再删除
        setTimeout(() => {
          try {
            fs.unlinkSync(downloadInfo.filePath);
            console.log(`已删除未完成文件: ${downloadInfo.filePath}`);
          } catch (delErr) {
            console.error(`延迟删除文件失败: ${delErr.message}`);
          }
        }, 500);
      } catch (err) {
        console.error(`删除文件出错: ${err.message}`);
      }
    }
    
    // 从下载映射中移除
    downloads.delete(id);
    
    // 通知渲染进程下载已取消
    console.log(`发送取消确认通知: ${id}`);
    event.sender.send('download-cancelled', { id });
  } else {
    console.log(`找不到下载ID: ${id}`);
    event.sender.send('download-cancelled', { id });
  }
}); 