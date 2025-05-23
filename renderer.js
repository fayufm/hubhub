// requestIdleCallback polyfill
window.requestIdleCallback = window.requestIdleCallback || 
  function(callback, options) {
    const start = Date.now();
    return setTimeout(function() {
      callback({
        didTimeout: false,
        timeRemaining: function() {
          return Math.max(0, 50 - (Date.now() - start));
        }
      });
    }, options?.timeout || 1);
  };

window.cancelIdleCallback = window.cancelIdleCallback || 
  function(id) {
    clearTimeout(id);
  };

// 性能检测和优化
(function detectPerformance() {
  const performanceMetrics = {
    fps: 0,
    frameTime: 0,
    deviceMemory: navigator.deviceMemory || 4, // 默认假设4GB
    hardwareConcurrency: navigator.hardwareConcurrency || 4, // 默认假设4核
    isLowEndDevice: false,
    scrollFPS: 0, // 滚动时的FPS
    lastScrollTime: 0, // 上次滚动时间
    scrollSamples: [] // 滚动FPS采样
  };

  // 检测设备性能
  function checkDevicePerformance() {
    // 检查是否为低端设备
    const isLowMemory = performanceMetrics.deviceMemory <= 4; // 4GB或更少内存
    const isLowCPU = performanceMetrics.hardwareConcurrency <= 2; // 双核或更低
    const isLowFPS = performanceMetrics.fps < 30; // 低于30fps视为低性能
    const isHighFrameTime = performanceMetrics.frameTime > 30; // 帧时间超过30ms
    const isLowScrollFPS = performanceMetrics.scrollFPS > 0 && performanceMetrics.scrollFPS < 45; // 滚动FPS低于45

    // 根据条件判断是否为低端设备
    performanceMetrics.isLowEndDevice = isLowMemory || isLowCPU || isLowFPS || isHighFrameTime || isLowScrollFPS;

    // 应用性能优化
    if (performanceMetrics.isLowEndDevice) {
      console.log('检测到低性能设备，启用性能优化模式');
      document.body.classList.add('low-performance-mode');
      
      // 存储设置，以便其他函数使用
      window.appPerformance = {
        isLowEndDevice: true,
        useBatchProcessing: true,
        useVirtualization: true,
        reduceAnimations: true,
        useEventDelegation: true,
        frameInterval: 100, // 低端设备的帧间隔
        scrollOptimization: true // 启用滚动优化
      };
    } else {
      console.log('检测到高性能设备，使用普通模式');
      document.body.classList.remove('low-performance-mode');
      
      // 高端设备的设置
      window.appPerformance = {
        isLowEndDevice: false,
        useBatchProcessing: false,
        useVirtualization: true, // 虚拟化对所有设备都有好处
        reduceAnimations: false,
        useEventDelegation: true,
        frameInterval: 16, // 约60fps
        scrollOptimization: false
      };
    }
  }

  // 测量FPS
  function measurePerformance() {
    let lastTime = performance.now();
    let frames = 0;
    let totalFrameTime = 0;
    
    // 初始化滚动性能测量
    window.addEventListener('scroll', () => {
      const now = performance.now();
      
      // 如果距离上次滚动超过16ms（约60fps），记录滚动FPS样本
      if (now - performanceMetrics.lastScrollTime >= 16) {
        const scrollDelta = now - performanceMetrics.lastScrollTime;
        performanceMetrics.lastScrollTime = now;
        
        // 计算即时滚动FPS
        const instantFPS = 1000 / scrollDelta;
        
        // 添加到样本集合，最多保存10个样本
        performanceMetrics.scrollSamples.push(instantFPS);
        if (performanceMetrics.scrollSamples.length > 10) {
          performanceMetrics.scrollSamples.shift();
        }
        
        // 计算平均滚动FPS
        if (performanceMetrics.scrollSamples.length > 0) {
          const sum = performanceMetrics.scrollSamples.reduce((a, b) => a + b, 0);
          performanceMetrics.scrollFPS = Math.round(sum / performanceMetrics.scrollSamples.length);
          
          // 如果滚动FPS过低，立即优化
          if (performanceMetrics.scrollFPS < 30) {
            document.body.classList.add('optimize-scroll');
          } else if (performanceMetrics.scrollFPS > 50) {
            document.body.classList.remove('optimize-scroll');
          }
        }
      }
    }, { passive: true });
    
    function frame() {
      const now = performance.now();
      const frameTime = now - lastTime;
      
      frames++;
      totalFrameTime += frameTime;
      
      if (totalFrameTime >= 1000) {
        // 计算平均FPS和帧时间
        performanceMetrics.fps = Math.round(frames * 1000 / totalFrameTime);
        performanceMetrics.frameTime = totalFrameTime / frames;
        
        // 打印性能信息
        if (performanceMetrics.scrollFPS > 0) {
          console.log(`性能: ${performanceMetrics.fps}FPS, 滚动: ${performanceMetrics.scrollFPS}FPS`);
        }
        
        // 重置计数器
        frames = 0;
        totalFrameTime = 0;
        
        // 检查并应用性能优化
        checkDevicePerformance();
      }
      
      lastTime = now;
      requestAnimationFrame(frame);
    }
    
    // 启动性能测量
    requestAnimationFrame(frame);
  }

  // 在DOM加载后进行性能检测
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // 首先根据硬件信息进行初步判断
      checkDevicePerformance();
      // 然后开始测量实际性能
      setTimeout(() => measurePerformance(), 1000);
    });
  } else {
    // 如果DOM已加载，直接执行
    checkDevicePerformance();
    setTimeout(() => measurePerformance(), 1000);
  }
})();

// DOM元素
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const searchIcon = document.getElementById('search-icon');
const searchHelpButton = document.getElementById('search-help-button');
const searchTooltip = document.getElementById('search-tooltip');
const closeTooltip = document.getElementById('close-tooltip');
const trendingButton = document.getElementById('trending-button');
const randomButton = document.getElementById('random-button');
const searchResults = document.getElementById('search-results');
const repoDetail = document.getElementById('repo-detail');
const trendingView = document.getElementById('trending-view');
const randomView = document.getElementById('random-view');
const settingsView = document.getElementById('settings-view');
const settingsOverlay = document.getElementById('settings-overlay');
const closeSettings = document.getElementById('close-settings');
const backButton = document.getElementById('back-button');
const repoName = document.getElementById('repo-name');
const repoMeta = document.getElementById('repo-meta');
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');
const readmeContent = document.getElementById('readme-content');
const releasesContent = document.getElementById('releases-content');
const codeContent = document.getElementById('code-content');
const minimizeButton = document.getElementById('minimize-button');
const maximizeButton = document.getElementById('maximize-button');
const closeButton = document.getElementById('close-button');
const settingsButton = document.getElementById('settings-button');
const backgroundOverlay = document.getElementById('background-overlay');

// 下载管理相关元素
let downloadsManager = {
  activeDownloads: 0,  // 当前活跃下载数量
  container: null,     // 下载提示容器
  indicator: null,     // 下载进度指示器
  notifications: [],   // 下载通知列表
  downloads: {},       // 下载任务列表 {id: {id, fileName, progress, totalBytes, downloadedBytes, status}}
  progressModal: null, // 下载进度模态框
  progressList: null   // 下载进度列表容器
};

// 中心搜索栏相关元素
const centerSearchContainer = document.getElementById('center-search-container');
const centerSearchInput = document.getElementById('center-search-input');
const centerSearchButton = document.getElementById('center-search-button');
const centerSearchIcon = document.getElementById('center-search-icon');
const bottomControlBar = document.getElementById('bottom-control-bar');
const bottomToolsContainer = document.getElementById('bottom-tools-container');
const bottomSettingsButton = document.getElementById('bottom-settings-button');
const bottomSearchHelpButton = document.getElementById('bottom-search-help-button');

// 设置相关元素
const themeLight = document.getElementById('theme-light');
const themeDark = document.getElementById('theme-dark');
const themeGithub = document.getElementById('theme-github');
const themeFlower = document.getElementById('theme-flower');
const primaryColorPicker = document.getElementById('primary-color');
const applyThemeButton = document.getElementById('apply-theme');
const downloadPathInput = document.getElementById('download-path');
const browseDownloadPathButton = document.getElementById('browse-download-path');
const githubTokenInput = document.getElementById('github-token');
const saveTokenButton = document.getElementById('save-token');
const saveSettingsButton = document.getElementById('save-settings');
const resetSettingsButton = document.getElementById('reset-settings');
const sponsorButton = document.getElementById('sponsor-button');
const flowerImage = document.getElementById('flower-image');

// 花朵颜色变换计时器
let flowerColorInterval = null;

// 背景设置相关元素
const bgNone = document.getElementById('bg-none');
const bgCustom = document.getElementById('bg-custom');
const bgCustomSection = document.getElementById('bg-custom-section');
const bgUpload = document.getElementById('bg-upload');
const bgUploadButton = document.getElementById('bg-upload-button');
const bgFilename = document.getElementById('bg-filename');
const bgUrl = document.getElementById('bg-url');
const bgUrlApply = document.getElementById('bg-url-apply');
const bgOpacity = document.getElementById('bg-opacity');
const bgOpacityValue = document.getElementById('bg-opacity-value');
const bgBlur = document.getElementById('bg-blur');
const bgBlurValue = document.getElementById('bg-blur-value');
const bgPreviewContainer = document.getElementById('bg-preview-container');

// 当前查看的仓库
let currentRepo = null;

// 应用设置
let appSettings = {
  theme: 'github',
  primaryColor: '#2ea44f',
  downloadPath: '',
  githubToken: '',
  specialThemes: {
    flower: false
  },
  background: {
    type: 'none',
    source: 'url',
    url: '',
    filePath: '',
    opacity: 0.3,
    blur: 5
  }
};

// 添加变量用于记录导航历史
let navigationHistory = {
  currentView: null,
  previousView: null,
  lastSearch: null,
  lastSearchContainer: null
};

// 添加滚动加载相关变量
let isLoadingMore = false;
let currentPage = 1;
let hasMoreItems = true;
let lastContainerScrolled = null;

// 添加变量用于记录应用状态
let appState = {
  isInitialState: true, // 是否是初始状态（中心搜索栏显示）
  hasSearched: false, // 是否已经搜索过
  hasNavigated: false // 是否已经导航到其他页面
};

// 辅助函数：统一处理设置页面显示
function showSettings() {
  if (settingsOverlay && settingsView) {
    // 禁用页面上所有的过渡动画，确保不会出现跳动
    document.body.classList.add('disable-transitions');
    // 阻止鼠标事件干扰，但保留设置视图的滚动功能
    document.body.classList.add('modal-open');
    
    // 禁用过渡动画以准确定位元素
    settingsView.style.transition = 'none';
    settingsOverlay.style.transition = 'none';
    
    // 先设置精确位置并隐藏
    settingsView.style.top = '50%';
    settingsView.style.left = '50%';
    settingsView.style.transform = 'translate(-50%, -50%)';
    settingsView.style.visibility = 'hidden';
    // 确保设置可以滚动
    settingsView.style.overflow = '';
    settingsView.style.overflowY = 'auto';
    
    // 确保其他元素不会改变位置
    if (bottomControlBar) bottomControlBar.style.transition = 'none';
    if (searchTooltip) searchTooltip.style.transition = 'none';
    
    
    // 设置display:block
    settingsOverlay.style.display = 'block';
    settingsView.style.display = 'block';
    
    // 强制浏览器重绘
    void settingsView.offsetWidth;
    
    // 恢复过渡动画
    setTimeout(() => {
      settingsView.style.transition = '';
      settingsView.style.visibility = 'visible';
      settingsOverlay.style.transition = '';
      if (bottomControlBar) bottomControlBar.style.transition = '';
      if (searchTooltip) searchTooltip.style.transition = '';
      
      // 添加active类以触发过渡效果
      requestAnimationFrame(() => {
        settingsOverlay.classList.add('active');
        settingsView.classList.add('active');
        
        // 更新设置UI
        updateSettingsUI();
        
        // 恢复所有过渡动画
        document.body.classList.remove('disable-transitions');
      });
    }, 50);
  } else {
    console.error('无法找到设置相关元素!');
  }
}

// 辅助函数：统一处理设置页面隐藏
function hideSettings() {
  if (settingsOverlay && settingsView) {
    // 先移除active类以触发过渡效果
    settingsOverlay.classList.remove('active');
    settingsView.classList.remove('active');
    
    // 等待过渡效果完成后再隐藏元素
    setTimeout(() => {
      settingsOverlay.style.display = 'none';
      settingsView.style.display = 'none';
      // 移除鼠标事件阻止
      document.body.classList.remove('modal-open');
    }, 300); // 与CSS中的transition时间相匹配
  }
}

// 初始化设置
async function initSettings() {
  try {
    // 获取设置
    const settings = await window.api.getSettings();
    
    // 确保背景设置的一致性
    if (settings.background && settings.background.type === 'none') {
      // 如果背景类型是none，确保清除相关URL和文件路径
      settings.background.url = '';
      settings.background.filePath = '';
      settings.background.source = 'url'; // 默认为url源
      console.log('初始化：背景类型为none，已清除背景相关设置');
    }
    
    appSettings = settings;
    
    // 更新UI
    updateSettingsUI();
    
    // 应用主题
    applyTheme(settings.theme, settings.primaryColor);
    
    // 应用背景
    applyBackground();
  } catch (error) {
    console.error('初始化设置失败:', error);
  }
}

// 更新设置UI
function updateSettingsUI() {
  // 设置主题单选按钮
  switch (appSettings.theme) {
    case 'light':
      themeLight.checked = true;
      break;
    case 'dark':
      themeDark.checked = true;
      break;
    case 'github':
    default:
      themeGithub.checked = true;
      break;
  }
  
  // 设置特殊主题复选框
  themeFlower.checked = appSettings.specialThemes.flower;
  
  // 设置主色调
  primaryColorPicker.value = appSettings.primaryColor;
  
  // 设置下载路径
  downloadPathInput.value = appSettings.downloadPath;
  
  // 设置GitHub Token
  if (appSettings.githubToken && appSettings.githubToken.startsWith('ghp_')) {
    // 如果是内置token，显示占位符而非实际token
    githubTokenInput.value = ''; 
    githubTokenInput.placeholder = '使用内置令牌（推荐用自己的令牌替换）';
  } else if (!appSettings.githubToken || appSettings.githubToken.trim() === '') {
    // 如果没有令牌，显示可选提示
    githubTokenInput.value = '';
    githubTokenInput.placeholder = '强烈建议添加GitHub令牌以避免API限制错误';
    
    // 添加视觉提示
    githubTokenInput.classList.add('token-needed');
    
    // 添加提示信息
    const tokenAlert = document.createElement('div');
    tokenAlert.className = 'token-alert';
    tokenAlert.innerHTML = `
      <i class="alert-icon">⚠️</i>
      <span>检测到API速率限制问题！添加GitHub个人访问令牌可以解决"403: rate limit exceeded"错误。</span>
      <a href="https://github.com/settings/tokens" target="_blank" class="token-link">创建令牌</a>
    `;
    
    // 如果已经存在提示，则不重复添加
    if (!document.querySelector('.token-alert')) {
      const tokenSection = githubTokenInput.parentElement;
      tokenSection.appendChild(tokenAlert);
    }
  } else {
    githubTokenInput.value = appSettings.githubToken;
  }
  
  // 设置背景选项
  if (appSettings.background.type === 'custom') {
    bgCustom.checked = true;
    bgCustomSection.classList.add('active');
  } else {
    bgNone.checked = true;
    bgCustomSection.classList.remove('active');
  }
  
  // 设置背景URL
  bgUrl.value = appSettings.background.source === 'url' ? appSettings.background.url : '';
  
  // 设置文件名显示
  if (appSettings.background.source === 'file' && appSettings.background.filePath) {
    const filename = appSettings.background.filePath.split('\\').pop().split('/').pop();
    bgFilename.textContent = filename;
  } else {
    bgFilename.textContent = '';
  }
  
  // 设置透明度和模糊度
  bgOpacity.value = appSettings.background.opacity;
  bgOpacityValue.textContent = appSettings.background.opacity;
  bgBlur.value = appSettings.background.blur;
  bgBlurValue.textContent = appSettings.background.blur + 'px';
  
  // 更新预览
  updateBackgroundPreview();
}

// 应用主题
function applyTheme(theme, primaryColor) {
  // 设置主题
  document.body.classList.remove('theme-light', 'theme-dark', 'theme-github');
  if (theme) {
    document.body.classList.add(`theme-${theme}`);
  }
  
  // 应用特殊主题
  document.body.classList.toggle('theme-flower', appSettings.specialThemes.flower);
  
  // 设置主色调
  document.documentElement.style.setProperty('--primary-color', primaryColor);
  document.documentElement.style.setProperty('--primary-hover-color', adjustColor(primaryColor, -10));
  
  // 更新花朵颜色
  updateFlowerColor(theme);
}

// 更新花朵颜色
function updateFlowerColor(theme) {
  // 清除之前的颜色变换计时器
  if (flowerColorInterval) {
    clearInterval(flowerColorInterval);
    flowerColorInterval = null;
  }
  
  // 如果花朵主题未启用，直接返回
  if (!appSettings.specialThemes.flower) return;
  
  console.log('更新花朵图片，当前主题:', theme);
  
  // 根据当前主题设置花朵图片
  if (theme === 'light') {
    // 浅色模式下显示指定图片
    flowerImage.src = './30.png';
    flowerImage.style.filter = 'blur(0px)';
    flowerImage.style.webkitFilter = 'blur(0px)';
    flowerImage.style.opacity = '0.8';
    console.log('设置为浅色模式花朵图片');
  } else if (theme === 'dark') {
    // 深色模式下显示指定图片
    flowerImage.src = './29.png';
    flowerImage.style.filter = 'blur(0px)';
    flowerImage.style.webkitFilter = 'blur(0px)';
    flowerImage.style.opacity = '0.8';
    console.log('设置为深色模式花朵图片');
  } else if (theme === 'github') {
    // GitHub主题下显示指定图片
    flowerImage.src = './31.png';
    flowerImage.style.filter = 'blur(0px)';
    flowerImage.style.webkitFilter = 'blur(0px)';
    flowerImage.style.opacity = '0.8';
    console.log('设置为GitHub主题花朵图片');
  } else if (theme === 'custom') {
    // 自定义背景下显示指定图片
    flowerImage.src = './25.png';
    flowerImage.style.filter = 'blur(0px)';
    flowerImage.style.webkitFilter = 'blur(0px)';
    flowerImage.style.opacity = '0.8';
    
    // 在自定义背景下每三秒改变随机颜色
    flowerColorInterval = setInterval(() => {
      const hue = Math.floor(Math.random() * 360);
      flowerImage.style.filter = `hue-rotate(${hue}deg) blur(0px)`;
      flowerImage.style.webkitFilter = `hue-rotate(${hue}deg) blur(0px)`;
      console.log('随机改变花朵颜色:', hue);
    }, 3000);
    
    console.log('设置为自定义背景花朵图片');
  }
  
  // 更新调试面板的值
  updateFlowerDebugPanel();
}

// 花朵调试面板相关变量
let flowerZIndex = -1;
let flowerBlur = 0;
let flowerPositionX = 50;
let flowerPositionY = 50;

// 初始化花朵调试面板
function initFlowerDebugPanel() {
  // 获取调试面板元素
  const flowerZDown = document.getElementById('flower-z-down');
  const flowerZUp = document.getElementById('flower-z-up');
  const flowerZValue = document.getElementById('flower-z-value');
  
  const flowerBlurDown = document.getElementById('flower-blur-down');
  const flowerBlurUp = document.getElementById('flower-blur-up');
  const flowerBlurValue = document.getElementById('flower-blur-value');
  
  const flowerPosUp = document.getElementById('flower-pos-up');
  const flowerPosDown = document.getElementById('flower-pos-down');
  const flowerPosLeft = document.getElementById('flower-pos-left');
  const flowerPosRight = document.getElementById('flower-pos-right');
  const flowerPosCenter = document.getElementById('flower-pos-center');
  
  // 图层位置控制
  flowerZDown.addEventListener('click', () => {
    flowerZIndex--;
    flowerImage.style.zIndex = flowerZIndex;
    flowerZValue.textContent = flowerZIndex;
    console.log('花朵图层位置:', flowerZIndex);
  });
  
  flowerZUp.addEventListener('click', () => {
    flowerZIndex++;
    flowerImage.style.zIndex = flowerZIndex;
    flowerZValue.textContent = flowerZIndex;
    console.log('花朵图层位置:', flowerZIndex);
  });
  
  // 模糊度控制
  flowerBlurDown.addEventListener('click', () => {
    if (flowerBlur > 0) {
      flowerBlur--;
      flowerImage.style.filter = `blur(${flowerBlur}px)`;
      flowerImage.style.webkitFilter = `blur(${flowerBlur}px)`;
      flowerBlurValue.textContent = flowerBlur;
      console.log('花朵模糊度:', flowerBlur);
    }
  });
  
  flowerBlurUp.addEventListener('click', () => {
    flowerBlur++;
    flowerImage.style.filter = `blur(${flowerBlur}px)`;
    flowerImage.style.webkitFilter = `blur(${flowerBlur}px)`;
    flowerBlurValue.textContent = flowerBlur;
    console.log('花朵模糊度:', flowerBlur);
  });
  
  // 位置控制
  flowerPosUp.addEventListener('click', () => {
    if (flowerPositionY > 0) {
      flowerPositionY -= 5;
      updateFlowerPosition();
    }
  });
  
  flowerPosDown.addEventListener('click', () => {
    if (flowerPositionY < 100) {
      flowerPositionY += 5;
      updateFlowerPosition();
    }
  });
  
  flowerPosLeft.addEventListener('click', () => {
    if (flowerPositionX > 0) {
      flowerPositionX -= 5;
      updateFlowerPosition();
    }
  });
  
  flowerPosRight.addEventListener('click', () => {
    if (flowerPositionX < 100) {
      flowerPositionX += 5;
      updateFlowerPosition();
    }
  });
  
  flowerPosCenter.addEventListener('click', () => {
    flowerPositionX = 50;
    flowerPositionY = 50;
    updateFlowerPosition();
  });
  
  console.log('花朵调试面板已初始化');
}

// 更新花朵位置
function updateFlowerPosition() {
  flowerImage.style.top = `${flowerPositionY}%`;
  flowerImage.style.left = `${flowerPositionX}%`;
  console.log(`花朵位置: X=${flowerPositionX}%, Y=${flowerPositionY}%`);
}

// 更新花朵调试面板的值
function updateFlowerDebugPanel() {
  document.getElementById('flower-z-value').textContent = flowerZIndex;
  document.getElementById('flower-blur-value').textContent = flowerBlur;
}

// 在文档加载完成后初始化花朵调试面板
// document.addEventListener('DOMContentLoaded', () => {
//   // 初始化调试面板
//   initFlowerDebugPanel();
//   
//   // 监听花朵主题复选框变化
//   themeFlower.addEventListener('change', () => {
//     if (themeFlower.checked) {
//       const currentTheme = document.querySelector('input[name="theme"]:checked').value;
//       updateFlowerColor(currentTheme);
//     }
//   });
//   
//   // 监听来自主进程的打开设置请求
//   window.api.onOpenSettings(() => {
//     settingsOverlay.classList.add('active');
//     settingsView.classList.add('active');
//     updateSettingsUI();
//   });
// });

// 应用背景
function applyBackground() {
  const bg = appSettings.background;
  
  if (bg.type === 'none') {
    // 确保彻底清除背景图片
    backgroundOverlay.style.backgroundImage = 'none';
    document.documentElement.style.setProperty('--bg-overlay-opacity', '0');
    console.log('已清除背景图片');
    return;
  }
  
  let bgUrl = '';
  if (bg.source === 'url' && bg.url) {
    bgUrl = `url('${bg.url}')`;
  } else if (bg.source === 'file' && bg.filePath) {
    bgUrl = `url('${bg.filePath.replace(/\\/g, '\\\\')}')`;
  }
  
  if (bgUrl) {
    document.documentElement.style.setProperty('--bg-overlay-opacity', bg.opacity);
    document.documentElement.style.setProperty('--bg-blur', `${bg.blur}px`);
    backgroundOverlay.style.backgroundImage = bgUrl;
    console.log('已应用背景图片:', bg.source, bg.type);
  } else if (bg.type === 'custom') {
    // 如果是自定义背景但没有URL或文件路径，也要清除背景
    backgroundOverlay.style.backgroundImage = 'none';
    document.documentElement.style.setProperty('--bg-overlay-opacity', '0');
    console.log('自定义背景但无图片源，已清除背景');
  }
  
  // 如果花朵主题已启用，更新花朵颜色
  if (appSettings.specialThemes.flower) {
    updateFlowerColor(appSettings.theme);
  }
}

// 更新背景预览
function updateBackgroundPreview() {
  const bg = appSettings.background;
  
  if (bg.type === 'none') {
    bgPreviewContainer.style.backgroundImage = 'none';
    return;
  }
  
  let bgUrl = '';
  if (bg.source === 'url' && bg.url) {
    bgUrl = `url('${bg.url}')`;
  } else if (bg.source === 'file' && bg.filePath) {
    bgUrl = `url('${bg.filePath.replace(/\\/g, '\\\\')}')`;
  }
  
  if (bgUrl) {
    bgPreviewContainer.style.backgroundImage = bgUrl;
  }
}

// 调整颜色亮度
function adjustColor(color, percent) {
  // 转换HEX为RGB
  let r = parseInt(color.substring(1, 3), 16);
  let g = parseInt(color.substring(3, 5), 16);
  let b = parseInt(color.substring(5, 7), 16);
  
  // 调整亮度
  r = Math.max(0, Math.min(255, r + percent));
  g = Math.max(0, Math.min(255, g + percent));
  b = Math.max(0, Math.min(255, b + percent));
  
  // 转换回HEX
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// 设置按钮点击事件
if (settingsButton) {
settingsButton.addEventListener('click', () => {
  console.log('点击设置按钮');
    showSettings();
  });
  } else {
  console.error('无法找到设置按钮元素!');
  }

// 监听关闭设置按钮
closeSettings.addEventListener('click', () => {
  hideSettings();
});

// 监听设置遮罩点击
settingsOverlay.addEventListener('click', (event) => {
  if (event.target === settingsOverlay) {
    hideSettings();
  }
});

// 监听主题选择改变
themeLight.addEventListener('change', async () => {
  if (themeLight.checked) {
    const selectedTheme = 'light';
    applyTheme(selectedTheme, primaryColorPicker.value);
    
    // 如果花朵主题已启用，立即更新花朵颜色
    if (appSettings.specialThemes.flower) {
      updateFlowerColor(selectedTheme);
    }
    
    // 立即保存设置
    appSettings.theme = selectedTheme;
    await window.api.saveSettings(appSettings);
    console.log('已保存主题设置: light');
  }
});

themeDark.addEventListener('change', async () => {
  if (themeDark.checked) {
    const selectedTheme = 'dark';
    applyTheme(selectedTheme, primaryColorPicker.value);
    
    // 如果花朵主题已启用，立即更新花朵颜色
    if (appSettings.specialThemes.flower) {
      updateFlowerColor(selectedTheme);
    }
    
    // 立即保存设置
    appSettings.theme = selectedTheme;
    await window.api.saveSettings(appSettings);
    console.log('已保存主题设置: dark');
  }
});

themeGithub.addEventListener('change', async () => {
  if (themeGithub.checked) {
    const selectedTheme = 'github';
    applyTheme(selectedTheme, primaryColorPicker.value);
    
    // 如果花朵主题已启用，立即更新花朵颜色
    if (appSettings.specialThemes.flower) {
      updateFlowerColor(selectedTheme);
    }
    
    // 立即保存设置
    appSettings.theme = selectedTheme;
    await window.api.saveSettings(appSettings);
    console.log('已保存主题设置: github');
  }
});

// 监听特殊主题选择
themeFlower.addEventListener('change', async () => {
  appSettings.specialThemes.flower = themeFlower.checked;
  const selectedTheme = document.querySelector('input[name="theme"]:checked').value;
  applyTheme(selectedTheme, primaryColorPicker.value);
  
  // 立即更新花朵颜色
  if (themeFlower.checked) {
    updateFlowerColor(selectedTheme);
    // 确保调试面板可见并更新值
    updateFlowerDebugPanel();
  }
  
  // 立即保存设置
  await window.api.saveSettings(appSettings);
  console.log('已保存特殊主题设置: flower =', themeFlower.checked);
});

// 应用主题按钮点击事件
applyThemeButton.addEventListener('click', async () => {
  const selectedTheme = document.querySelector('input[name="theme"]:checked').value;
  applyTheme(selectedTheme, primaryColorPicker.value);
  
  // 保存设置
  appSettings.primaryColor = primaryColorPicker.value;
  await window.api.saveSettings(appSettings);
  console.log('已保存主色调设置:', primaryColorPicker.value);
});

// 监听背景类型选择
bgNone.addEventListener('change', () => {
  if (bgNone.checked) {
    bgCustomSection.classList.remove('active');
    appSettings.background.type = 'none';
    
    // 清除背景相关设置，确保保存时不会保留旧的背景信息
    appSettings.background.url = '';
    appSettings.background.filePath = '';
    bgFilename.textContent = '';
    bgUrl.value = '';
    
    applyBackground();
    
    // 如果花朵主题已启用，更新花朵颜色
    if (appSettings.specialThemes.flower) {
      const currentTheme = document.querySelector('input[name="theme"]:checked').value;
      updateFlowerColor(currentTheme);
    }
  }
});

bgCustom.addEventListener('change', () => {
  if (bgCustom.checked) {
    bgCustomSection.classList.add('active');
    appSettings.background.type = 'custom';
    applyBackground();
    
    // 如果花朵主题已启用，更新花朵颜色为随机模式
    if (appSettings.specialThemes.flower) {
      updateFlowerColor('custom');
    }
  }
});

// 监听背景上传按钮
bgUploadButton.addEventListener('click', () => {
  bgUpload.click();
});

// 监听文件选择
bgUpload.addEventListener('change', async () => {
  if (bgUpload.files.length > 0) {
    try {
      const result = await window.api.selectBackgroundImage();
      if (result.success) {
        bgFilename.textContent = result.filename;
        appSettings.background.source = 'file';
        appSettings.background.filePath = result.path;
        appSettings.background.type = 'custom';
        updateBackgroundPreview();
        applyBackground();
      }
    } catch (error) {
      console.error('上传背景图片失败:', error);
      alert('上传失败: ' + error.message);
    }
  }
});

// 监听URL应用按钮
bgUrlApply.addEventListener('click', async () => {
  const url = bgUrl.value.trim();
  if (url) {
    try {
      const result = await window.api.setBackgroundFromUrl(url);
      if (result.success) {
        appSettings.background.source = 'url';
        appSettings.background.url = url;
        appSettings.background.type = 'custom';
        updateBackgroundPreview();
        applyBackground();
      }
    } catch (error) {
      console.error('应用背景URL失败:', error);
      alert('应用失败: ' + error.message);
    }
  }
});

// 监听透明度滑块
bgOpacity.addEventListener('input', () => {
  const opacity = parseFloat(bgOpacity.value);
  bgOpacityValue.textContent = opacity;
  appSettings.background.opacity = opacity;
  document.documentElement.style.setProperty('--bg-overlay-opacity', opacity);
});

// 监听模糊度滑块
bgBlur.addEventListener('input', () => {
  const blur = parseInt(bgBlur.value);
  bgBlurValue.textContent = blur + 'px';
  appSettings.background.blur = blur;
  document.documentElement.style.setProperty('--bg-blur', `${blur}px`);
});

// 监听浏览下载路径按钮
browseDownloadPathButton.addEventListener('click', async () => {
  try {
    const result = await window.api.selectDownloadPath();
    if (result.success) {
      downloadPathInput.value = result.path;
    }
  } catch (error) {
    console.error('选择下载路径失败:', error);
  }
});

// 显示自定义消息提示框
function showMessageNotification(message, type = 'success', duration = 3000) {
  try {
    // 获取通知容器
    let container = document.getElementById('message-notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'message-notification-container';
      container.className = 'message-notification-container';
      document.body.appendChild(container);
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `message-notification ${type}`;
    const notificationId = `notification-${Date.now()}`;
    notification.id = notificationId;
    
    // 设置标题
    let title = '成功';
    if (type === 'error') title = '错误';
    else if (type === 'warning') title = '警告';
    else if (type === 'info') title = '提示';
    
    // 设置通知内容
    notification.innerHTML = `
      <div class="message-notification-header">
        <div class="message-notification-title">${title}</div>
        <button class="message-notification-close">✕</button>
      </div>
      <div class="message-notification-content">
        ${message}
      </div>
    `;
    
    // 添加到通知容器
    container.appendChild(notification);
    
    // 添加关闭按钮点击事件
    const closeButton = notification.querySelector('.message-notification-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        notification.remove();
      });
    }
    
    // 设置自动清除
    setTimeout(() => {
      if (document.getElementById(notificationId)) {
        notification.remove();
      }
    }, duration);
    
    return notification;
  } catch (error) {
    console.error('显示消息通知失败:', error);
    // 出错时回退到原生alert
    alert(message);
  }
}

// 监听保存Token按钮
saveTokenButton.addEventListener('click', async () => {
  try {
    const newToken = githubTokenInput.value.trim();
    if (newToken) {
      await window.api.saveSettings({ githubToken: newToken });
      appSettings.githubToken = newToken;
      showMessageNotification('GitHub Token已保存');
    }
  } catch (error) {
    console.error('保存Token失败:', error);
    showMessageNotification('保存失败: ' + error.message, 'error');
  }
});

// 监听保存设置按钮
saveSettingsButton.addEventListener('click', async () => {
  try {
    // 获取当前设置
    const selectedTheme = document.querySelector('input[name="theme"]:checked').value;
    const selectedBackground = document.querySelector('input[name="background"]:checked').value;
    
    // 保存设置 - 修改处理GitHub Token的逻辑
    const newSettings = {
      theme: selectedTheme,
      primaryColor: primaryColorPicker.value,
      downloadPath: downloadPathInput.value,
      // 仅在GitHub Token输入框不为空时才更新token
      githubToken: githubTokenInput.value.trim() !== '' ? githubTokenInput.value : appSettings.githubToken,
      specialThemes: {
        flower: themeFlower.checked
      },
      background: {
        type: selectedBackground,
        source: appSettings.background.source,
        url: selectedBackground === 'none' ? '' : (appSettings.background.source === 'url' ? bgUrl.value : appSettings.background.url),
        filePath: selectedBackground === 'none' ? '' : appSettings.background.filePath,
        opacity: parseFloat(bgOpacity.value),
        blur: parseInt(bgBlur.value)
      }
    };
    
    console.log('保存设置:', newSettings);
    await window.api.saveSettings(newSettings);
    appSettings = newSettings;
    
    // 应用设置
    applyTheme(selectedTheme, primaryColorPicker.value);
    applyBackground();
    
    // 如果花朵主题已启用，确保正确应用花朵颜色
    if (appSettings.specialThemes.flower) {
      updateFlowerColor(selectedTheme);
    }
    
    // 关闭设置模态框
    settingsOverlay.classList.remove('active');
    settingsView.classList.remove('active');
    
    showMessageNotification('设置已保存');
    
    // 添加刷新API速率限制信息，确保UI显示正确
    loadApiRateLimit();
  } catch (error) {
    console.error('保存设置失败:', error);
    showMessageNotification('保存失败: ' + error.message, 'error');
  }
});

// 监听重置设置按钮
resetSettingsButton.addEventListener('click', async () => {
  try {
    // 获取默认下载路径
    const defaultDownloadPath = await window.api.getDefaultDownloadPath();
    
    // 重置设置
    const defaultSettings = {
      theme: 'github',
      primaryColor: '#2ea44f',
      downloadPath: defaultDownloadPath,
      githubToken: appSettings.githubToken, // 保留当前token
      specialThemes: {
        flower: false
      },
      background: {
        type: 'none',
        source: 'url',
        url: '',
        filePath: '',
        opacity: 0.3,
        blur: 5
      }
    };
    
    await window.api.saveSettings(defaultSettings);
    appSettings = defaultSettings;
    
    // 更新UI
    updateSettingsUI();
    
    // 应用主题和背景
    applyTheme(defaultSettings.theme, defaultSettings.primaryColor);
    applyBackground();
    
    // 关闭设置模态框
    settingsOverlay.classList.remove('active');
    settingsView.classList.remove('active');
    
    showMessageNotification('设置已重置为默认');
  } catch (error) {
    console.error('重置设置失败:', error);
    showMessageNotification('重置失败: ' + error.message, 'error');
  }
});

// 监听窗口控制按钮
minimizeButton.addEventListener('click', () => {
  try {
    console.log('点击最小化按钮');
    window.api.minimizeWindow()
      .then(result => {
        if (result && !result.success) {
          console.error('最小化窗口失败:', result.error);
        }
      })
      .catch(err => {
        console.error('最小化窗口出错:', err);
      });
  } catch (error) {
    console.error('最小化窗口错误:', error);
  }
});

closeButton.addEventListener('click', () => {
  try {
    console.log('点击关闭按钮');
    window.api.closeWindow()
      .then(result => {
        if (result && !result.success) {
          console.error('关闭窗口失败:', result.error);
        }
      })
      .catch(err => {
        console.error('关闭窗口出错:', err);
      });
  } catch (error) {
    console.error('关闭窗口错误:', error);
  }
});

// 初始化事件监听器
function initEventListeners() {
  // 设置搜索相关
searchButton.addEventListener('click', async () => {
  const query = searchInput.value.trim();
  if (query) {
    animateSearchButton(true);
    await processSearch(query);
    animateSearchButton(false);
  }
});

  searchInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
    const query = searchInput.value.trim();
    if (query) {
      animateSearchButton(true);
      await processSearch(query);
      animateSearchButton(false);
    }
  }
});

    // 注意：我们不再需要全局的返回按钮事件处理器
  // 它会在showRepoDetail函数中动态添加
  console.log('初始化事件监听器 - 不再添加全局返回按钮事件，使用动态事件替代');
  
  // API速率限制刷新按钮的事件监听器
  const refreshApiLimitButton = document.getElementById('refresh-api-limit');
  if (refreshApiLimitButton) {
    refreshApiLimitButton.addEventListener('click', async () => {
      console.log('刷新API速率限制');
      await loadApiRateLimit();
    });
  }

  // 创建GitHub Token链接点击事件监听器
  const createTokenLink = document.getElementById('create-token-link');
  if (createTokenLink) {
    createTokenLink.addEventListener('click', async (event) => {
      event.preventDefault();
      const url = event.target.href;
      await window.api.openInDefaultBrowser(url);
    });
  }
  
  // 搜索提示相关
  if (searchHelpButton) {
    searchHelpButton.addEventListener('click', () => {
      console.log('点击了搜索帮助按钮');
      showTooltip();
    });
  }
  
  // 底部搜索帮助按钮点击事件
  if (bottomSearchHelpButton) {
    bottomSearchHelpButton.addEventListener('click', () => {
      console.log('点击了底部搜索帮助按钮');
      showTooltip();
    });
  } else {
    console.error('底部搜索帮助按钮不存在');
  }
  
  // 辅助函数：统一处理tooltip关闭
  function hideTooltip() {
      if (searchTooltip) {
      searchTooltip.classList.remove('active');
      // 等待淡出动画完成
      setTimeout(() => {
        // 重置样式
        searchTooltip.style.display = '';
        // 移除鼠标事件阻止
        document.body.classList.remove('modal-open');
      }, 300);
    }
  }
  
  // 确保closeTooltip按钮有效
  if (closeTooltip) {
    console.log('为关闭提示按钮添加事件监听器');
    closeTooltip.addEventListener('click', () => {
      console.log('点击了关闭提示按钮');
      hideTooltip();
    });
  } else {
    console.error('无法找到关闭提示按钮元素!');
  }

  // 其他点击位置关闭提示
  document.addEventListener('click', (e) => {
    if (searchTooltip && searchTooltip.classList.contains('active') && 
        !searchTooltip.contains(e.target) && 
        e.target !== searchHelpButton && 
        e.target !== bottomSearchHelpButton) {
      console.log('点击外部区域，关闭提示');
      hideTooltip();
    }
  });
  
  // 捕获提示内所有链接的点击
  document.querySelectorAll('.tooltip-content a').forEach(link => {
    link.addEventListener('click', async (event) => {
      // 排除创建Token的链接，它已经有自己的处理逻辑
      if (link.id !== 'create-token-link') {
        event.preventDefault();
        const url = event.target.href;
        await window.api.openInBrowser(url);
      }
    });
  });
}

// 加载API速率限制信息
async function loadApiRateLimit() {
  try {
    const apiLimitStatus = document.getElementById('api-limit-status');
    if (!apiLimitStatus) return;
    
    // 显示加载状态
    apiLimitStatus.innerHTML = '<div class="api-limit-loading">加载中...</div>';
    
    // 获取API速率限制
    const data = await window.api.getApiRateLimit();
    
    if (data.success) {
      // 计算剩余比例
      const ratio = data.remaining / data.limit;
      let statusClass = 'api-limit-good';
      
      if (ratio < 0.1) {
        statusClass = 'api-limit-critical';
      } else if (ratio < 0.3) {
        statusClass = 'api-limit-warning';
      }
      
      // 构建显示内容
      let html = `
        <div class="api-limit-count ${statusClass}">
          <span class="api-limit-remaining">${data.remaining}</span>
          <span class="api-limit-separator">/</span>
          <span class="api-limit-total">${data.limit}</span>
        </div>
        <div class="api-limit-reset">
          重置时间：${data.resetTime}
        </div>
      `;
      
      // 如果是自定义Token，添加标识
      if (data.isCustomToken) {
        html += '<div class="api-limit-custom-token">✅ 使用中：自定义Token</div>';
      } else {
        html += '<div class="api-limit-default-token">⚠️ 使用中：默认Token (建议添加自己的Token)</div>';
      }
      
      apiLimitStatus.innerHTML = html;
      
      // 为创建Token链接添加样式 - 根据不同状态有不同的显示
      const createTokenLink = document.getElementById('create-token-link');
      if (createTokenLink) {
        if (data.isCustomToken) {
          createTokenLink.textContent = '更新我的Token';
          createTokenLink.classList.remove('api-limit-critical');
        } else {
          createTokenLink.textContent = '创建我的Token';
          if (ratio < 0.1) {
            createTokenLink.classList.add('api-limit-critical');
          }
        }
      }
    } else {
      // 显示错误信息
      apiLimitStatus.innerHTML = `
        <div class="api-limit-error">
          无法获取API速率限制信息：${data.error}
        </div>
      `;
    }
  } catch (error) {
    console.error('加载API速率限制失败:', error);
    
    const apiLimitStatus = document.getElementById('api-limit-status');
    if (apiLimitStatus) {
      apiLimitStatus.innerHTML = `
        <div class="api-limit-error">
          加载失败：${error.message}
        </div>
      `;
    }
  }
}

// 处理搜索查询，支持链接搜索和关键词搜索
async function processSearch(query) {
  try {
    // 记录搜索历史
    navigationHistory.lastSearch = query;
    
    // 检查是否是GitHub仓库链接
    if (isGitHubRepoLink(query)) {
      await searchByRepoLink(query);
    } else {
      // 普通关键词搜索
      await searchRepositories(query);
    }
  } catch (error) {
    searchResults.innerHTML = createErrorHTML(`搜索失败: ${error.message}`);
  }
}

// 检查是否是GitHub仓库链接
function isGitHubRepoLink(query) {
  // 匹配GitHub仓库链接模式
  const githubRepoPattern = /^(https?:\/\/)?(www\.)?github\.com\/([^\/]+)\/([^\/]+)\/?.*$/i;
  return githubRepoPattern.test(query);
}

// 通过仓库链接搜索
async function searchByRepoLink(link) {
  try {
    searchResults.innerHTML = createLoadingHTML('正在获取仓库信息');
    const searchResultsElement = document.getElementById('search-results');
    showView(searchResultsElement);
    
    // 记录导航历史
    navigationHistory.lastSearch = link;
    navigationHistory.lastSearchContainer = searchResults;
    
    // 从链接中提取仓库信息
    const githubRepoPattern = /^(https?:\/\/)?(www\.)?github\.com\/([^\/]+)\/([^\/]+)\/?.*$/i;
    const matches = link.match(githubRepoPattern);
    
    if (matches && matches.length >= 5) {
      const owner = matches[3];
      const repo = matches[4];
      const repoFullName = `${owner}/${repo}`;
      
      // 获取仓库信息
      const data = await window.api.getRepoByFullName(repoFullName);
      
      if (data.error) {
        searchResults.innerHTML = createErrorHTML(`获取仓库信息失败: ${data.error}`);
        return;
      }
      
      // 直接显示仓库详情
      showRepoDetail(data);
    } else {
      searchResults.innerHTML = createErrorHTML('无效的GitHub仓库链接');
    }
  } catch (error) {
    searchResults.innerHTML = createErrorHTML(`获取仓库信息失败: ${error.message}`);
  }
}

// 搜索仓库
async function searchRepositories(query) {
  try {
    searchResults.innerHTML = createLoadingHTML('搜索中');
    const searchResultsElement = document.getElementById('search-results');
    showView(searchResultsElement);
    
    // 记录最后一次搜索
    navigationHistory.lastSearch = query;
    navigationHistory.lastSearchContainer = searchResults;
    
    // 重置加载状态
    currentPage = 1;
    hasMoreItems = true;
    lastContainerScrolled = searchResults;
    
    // 检查是否是高级搜索关键词
    let searchQuery = query;
    if (!query.includes(':') && !query.includes(' in:')) {
      // 一般搜索，可以搜索名称、描述和自述文件
      searchQuery = `${query} in:name,description,readme`;
    }
    
    // 默认按星标数量降序排序，已在API层面实现
    const data = await window.api.searchRepos(searchQuery);
    
    if (data.error) {
      // 检查是否是连接错误
      if (data.isConnectionError) {
        searchResults.innerHTML = createErrorHTML(data.error, false, true);
        
        // 添加重试连接按钮点击事件
        const retryButton = document.getElementById('retry-connection');
        if (retryButton) {
          retryButton.addEventListener('click', () => {
            // 重新执行搜索
            processSearch(query);
          });
        }
        
        // 添加设置按钮点击事件
        const openSettingsButton = document.getElementById('open-settings-from-error');
        if (openSettingsButton) {
          openSettingsButton.addEventListener('click', () => {
            showSettings();
          });
        }
        return;
      }
      
      // 检查是否是速率限制错误
      if (data.isRateLimit) {
        searchResults.innerHTML = createErrorHTML(data.error, true);
        // 添加设置按钮点击事件
        const openSettingsButton = document.getElementById('open-settings-from-error');
        if (openSettingsButton) {
          openSettingsButton.addEventListener('click', () => {
            showSettings();
          });
        }
      } else {
        searchResults.innerHTML = createErrorHTML(data.error);
      }
      return;
    }
    
    renderSearchResults(data.items);
    
    // 添加"加载更多"按钮
    const loadMoreContainer = document.createElement('div');
    loadMoreContainer.className = 'load-more-container';
    const loadMoreButton = document.createElement('button');
    loadMoreButton.className = 'load-more-button';
    loadMoreButton.textContent = '加载更多';
    loadMoreButton.addEventListener('click', async () => {
      try {
        loadMoreButton.textContent = '加载中...';
        loadMoreButton.disabled = true;
        
        // 调用加载更多函数
        await loadMoreItems();
        
        loadMoreButton.textContent = '加载更多';
        loadMoreButton.disabled = false;
      } catch (error) {
        console.error('加载更多失败:', error);
        loadMoreButton.textContent = '加载失败，点击重试';
        loadMoreButton.disabled = false;
      }
    });
    loadMoreContainer.appendChild(loadMoreButton);
    searchResults.appendChild(loadMoreContainer);
    
    // 添加滚动事件监听器
    setTimeout(() => {
      addScrollListener();
    }, 500); // 延迟添加监听器，确保DOM已完全加载
  } catch (error) {
    searchResults.innerHTML = createErrorHTML(`搜索失败: ${error.message}`);
  }
}

// 监听热门项目按钮点击
trendingButton.addEventListener('click', async () => {
  // 先清空内容，显示加载中状态
  trendingView.innerHTML = createLoadingHTML('正在加载热门项目...');
  
  // 更新导航历史
  navigationHistory.previousView = navigationHistory.currentView;
  navigationHistory.currentView = trendingView;
  
  // 显示视图并加载内容
  showView(trendingView);
  await showTrendingRepos();
});

// 监听随机项目按钮点击
randomButton.addEventListener('click', async () => {
  // 先清空内容，显示加载中状态
  randomView.innerHTML = createLoadingHTML('正在加载随机项目...');
  
  // 更新导航历史
  navigationHistory.previousView = navigationHistory.currentView;
  navigationHistory.currentView = randomView;
  
  // 显示视图并加载内容
  showView(randomView);
  await showRandomRepos();
});

// 监听返回按钮点击
backButton.addEventListener('click', () => {
  // 如果有上一个视图，则返回到该视图
  if (navigationHistory.previousView) {
    showView(navigationHistory.previousView);
    
    // 如果上一个视图是搜索结果且没有内容，则重新加载内容
    if (navigationHistory.previousView === searchResults && 
        (!navigationHistory.previousView.querySelector('.results-container') || 
         navigationHistory.previousView.querySelector('.results-container').children.length === 0)) {
      
      // 如果有上次搜索记录，则重新搜索
      if (navigationHistory.lastSearch) {
        processSearch(navigationHistory.lastSearch);
      } else {
        // 否则显示热门项目
        showTrendingRepos();
      }
    }
  } else {
    // 如果没有导航历史，则转到热门项目
    showTrendingRepos();
  }
});

// 监听标签页点击
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    // 移除所有标签页的active类
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabPanels.forEach(panel => panel.classList.remove('active'));
    
    // 设置当前点击的标签页为active
    button.classList.add('active');
    const tabName = button.getAttribute('data-tab');
    document.getElementById(`${tabName}-content`).classList.add('active');
    
    // 如果是版本标签，加载版本信息
    if (tabName === 'releases' && currentRepo) {
      loadRepoReleases(currentRepo.full_name);
    }
    
    // 如果是代码标签，加载代码信息
    if (tabName === 'code' && currentRepo) {
      loadRepoContents(currentRepo.full_name);
    }
  });
});

// 显示热门项目
async function showTrendingRepos() {
  try {
    console.log('执行showTrendingRepos函数');
    // 注意：不需要在这里设置导航历史和显示视图，已在调用者处理
    
    // 清除最后搜索记录，因为用户正在浏览热门项目
    navigationHistory.lastSearch = null;
    
    // 重置加载状态
    currentPage = 1;
    hasMoreItems = true;
    lastContainerScrolled = trendingView;
    
    const data = await window.api.getTrendingRepos();
    
    if (data.error) {
      // 检查是否是连接错误
      if (data.isConnectionError) {
        trendingView.innerHTML = createErrorHTML(data.error, false, true);
        
        // 添加重试连接按钮点击事件
        const retryButton = document.getElementById('retry-connection');
        if (retryButton) {
          retryButton.addEventListener('click', () => {
            // 重新加载热门项目
            showTrendingRepos();
          });
        }
        
        // 添加设置按钮点击事件
        const openSettingsButton = document.getElementById('open-settings-from-error');
        if (openSettingsButton) {
          openSettingsButton.addEventListener('click', () => {
            showSettings();
          });
        }
        return;
      }
      
      // 检查是否是速率限制错误
      if (data.isRateLimit) {
        trendingView.innerHTML = createErrorHTML(data.error, true);
        // 添加设置按钮点击事件
        const openSettingsButton = document.getElementById('open-settings-from-error');
        if (openSettingsButton) {
          openSettingsButton.addEventListener('click', () => {
            showSettings();
          });
        }
      } else {
        trendingView.innerHTML = createErrorHTML(`加载失败: ${data.error}`);
      }
      return;
    }
    
    // 创建热门项目视图容器
    trendingView.innerHTML = '';
    
    // 添加筛选按钮区域
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container';
    
    // 语言筛选部分
    const languageFilterHTML = `
      <div class="filter-section">
        <div class="filter-title">按项目类型筛选:</div>
        <div class="filter-buttons language-filters">
          <button class="filter-button active" data-language="all">全部</button>
          <button class="filter-button" data-language="javascript">JavaScript</button>
          <button class="filter-button" data-language="python">Python</button>
          <button class="filter-button" data-language="java">Java</button>
          <button class="filter-button" data-language="go">Go</button>
          <button class="filter-button" data-language="typescript">TypeScript</button>
        </div>
      </div>
    `;
    
    // 时间筛选部分
    const timeFilterHTML = `
      <div class="filter-section">
        <div class="filter-title">按时间筛选:</div>
        <div class="filter-buttons time-filters">
          <button class="filter-button" data-time="1d">一天</button>
          <button class="filter-button" data-time="3d">三天</button>
          <button class="filter-button" data-time="7d">七天</button>
          <button class="filter-button" data-time="1m">一月</button>
          <button class="filter-button" data-time="3m">三月</button>
          <button class="filter-button" data-time="6m">半年</button>
          <button class="filter-button" data-time="1y">一年</button>
          <button class="filter-button time-active" data-time="all">历来</button>
        </div>
      </div>
    `;
    
    // 星标筛选部分
    const starFilterHTML = `
      <div class="filter-section">
        <div class="filter-title">按星标筛选:</div>
        <div class="filter-buttons star-filters">
          <button class="filter-button star-active" data-stars="auto">智能推荐</button>
          <button class="filter-button" data-stars="10000">10000+</button>
          <button class="filter-button" data-stars="5000">5000+</button>
          <button class="filter-button" data-stars="1000">1000+</button>
          <button class="filter-button" data-stars="500">500+</button>
          <button class="filter-button" data-stars="100">100+</button>
          <button class="filter-button" data-stars="0">不限</button>
        </div>
      </div>
    `;
    
    filterContainer.innerHTML = languageFilterHTML + timeFilterHTML + starFilterHTML;
    trendingView.appendChild(filterContainer);
    
    // 添加结果容器
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'results-container';
    trendingView.appendChild(resultsContainer);
    
    // 添加"加载更多"按钮
    const loadMoreContainer = document.createElement('div');
    loadMoreContainer.className = 'load-more-container';
    const loadMoreButton = document.createElement('button');
    loadMoreButton.className = 'load-more-button';
    loadMoreButton.textContent = '加载更多';
    loadMoreButton.addEventListener('click', async () => {
      // 点击加载更多按钮时，替换为加载中状态
      loadMoreButton.textContent = '加载中...';
      loadMoreButton.disabled = true;
      
      try {
        await loadMoreItems();
        // 加载完成后恢复按钮状态
        loadMoreButton.textContent = '加载更多';
        loadMoreButton.disabled = false;
        
        // 如果没有更多项目，隐藏按钮
        if (!hasMoreItems) {
          loadMoreContainer.style.display = 'none';
        }
      } catch (error) {
        loadMoreButton.textContent = '加载失败，点击重试';
        loadMoreButton.disabled = false;
      }
    });
    loadMoreContainer.appendChild(loadMoreButton);
    trendingView.appendChild(loadMoreContainer);
    
    // 直接渲染到结果容器中
    renderSearchResults(data.items, resultsContainer);
    
    // 当前选中的筛选条件
    let currentFilter = {
      language: 'all',
      time: 'all',
      stars: 'auto'
    };
    
    // 添加语言筛选按钮点击事件
    const languageButtons = filterContainer.querySelectorAll('.language-filters .filter-button');
    languageButtons.forEach(button => {
      button.addEventListener('click', async () => {
        // 更新按钮状态
        languageButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // 保存当前语言筛选条件
        currentFilter.language = button.getAttribute('data-language');
        
        // 应用筛选
        await applyFilters(currentFilter, resultsContainer, loadMoreContainer, loadMoreButton);
      });
    });
    
    // 添加时间筛选按钮点击事件
    const timeButtons = filterContainer.querySelectorAll('.time-filters .filter-button');
    timeButtons.forEach(button => {
      button.addEventListener('click', async () => {
        // 更新按钮状态
        timeButtons.forEach(btn => btn.classList.remove('time-active'));
        button.classList.add('time-active');
        
        // 保存当前时间筛选条件
        currentFilter.time = button.getAttribute('data-time');
        
        // 应用筛选
        await applyFilters(currentFilter, resultsContainer, loadMoreContainer, loadMoreButton);
      });
    });
    
    // 添加星标筛选按钮点击事件
    const starButtons = filterContainer.querySelectorAll('.star-filters .filter-button');
    starButtons.forEach(button => {
      button.addEventListener('click', async () => {
        // 更新按钮状态
        starButtons.forEach(btn => btn.classList.remove('star-active'));
        button.classList.add('star-active');
        
        // 保存当前星标筛选条件
        currentFilter.stars = button.getAttribute('data-stars');
        
        // 应用筛选
        await applyFilters(currentFilter, resultsContainer, loadMoreContainer, loadMoreButton);
      });
    });
    
    // 应用筛选函数
    async function applyFilters(filter, container, loadMoreContainer, loadMoreButton) {
      // 查找或获取正确的结果容器
      let resultsContainer;
      if (container.classList.contains('results-container')) {
        resultsContainer = container;
      } else {
        // 查找已存在的结果容器
        resultsContainer = container.querySelector('.results-container');
        if (!resultsContainer) {
          // 如果不存在，创建一个新的结果容器
          resultsContainer = document.createElement('div');
          resultsContainer.className = 'results-container';
          container.appendChild(resultsContainer);
        }
      }
      
      // 只在结果容器中显示加载状态，而不是整个容器
      resultsContainer.innerHTML = createLoadingHTML('筛选中...');
      
      try {
        // 构建查询语句
        let query = '';
        
        // 添加语言筛选
        if (filter.language !== 'all') {
          query += `language:${filter.language} `;
        }
        
        // 添加时间筛选
        if (filter.time !== 'all') {
          const date = new Date();
          
          switch (filter.time) {
            case '1d':
              date.setDate(date.getDate() - 1);
              break;
            case '3d':
              date.setDate(date.getDate() - 3);
              break;
            case '7d':
              date.setDate(date.getDate() - 7);
              break;
            case '1m':
              date.setMonth(date.getMonth() - 1);
              break;
            case '3m':
              date.setMonth(date.getMonth() - 3);
              break;
            case '6m':
              date.setMonth(date.getMonth() - 6);
              break;
            case '1y':
              date.setFullYear(date.getFullYear() - 1);
              break;
          }
          
          const dateString = date.toISOString().split('T')[0];
          query += `created:>${dateString} `;
        }
        
        // 添加星标条件
        if (filter.stars === 'auto') {
          // 智能推荐模式，根据其他筛选条件自动调整星标数
          if (filter.language === 'all' && filter.time === 'all') {
            query += 'stars:>10000';
          } else if (filter.time === 'all') {
            query += 'stars:>5000';
          } else if (filter.time === '1y' || filter.time === '6m') {
            query += 'stars:>1000';
          } else if (filter.time === '3m' || filter.time === '1m') {
            query += 'stars:>500';
          } else {
            query += 'stars:>100';
          }
        } else if (filter.stars !== '0') {
          // 具体星标数筛选
          query += `stars:>${filter.stars}`;
        }
        // 如果星标筛选为"不限"(0)，则不添加星标筛选条件
        
        // 保存纯查询参数，不包括排序参数
        navigationHistory.lastSearch = query;
        
        // 添加排序参数用于当前API请求
        const fullQuery = query + '&sort=stars&order=desc';
        
        // 重置页码
        currentPage = 1;
        hasMoreItems = true;
        
        // 加载筛选后的项目
        const data = await window.api.searchRepos(fullQuery);
        
        if (data.error) {
          resultsContainer.innerHTML = createErrorHTML(`筛选失败: ${data.error}`);
          return;
        }
        
        // 重新显示加载更多按钮
        loadMoreContainer.style.display = 'flex';
        loadMoreButton.textContent = '加载更多';
        loadMoreButton.disabled = false;
        
        // 重新渲染项目列表 - 传递结果容器而不是整个容器
        renderSearchResults(data.items, resultsContainer);
      } catch (error) {
        resultsContainer.innerHTML = createErrorHTML(`筛选失败: ${error.message}`);
      }
    }
  } catch (error) {
    trendingView.innerHTML = createErrorHTML(`加载失败: ${error.message}`);
  }
}

// 节流函数
function throttle(func, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}

// 处理滚动事件
async function handleScroll() {
  // 如果已经在加载，或者没有更多项目，则直接返回
  if (isLoadingMore || !hasMoreItems) return;
  
  // 检查当前是否有活跃的容器
  if (!document.body.contains(lastContainerScrolled)) return;
  
  // 使用requestAnimationFrame减少计算量
  requestAnimationFrame(() => {
  // 检查是否滚动到底部
  const scrollPosition = window.innerHeight + window.scrollY;
  const bodyHeight = document.body.offsetHeight;
  
  // 当滚动到距离底部100px以内时加载更多
  if (scrollPosition >= bodyHeight - 100) {
    console.log('滚动到底部，开始加载更多项目');
    // 加载更多项目
      loadMoreItems();
    }
  });
}

// 使用节流函数包装原始滚动处理函数，根据设备性能调整节流间隔
const throttledHandleScroll = throttle(
  handleScroll, 
  window.appPerformance?.isLowEndDevice ? 200 : 100
);

// 添加滚动事件监听器
function addScrollListener() {
  console.log('添加滚动监听器');
  // 移除现有监听器（如果有）
  window.removeEventListener('scroll', throttledHandleScroll);
  window.removeEventListener('scroll', optimizedScrollHandler);
  
  // 添加优化的滚动处理器
  window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
}

// 优化的滚动处理器 - 使用rAF替代节流
let ticking = false;
let scrollingTimer = null;

function optimizedScrollHandler() {
  // 添加滚动中类名，以便应用滚动CSS优化
  document.body.classList.add('scrolling');
  
  // 清除之前的滚动定时器
  if (scrollingTimer) {
    clearTimeout(scrollingTimer);
  }
  
  // 设置新的滚动结束定时器
  scrollingTimer = setTimeout(() => {
    document.body.classList.remove('scrolling');
  }, 150); // 滚动停止150ms后移除类名
  
  if (!ticking) {
    requestAnimationFrame(() => {
      handleScroll();
      ticking = false;
    });
    ticking = true;
  }
}

// 显示随机项目
async function showRandomRepos() {
  try {
    console.log('执行showRandomRepos函数');
    // 注意：不需要在这里设置导航历史和显示视图，已在调用者处理
    
    // 清除最后搜索记录，因为用户正在浏览随机项目
    navigationHistory.lastSearch = null;
    
    // 重置加载状态
    currentPage = 1;
    hasMoreItems = false; // 设置为false表示随机视图不加载更多
    lastContainerScrolled = randomView;
    
    // 生成随机查询条件（随机选择语言、主题或创建日期范围）
    const languages = ['javascript', 'python', 'java', 'go', 'rust', 'typescript', 'c++', 'c#', 'php', 'ruby'];
    const topics = ['machine-learning', 'web', 'game', 'blockchain', 'api', 'database', 'data-science', 'mobile', 'security', 'IoT'];
    const randomType = Math.floor(Math.random() * 3);
    let query = '';
    
    if (randomType === 0) {
      // 随机语言
      const randomLang = languages[Math.floor(Math.random() * languages.length)];
      query = `language:${randomLang} stars:>100`;
    } else if (randomType === 1) {
      // 随机主题
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      query = `topic:${randomTopic} stars:>100`;
    } else {
      // 随机时间范围（过去1-12个月内创建的）
      const months = Math.floor(Math.random() * 12) + 1;
      const date = new Date();
      date.setMonth(date.getMonth() - months);
      const dateString = date.toISOString().split('T')[0];
      query = `created:>${dateString} stars:>100`;
    }
    
    // 统一按照星标数量排序，保持整个应用的一致性
    query += '&sort=stars&order=desc';
    
    const data = await window.api.searchRepos(query);
    
    if (data.error) {
      randomView.innerHTML = createErrorHTML(`加载失败: ${data.error}`);
      return;
    }
    
    renderSearchResults(data.items, randomView);
    
    // 添加底部提示，表明随机视图没有更多项目
    setTimeout(() => {
      const noMoreIndicator = document.createElement('div');
      noMoreIndicator.className = 'no-more-indicator';
      noMoreIndicator.textContent = '随机视图不支持加载更多项目。点击"随机"可查看新的随机项目';
      randomView.appendChild(noMoreIndicator);
    }, 1000);
  } catch (error) {
    randomView.innerHTML = createErrorHTML(`加载失败: ${error.message}`);
  }
}

// 加载更多项目
async function loadMoreItems() {
  try {
    console.log('开始加载更多项目，页码：', currentPage + 1);
    // 标记为正在加载
    isLoadingMore = true;
    
    // 增加页数
    currentPage++;
    
    // 构建API请求
    let query = 'stars:>10000';
    let apiUrl = '';
    const perPage = 7; // 每次加载7个
    
    // 根据当前视图确定查询内容
    if (lastContainerScrolled === searchResults && navigationHistory.lastSearch) {
      // 如果是在搜索结果页，使用上次的搜索查询
      query = navigationHistory.lastSearch;
      if (!query.includes(':') && !query.includes(' in:')) {
        query = `${query} in:name,description,readme`;
      }
      apiUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&page=${currentPage}&per_page=${perPage}`;
    } else if (lastContainerScrolled === randomView) {
      // 随机视图中不添加额外的项目加载，因为随机内容不适合分页
      console.log('在随机视图中，不加载更多项目');
      isLoadingMore = false;
      return;
    } else if (lastContainerScrolled === trendingView) {
      // 热门项目视图
      query = navigationHistory.lastSearch || 'stars:>10000';
      
      // 确保查询中不包含排序参数
      if (query.includes('&sort=') || query.includes('&order=')) {
        // 如果已包含排序参数，需要去除它们
        query = query.split('&')[0];
      }
      
      apiUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&page=${currentPage}&per_page=${perPage}`;
      console.log('加载更多热门项目，URL:', apiUrl);
    } else {
      // 默认情况，不应该到达这里
      console.log('未知的容器类型，无法加载更多项目');
      isLoadingMore = false;
      return;
    }
    
    console.log('加载URL:', apiUrl);
    
    // 发送请求获取更多项目
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': appSettings.githubToken ? `Bearer ${appSettings.githubToken}` : '',
        'User-Agent': 'HubHub-App',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('加载更多项目失败:', data.message);
      isLoadingMore = false;
      
      // 更新"加载更多"按钮状态
      updateLoadMoreButton('加载失败，点击重试', false);
      
      throw new Error(data.message || '加载失败');
    }
    
    // 如果没有更多项目，标记为没有更多
    if (!data.items || data.items.length === 0) {
      hasMoreItems = false;
      isLoadingMore = false;
      
      // 更新"加载更多"按钮状态
      updateLoadMoreButton('没有更多项目了', true);
      
      console.log('没有更多项目了');
      return;
    }
    
    console.log(`成功加载${data.items.length}个新项目`);
    
    // 获取当前容器中的结果容器
    let resultsContainer;
    if (lastContainerScrolled === trendingView) {
      resultsContainer = trendingView.querySelector('.results-container');
    } else if (lastContainerScrolled === searchResults) {
      resultsContainer = searchResults.querySelector('.results-container');
    } else {
      resultsContainer = lastContainerScrolled.querySelector('.results-container');
      
      // 如果没有结果容器，创建一个新的
      if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-container';
        lastContainerScrolled.appendChild(resultsContainer);
      }
    }
    
    // 更新"加载更多"按钮状态为加载中
    updateLoadMoreButton('加载中...', true);
    
    // 确保结果容器存在
    if (!resultsContainer) {
      console.error('无法找到结果容器');
      isLoadingMore = false;
      updateLoadMoreButton('加载更多', false);
      return;
    }
    
    // 创建加载指示器
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-more-indicator';
    loadingIndicator.innerHTML = `
      <div class="spinner"></div>
      <span>正在加载更多项目...</span>
    `;
    resultsContainer.appendChild(loadingIndicator);
    
    // 创建DOM元素的函数
    const createRepoElement = (repo, iconResult) => {
        const repoElement = document.createElement('div');
        repoElement.className = 'repo-item';
        
        // 创建仓库图标元素
        let iconElement;
        if (iconResult && iconResult.success && iconResult.data) {
          iconElement = document.createElement('img');
          iconElement.className = 'repo-icon';
          iconElement.src = iconResult.data;
          iconElement.alt = `${repo.name} 图标`;
          iconElement.loading = 'lazy';
        } else {
          // 使用字母图标作为替代
          iconElement = document.createElement('div');
          iconElement.className = 'repo-icon-placeholder';
          iconElement.textContent = (iconResult && iconResult.letter) ? iconResult.letter : repo.name.charAt(0).toUpperCase();
        }
        
        // 内容容器
        const contentElement = document.createElement('div');
        contentElement.className = 'repo-content';
        
        // 创建可点击的仓库名称
        const repoName = document.createElement('h3');
        repoName.className = 'repo-name';
        repoName.style.cursor = 'pointer';
        repoName.textContent = repo.full_name;
      
      // 添加GitHub图标
      const gitHubLinkSpan = document.createElement('span');
      gitHubLinkSpan.className = 'github-link-icon';
      gitHubLinkSpan.innerHTML = '<svg height="16" width="16" viewBox="0 0 16 16" style="margin-left: 4px; vertical-align: middle;"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>';
      repoName.appendChild(gitHubLinkSpan);
        
        // 创建描述段落
        const repoDes = document.createElement('p');
        repoDes.textContent = repo.description || '无描述';
      repoDes.className = 'repo-description';
        
        // 创建统计信息
        const statsDiv = document.createElement('div');
        statsDiv.className = 'repo-stats';
      
      const starDiv = document.createElement('div');
      starDiv.className = 'repo-stat';
      const starIcon = document.createElement('span');
      starIcon.className = 'repo-stat-icon';
      starIcon.textContent = '★';
      const starCount = document.createElement('span');
      starCount.textContent = formatNumber(repo.stargazers_count);
      starDiv.appendChild(starIcon);
      starDiv.appendChild(starCount);
      
      const forkDiv = document.createElement('div');
      forkDiv.className = 'repo-stat';
      const forkIcon = document.createElement('span');
      forkIcon.className = 'repo-stat-icon';
      forkIcon.textContent = '🍴';
      const forkCount = document.createElement('span');
      forkCount.textContent = formatNumber(repo.forks_count);
      forkDiv.appendChild(forkIcon);
      forkDiv.appendChild(forkCount);
      
      const langDiv = document.createElement('div');
      langDiv.className = 'repo-stat';
      const langSpan = document.createElement('span');
      langSpan.textContent = repo.language || '';
      langDiv.appendChild(langSpan);
      
      statsDiv.appendChild(starDiv);
      statsDiv.appendChild(forkDiv);
      statsDiv.appendChild(langDiv);
        
        contentElement.appendChild(repoName);
        contentElement.appendChild(repoDes);
        contentElement.appendChild(statsDiv);
        
        // 添加图标和内容到仓库元素
        repoElement.appendChild(iconElement);
        repoElement.appendChild(contentElement);
        
        // 存储仓库信息，用于点击处理
        repoElement.dataset.repoFullName = repo.full_name;
        
        
      // 只有点击仓库名称时才在浏览器中打开
      repoName.addEventListener('click', async (event) => {
        event.stopPropagation(); // 阻止事件冒泡，防止触发卡片点击
        await window.api.openInDefaultBrowser(repo.html_url);
      });
    
      // 添加卡片点击事件，显示详情
      repoElement.addEventListener('click', () => {
        // 使用dataset中存储的仓库全名获取完整信息
        if (repoElement.dataset.repoFullName) {
          // 从已加载的仓库列表中查找匹配项
          const matchedRepo = data.items.find(r => r.full_name === repoElement.dataset.repoFullName);
          if (matchedRepo) {
            showRepoDetail(matchedRepo);
          }
            }
      });
      
      return repoElement;
    };
    
    // 逐个加载并显示项目
    for (const repo of data.items) {
      try {
        // 获取仓库图标
        const iconResult = await window.api.getRepoIcon(repo.full_name);
        
        // 创建元素
        const repoElement = createRepoElement(repo, iconResult);
        
        // 直接添加到DOM
        resultsContainer.appendChild(repoElement);
      } catch (error) {
        console.error('加载仓库项目失败:', error);
      }
    }
    
    // 移除加载指示器
    if (resultsContainer.contains(loadingIndicator)) {
      resultsContainer.removeChild(loadingIndicator);
              }
    
    // 更新"加载更多"按钮状态
    updateLoadMoreButton('加载更多', false);
    
    // 重置加载状态
    isLoadingMore = false;
    return true;
  } catch (error) {
    console.error('加载更多项目失败:', error);
    isLoadingMore = false;
    
    // 更新"加载更多"按钮状态
    updateLoadMoreButton('加载失败，点击重试', false);
    
    throw error;
  }
}

// 辅助函数：更新"加载更多"按钮状态
function updateLoadMoreButton(text, disabled) {
  // 查找可能存在的"加载更多"按钮
  let loadMoreButton;
  
  if (lastContainerScrolled === searchResults) {
    const loadMoreContainer = searchResults.querySelector('.load-more-container');
    if (loadMoreContainer) {
      loadMoreButton = loadMoreContainer.querySelector('.load-more-button');
    }
  } else if (lastContainerScrolled === trendingView) {
    const loadMoreContainer = trendingView.querySelector('.load-more-container');
    if (loadMoreContainer) {
      loadMoreButton = loadMoreContainer.querySelector('.load-more-button');
    }
  }
  
  // 如果找到按钮，更新其状态
  if (loadMoreButton) {
    loadMoreButton.textContent = text;
    loadMoreButton.disabled = disabled;
  }
}

// 渲染搜索结果，使用虚拟化列表优化
function renderSearchResults(repos, container = searchResults) {
  if (!repos || repos.length === 0) {
    container.innerHTML = createNoResultsHTML('未找到任何结果');
    return;
  }
  
  // 检查container是否是结果容器本身或需要在其中创建结果容器
  let resultsContainer;
  if (container.classList.contains('results-container')) {
    resultsContainer = container;
    resultsContainer.innerHTML = ''; // 清空现有结果容器
  } else {
    // 清空容器
    if (container === searchResults || container === randomView) {
      container.innerHTML = '';
    }
    
    // 创建结果容器（如果不存在）
    resultsContainer = container.querySelector('.results-container');
    if (!resultsContainer) {
      resultsContainer = document.createElement('div');
      resultsContainer.className = 'results-container';
      container.appendChild(resultsContainer);
    } else {
      resultsContainer.innerHTML = ''; // 清空现有结果容器
    }
  }
  
  // 设置虚拟滚动所需的高度估计 - 不再使用绝对定位
  resultsContainer.dataset.totalItems = repos.length.toString();
  // 使用正常文档流布局，不设置min-height，让容器自然扩展
  resultsContainer.style.position = 'relative';
  
  // 更新当前滚动容器
  if (container === searchResults || container === trendingView || container === randomView) {
    lastContainerScrolled = container;
  }
  
  // 创建加载状态指示器
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.innerHTML = `
    <div class="spinner"></div>
    <span>(0/${repos.length})</span>
  `;
  resultsContainer.appendChild(loadingIndicator);
  
  // 立即加载显示的设置
  const initialLoadCount = 12; // 初始加载12个
  let loadedCount = 0;
  
  // 准备存储所有仓库图标数据的对象，用于预加载
  const iconPromises = {};
  
  // 限制并发请求，减少网络负载
  const iconRequestLimit = 6; // 减少并发请求数，保持适当的网络负载
  let activeIconRequests = 0;
  const iconRequestQueue = [];
  
  // 加载图标的函数，使用队列限制并发
  const loadIconWithLimit = async (repoFullName) => {
    // 如果已经在加载此图标，直接返回已有的promise
    if (iconPromises[repoFullName]) return iconPromises[repoFullName];
  
    // 创建加载此图标的Promise
    const requestPromise = new Promise(resolve => {
      const executeRequest = async () => {
        try {
          activeIconRequests++;
          const result = await window.api.getRepoIcon(repoFullName);
          resolve(result);
        } finally {
          activeIconRequests--;
          // 处理队列中的下一个请求
          if (iconRequestQueue.length > 0) {
            const nextRequest = iconRequestQueue.shift();
            nextRequest();
          }
        }
      };
      
      // 如果当前活跃请求数量小于限制，直接执行；否则放入队列
      if (activeIconRequests < iconRequestLimit) {
        executeRequest();
      } else {
        iconRequestQueue.push(executeRequest);
    }
    });
    
    // 存储Promise并返回
    iconPromises[repoFullName] = requestPromise;
    return requestPromise;
  };
    
  // 创建DOM元素的函数，分离关注点
  const createRepoElement = (repo, iconResult) => {
        const repoElement = document.createElement('div');
        repoElement.className = 'repo-item';
        
        // 创建仓库图标元素
        let iconElement;
        if (iconResult && iconResult.success && iconResult.data) {
          iconElement = document.createElement('img');
          iconElement.className = 'repo-icon';
          iconElement.src = iconResult.data;
          iconElement.alt = `${repo.name} 图标`;
          iconElement.loading = 'lazy'; // 启用懒加载
          iconElement.decoding = 'async'; // 异步解码图片
      // 使用图片占位符优化图片加载体验
      iconElement.style.opacity = '0';
      iconElement.onload = () => {
        iconElement.style.transition = 'opacity 0.2s';
        iconElement.style.opacity = '1';
      };
          iconElement.onerror = () => {
            // 如果图片加载失败，显示文字替代图标
            const placeholderElement = document.createElement('div');
            placeholderElement.className = 'repo-icon-placeholder';
            placeholderElement.textContent = repo.name.charAt(0).toUpperCase();
        if (repoElement.contains(iconElement)) {
          repoElement.replaceChild(placeholderElement, iconElement);
        }
          };
        } else {
          // 使用字母图标作为替代
          iconElement = document.createElement('div');
          iconElement.className = 'repo-icon-placeholder';
          iconElement.textContent = (iconResult && iconResult.letter) ? iconResult.letter : repo.name.charAt(0).toUpperCase();
        }
        
        // 内容容器
        const contentElement = document.createElement('div');
        contentElement.className = 'repo-content';
        
        // 创建可点击的仓库名称
        const repoName = document.createElement('h3');
        repoName.className = 'repo-name';
        repoName.style.cursor = 'pointer';
        repoName.textContent = repo.full_name;
    
    // 添加GitHub图标以明确表示这是外部链接
    const gitHubLinkSpan = document.createElement('span');
    gitHubLinkSpan.className = 'github-link-icon';
    gitHubLinkSpan.innerHTML = '<svg height="16" width="16" viewBox="0 0 16 16" style="margin-left: 4px; vertical-align: middle;"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>';
    repoName.appendChild(gitHubLinkSpan);
        
        // 创建描述段落
        const repoDes = document.createElement('p');
        repoDes.textContent = repo.description || '无描述';
        
    // 创建统计信息 - 使用textContent而非innerHTML以提高性能
        const statsDiv = document.createElement('div');
        statsDiv.className = 'repo-stats';
    
    const starDiv = document.createElement('div');
    starDiv.className = 'repo-stat';
    const starIcon = document.createElement('span');
    starIcon.className = 'repo-stat-icon';
    starIcon.textContent = '★';
    const starCount = document.createElement('span');
    starCount.textContent = formatNumber(repo.stargazers_count);
    starDiv.appendChild(starIcon);
    starDiv.appendChild(starCount);
    
    const forkDiv = document.createElement('div');
    forkDiv.className = 'repo-stat';
    const forkIcon = document.createElement('span');
    forkIcon.className = 'repo-stat-icon';
    forkIcon.textContent = '🍴';
    const forkCount = document.createElement('span');
    forkCount.textContent = formatNumber(repo.forks_count);
    forkDiv.appendChild(forkIcon);
    forkDiv.appendChild(forkCount);
    
    const langDiv = document.createElement('div');
    langDiv.className = 'repo-stat';
    const langSpan = document.createElement('span');
    langSpan.textContent = repo.language || '';
    langDiv.appendChild(langSpan);
    
    statsDiv.appendChild(starDiv);
    statsDiv.appendChild(forkDiv);
    statsDiv.appendChild(langDiv);
        
        contentElement.appendChild(repoName);
        contentElement.appendChild(repoDes);
        contentElement.appendChild(statsDiv);
        
        // 添加图标和内容到仓库元素
        repoElement.appendChild(iconElement);
        repoElement.appendChild(contentElement);
        
        // 存储仓库信息，用于点击处理
        repoElement.dataset.repoFullName = repo.full_name;
        
    // 延迟添加事件监听器，在元素添加到DOM后统一处理
    requestIdleCallback(() => {
      // 只有点击仓库名称时才在浏览器中打开
      repoName.addEventListener('click', async (event) => {
        event.stopPropagation(); // 阻止事件冒泡，防止触发卡片点击
        await window.api.openInDefaultBrowser(repo.html_url);
      });
  
      // 添加辅助文本，提示用户点击行为
      repoName.title = '点击在浏览器中打开GitHub页面';
      repoElement.title = '点击查看项目详情';
    }, { timeout: 500 });
    
    return repoElement;
  };
  
  // 使用事件委托处理点击事件
  if (!resultsContainer.hasAddedClickHandler) {
    resultsContainer.addEventListener('click', (event) => {
      // 查找最近的repo-item父元素
      const repoItem = event.target.closest('.repo-item');
      if (repoItem && repoItem.dataset.repoFullName) {
        // 查找对应的repo对象
        const repo = repos.find(r => r.full_name === repoItem.dataset.repoFullName);
        if (repo) {
          showRepoDetail(repo);
        }
      }
    });
    
    // 标记结果容器已添加点击处理器
    resultsContainer.hasAddedClickHandler = true;
  }
  
  // 加载一定数量的项目 - 初始加载12个
  const loadInitialItems = async () => {
    // 预加载所有初始项目的图标
    const preloadCount = Math.min(initialLoadCount, repos.length);
    for (let i = 0; i < preloadCount; i++) {
      loadIconWithLimit(repos[i].full_name);
    }
    
    // 创建并添加前12个项目
    for (let i = 0; i < preloadCount; i++) {
      try {
        // 获取仓库图标
        const iconResult = await loadIconWithLimit(repos[i].full_name);
    
        // 创建元素
        const repoElement = createRepoElement(repos[i], iconResult);
    
        // 直接添加到DOM
        resultsContainer.appendChild(repoElement);
        
        // 更新计数
        loadedCount++;
        
        // 更新加载指示器
        loadingIndicator.querySelector('span').textContent = `(${loadedCount}/${repos.length})`;
      } catch (error) {
        console.error('加载仓库项目失败:', error);
      }
    }
    
    // 移除加载指示器
    if (resultsContainer.contains(loadingIndicator)) {
      resultsContainer.removeChild(loadingIndicator);
    }
    
    // 如果还有更多项目，预加载下一批图标
    if (repos.length > initialLoadCount) {
      const nextBatchSize = Math.min(12, repos.length - initialLoadCount);
      for (let i = initialLoadCount; i < initialLoadCount + nextBatchSize; i++) {
        loadIconWithLimit(repos[i].full_name);
      }
    }
  };
  
  // 开始加载初始项目
  loadInitialItems();
}

// 显示仓库详情 - 优化版
async function showRepoDetail(repo) {
  try {
    // 预先缓存所有需要的DOM元素，避免多次查询
    const elements = {
      repoDetail: document.getElementById('repo-detail'),
      repoName: document.getElementById('repo-name'),
      repoMeta: document.getElementById('repo-meta'),
      backButton: document.getElementById('back-button'),
      readmeContent: document.getElementById('readme-content'),
      releasesContent: document.getElementById('releases-content'),
      codeContent: document.getElementById('code-content'),
      tabButtons: Array.from(document.querySelectorAll('.tab-button')),
      tabPanels: Array.from(document.querySelectorAll('.tab-panel'))
    };
    
    // 记录导航历史 - 在showView之前记录导航历史
    const previousView = navigationHistory.currentView;
          
    // 更新DOM之前，创建所有需要的内容
    // 创建元数据内容
    const metaFragment = document.createDocumentFragment();
    
    const createMetaItem = (content) => {
      const div = document.createElement('div');
      div.className = 'repo-meta-item';
      div.textContent = content;
      return div;
    };
    
    metaFragment.appendChild(createMetaItem(`⭐ ${formatNumber(repo.stargazers_count)}`));
    metaFragment.appendChild(createMetaItem(`🍴 ${formatNumber(repo.forks_count)}`));
    metaFragment.appendChild(createMetaItem(`👁️ ${formatNumber(repo.watchers_count)}`));
    
    if (repo.language) {
      metaFragment.appendChild(createMetaItem(repo.language));
    }
    
    const updatedDate = new Date(repo.updated_at).toLocaleDateString('zh-CN');
    metaFragment.appendChild(createMetaItem(`更新于: ${updatedDate}`));
    
    // 现在一次性应用所有DOM变更
    
    // 1. 显示详情视图
    showView(elements.repoDetail);
    
    // 2. 更新导航历史
    navigationHistory.previousView = previousView;
    navigationHistory.currentView = elements.repoDetail;
    // 保留搜索历史，不要清除，这样返回时能恢复内容
    // navigationHistory.lastSearch = null; // 清除搜索历史
    
    // 3. 更新仓库名称
    elements.repoName.textContent = repo.full_name;
    elements.repoName.style.cursor = 'pointer';
    elements.repoName.title = '点击在浏览器中打开GitHub页面';
    
    // 使用事件委托代替多次添加事件监听器
    if (!elements.repoName.hasEventListener) {
      elements.repoName.addEventListener('click', async (e) => {
      await window.api.openInDefaultBrowser(repo.html_url);
    });
      elements.repoName.hasEventListener = true;
    }
    
    // 4. 更新元数据
    elements.repoMeta.innerHTML = '';
    elements.repoMeta.appendChild(metaFragment);
    
    // 5. 使用事件委托处理标签切换，只设置一次
    const tabContainer = elements.tabButtons[0]?.parentNode;
    if (tabContainer && !tabContainer.hasTabEventListener) {
      tabContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.tab-button');
        if (!button) return;
        
        const tabName = button.getAttribute('data-tab');
        if (!tabName) return;
        
        // 更新按钮激活状态
        elements.tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // 更新面板激活状态
        elements.tabPanels.forEach(panel => panel.classList.remove('active'));
        const tabPanel = document.getElementById(`${tabName}-content`);
        if (!tabPanel) return;
        
          tabPanel.classList.add('active');
          
          // 加载对应内容（如果还没加载）
        if (tabPanel.dataset.loaded !== 'true') {
          tabPanel.dataset.loaded = 'true';
          
          if (tabName === 'readme') {
            loadRepoReadme(repo.full_name);
          } else if (tabName === 'releases') {
            loadRepoReleases(repo.full_name);
          } else if (tabName === 'code') {
            loadRepoContents(repo.full_name);
          }
        }
      });
      tabContainer.hasTabEventListener = true;
    }
    
        // 6. 设置返回按钮事件
    // 注意：不再使用事件监听器委托，因为这里的返回按钮事件处理会被initEventListeners中的全局返回按钮事件覆盖
    // 这里我们应该移除之前添加的事件，并更新处理逻辑
    if (elements.backButton) {
      // 移除现有的所有事件监听器
      const oldButton = elements.backButton;
      const newButton = oldButton.cloneNode(true);
      oldButton.parentNode.replaceChild(newButton, oldButton);
      
      // 重置事件监听器状态
      elements.backButton = newButton;
      console.log('重置详情页面返回按钮事件监听器');
      
      // 添加新的事件监听器
      elements.backButton.addEventListener('click', () => {
        console.log('点击详情页面返回按钮');
        
        if (navigationHistory.previousView) {
          const prevView = navigationHistory.previousView;
          
          // 确保在切换视图前检查prevView是否存在且为有效视图
          if (prevView && document.getElementById(prevView.id)) {
            console.log('返回到上一个视图:', prevView.id);
            
            // 根据返回的视图类型，提前准备数据
            switch (prevView.id) {
              case 'trending-view':
                console.log('返回到热门项目页面，准备重新加载');
                // 先清空内容，显示加载中
                prevView.innerHTML = createLoadingHTML('正在加载热门项目...');
                break;
                
              case 'random-view':
                console.log('返回到随机项目页面，准备重新加载');
                // 先清空内容，显示加载中
                prevView.innerHTML = createLoadingHTML('正在加载随机项目...');
                break;
            }
            
            // 更新导航历史（在显示视图之前）
            navigationHistory.currentView = prevView;
            navigationHistory.previousView = null;
            
            // 切换视图
            showView(prevView);
            
            // 根据返回的视图类型，选择适当的处理方式
            switch (prevView.id) {
              case 'search-results':
                // 如果是搜索结果页且有上次搜索记录，确保内容不为空
                if (navigationHistory.lastSearch) {
    setTimeout(() => {
                    console.log('重新加载搜索结果');
                    processSearch(navigationHistory.lastSearch);
                  }, 100);
                }
                break;
                
              case 'trending-view':
                // 返回到热门项目页面时，始终重新加载热门项目内容
                setTimeout(() => {
                  console.log('重新加载热门项目，调用showTrendingRepos()');
                  showTrendingRepos();
                }, 100);
                break;
                
              case 'random-view':
                // 返回到随机项目页面时，始终重新加载随机项目内容
                setTimeout(() => {
                  console.log('重新加载随机项目，调用showRandomRepos()');
                  showRandomRepos();
                }, 100);
                break;
            }
          } else {
            console.error('无效的上一个视图:', prevView);
            // 回退到热门项目页面
            const trendingViewElement = document.getElementById('trending-view');
            if (trendingViewElement) {
              trendingViewElement.innerHTML = createLoadingHTML('正在加载热门项目...');
              showView(trendingViewElement);
              navigationHistory.currentView = trendingViewElement;
              navigationHistory.previousView = null;
              
              setTimeout(() => {
                showTrendingRepos();
              }, 100);
            }
          }
        } else {
          console.log('没有上一个视图，回到热门项目页面');
          const trendingViewElement = document.getElementById('trending-view');
          if (trendingViewElement) {
            trendingViewElement.innerHTML = createLoadingHTML('正在加载热门项目...');
            showView(trendingViewElement);
            navigationHistory.currentView = trendingViewElement;
            navigationHistory.previousView = null;
            
            setTimeout(() => {
              showTrendingRepos();
    }, 100);
          }
        }
      });
    }
    
    // 7. 默认激活README标签
    elements.tabButtons.forEach(button => button.classList.remove('active'));
    const readmeTabButton = elements.tabButtons.find(btn => btn.getAttribute('data-tab') === 'readme');
    if (readmeTabButton) {
      readmeTabButton.classList.add('active');
    }
    
    elements.tabPanels.forEach(panel => panel.classList.remove('active'));
    if (elements.readmeContent) {
      elements.readmeContent.classList.add('active');
      
      // 8. 加载README内容
      if (elements.readmeContent.dataset.loaded !== 'true') {
        elements.readmeContent.dataset.loaded = 'true';
            loadRepoReadme(repo.full_name);
      }
    }
    
    // 9. 使用requestIdleCallback延迟加载其他标签内容
    requestIdleCallback(() => {
      // 预加载其他标签内容，但优先级较低
      if (elements.releasesContent && elements.releasesContent.dataset.loaded !== 'true') {
        elements.releasesContent.dataset.loaded = 'true';
        requestIdleCallback(() => loadRepoReleases(repo.full_name), { timeout: 2000 });
      }
      
      if (elements.codeContent && elements.codeContent.dataset.loaded !== 'true') {
        elements.codeContent.dataset.loaded = 'true';
        requestIdleCallback(() => loadRepoContents(repo.full_name), { timeout: 3000 });
      }
    }, { timeout: 1000 });
    
    // 10. 保存当前仓库信息
    currentRepo = repo;
  } catch (error) {
    console.error('显示仓库详情失败:', error);
    const searchResultsElement = document.getElementById('search-results');
    if (searchResultsElement) {
      searchResults.innerHTML = createErrorHTML('显示仓库详情失败: ' + error.message);
      showView(searchResultsElement);
    }
  }
}

// 加载仓库的README - 优化版
async function loadRepoReadme(repoFullName) {
  try {
    // 确保readmeContent是最新的DOM元素
    const readmeContent = document.getElementById('readme-content');
    if (!readmeContent) {
      console.error('无法找到readme-content元素');
      return;
    }
    
    // 使用微任务将下面的操作推迟到UI更新后执行
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // 创建加载指示器，不直接修改DOM
    const loadingHTML = createLoadingHTML('加载README中');
    
    // 使用requestAnimationFrame确保在浏览器绘制前修改DOM
    requestAnimationFrame(() => {
      readmeContent.innerHTML = loadingHTML;
    });
    
    // 使用Promise.race实现超时处理
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => resolve({ error: '请求超时，请检查网络连接', isConnectionError: true }), 15000);
    });
    
    // 并行发送请求，任何一个完成就返回
    const data = await Promise.race([
      window.api.getRepoReadme(repoFullName),
      timeoutPromise
    ]);
    
    // 检查视图是否仍然可见
    const isViewActive = () => {
      return document.body.contains(readmeContent) && 
             readmeContent.classList.contains('active') && 
             window.getComputedStyle(readmeContent).display !== 'none';
    };
    
    // 如果视图已不可见，直接返回
    if (!isViewActive()) {
      return;
    }
    
    // 处理错误情况
    if (data.error) {
      let errorHTML = '';
        
      // 创建一个统一的错误处理函数
      const handleErrorView = () => {
        requestAnimationFrame(() => {
          readmeContent.innerHTML = errorHTML;
          
          // 使用事件委托处理所有按钮点击
          readmeContent.addEventListener('click', (e) => {
            if (e.target.closest('#retry-connection')) {
            loadRepoReadme(repoFullName);
            } else if (e.target.closest('#open-settings-from-error')) {
            showSettings();
            }
          }, { once: true });
          });
      };
      
      // 检查是否是连接错误
      if (data.isConnectionError) {
        errorHTML = createErrorHTML(data.error, false, true);
        handleErrorView();
        return;
      }
      
      // 是否是速率限制错误
      if (data.error.includes('rate limit') || data.error.includes('429')) {
        errorHTML = createErrorHTML(data.error, true);
        handleErrorView();
        return;
        }
      
        // 普通错误
      errorHTML = createErrorHTML(`无法加载README: ${data.error}`);
      handleErrorView();
      return;
    }
    
    // 检查readme数据是否存在
    if (!data.readme) {
      requestAnimationFrame(() => {
      readmeContent.innerHTML = createNoResultsHTML("无法获取README内容，请稍后重试。");
      });
      return;
    }
    
    // 创建一个HTML解析回调函数
    const renderReadme = (htmlContent) => {
      // 视图已不可见，直接返回
      if (!isViewActive()) return;
      
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = htmlContent;
      
      // 对图片进行批处理，添加懒加载
      const images = tempContainer.querySelectorAll('img');
      for (const img of images) {
        img.loading = 'lazy';
        img.decoding = 'async';
      }
      
      // 一次性更新DOM
      requestAnimationFrame(() => {
        readmeContent.innerHTML = '';
        readmeContent.appendChild(tempContainer);
        
        // 使用事件委托处理所有点击事件
        readmeContent.addEventListener('click', e => {
          // 处理图片点击
          const img = e.target.closest('img');
          if (img) {
            window.api.openInDefaultBrowser(img.src);
            return;
          }
          
          // 处理链接点击
          const link = e.target.closest('a');
          if (link) {
            e.preventDefault();
            const url = link.getAttribute('href');
            if (url) {
              window.api.openInDefaultBrowser(url);
            }
          }
        });
      });
    };
    
    // 使用Web Worker转换Markdown，避免阻塞主线程
    if (window.Worker) {
      try {
        // 使用共享Worker池而不是每次创建新Worker
        if (!window.markdownWorkerPool) {
          window.markdownWorkerPool = new Worker('markdownWorker.js');
        }
        
        const worker = window.markdownWorkerPool;
        
        // 创建唯一ID用于标识此次请求
        const requestId = Date.now() + Math.random().toString(36).substring(2, 15);
        
        // 创建一个Promise来等待Worker响应
        const workerPromise = new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Markdown处理超时'));
          }, 5000); // 5秒超时
          
          const messageHandler = e => {
            if (e.data.requestId === requestId) {
              clearTimeout(timeoutId);
              worker.removeEventListener('message', messageHandler);
              resolve(e.data.html);
            }
          };
          
          worker.addEventListener('message', messageHandler);
          
          // 发送消息到Worker，包含ID
          worker.postMessage({
            requestId,
            markdown: data.readme
          });
        });
        
        try {
          const html = await workerPromise;
          renderReadme(html);
        } catch (workerError) {
          console.error('Worker处理Markdown失败:', workerError);
          
          // 回退到主线程处理
            if (typeof data.readme === 'string' && data.readme.trim() !== '') {
            // 延迟主线程处理以不阻塞UI
            setTimeout(() => {
              try {
          const html = marked.parse(data.readme);
                renderReadme(html);
              } catch (parseError) {
                readmeContent.innerHTML = createErrorHTML(`解析README失败: ${parseError.message}`);
              }
            }, 0);
            } else {
              readmeContent.innerHTML = createNoResultsHTML("README内容为空或格式不正确。");
            }
          }
        
      } catch (workerError) {
        console.error('无法创建Web Worker，回退到主线程处理:', workerError);
        
        // 延迟主线程处理以不阻塞UI
          setTimeout(() => {
            try {
              if (typeof data.readme === 'string' && data.readme.trim() !== '') {
            const html = marked.parse(data.readme);
              renderReadme(html);
              } else {
                readmeContent.innerHTML = createNoResultsHTML("README内容为空或格式不正确。");
              }
            } catch (parseError) {
              readmeContent.innerHTML = createErrorHTML(`解析README失败: ${parseError.message}`);
            }
          }, 0);
      }
    } else {
      // 浏览器不支持Web Worker，使用延迟处理
        setTimeout(() => {
          try {
            if (typeof data.readme === 'string' && data.readme.trim() !== '') {
          const html = marked.parse(data.readme);
            renderReadme(html);
            } else {
              readmeContent.innerHTML = createNoResultsHTML("README内容为空或格式不正确。");
            }
          } catch (parseError) {
            readmeContent.innerHTML = createErrorHTML(`解析README失败: ${parseError.message}`);
          }
        }, 0);
    }
  } catch (error) {
    console.error('加载README失败:', error);
    const readmeContent = document.getElementById('readme-content');
    if (readmeContent) {
      requestAnimationFrame(() => {
        readmeContent.innerHTML = createErrorHTML(`加载失败: ${error.message}`);
      });
    }
  }
}

// 加载仓库发布版本
async function loadRepoReleases(repoFullName) {
  try {
    // 确保releasesContent是最新的DOM元素
    const releasesContent = document.getElementById('releases-content');
    if (!releasesContent) {
      console.error('无法找到releases-content元素');
      return;
    }
    
    releasesContent.innerHTML = createLoadingHTML('加载版本信息中');
    
    const releases = await window.api.getRepoReleases(repoFullName);
    
    if (releases.error) {
      releasesContent.innerHTML = createErrorHTML(`加载版本信息失败: ${releases.error}`);
      return;
    }
    
    if (!releases.length) {
      releasesContent.innerHTML = createNoResultsHTML('该仓库没有发布版本');
      return;
    }
    
    releasesContent.innerHTML = '';
    
    releases.forEach(release => {
      const releaseElement = document.createElement('div');
      releaseElement.className = 'release-item';
      
      // 创建发布标题
      const releaseTitle = document.createElement('h3');
      releaseTitle.className = 'release-title';
      releaseTitle.textContent = release.name || release.tag_name;
      
      // 创建发布日期
      const releaseDate = document.createElement('div');
      releaseDate.className = 'release-date';
      releaseDate.textContent = new Date(release.published_at).toLocaleDateString('zh-CN');
      
      // 创建发布说明
      const releaseBody = document.createElement('div');
      releaseBody.className = 'release-body';
      releaseBody.innerHTML = marked.parse(release.body || '');
      
      // 添加到发布元素
      releaseElement.appendChild(releaseTitle);
      releaseElement.appendChild(releaseDate);
      releaseElement.appendChild(releaseBody);
      
      // 添加下载按钮
      if (release.assets && release.assets.length > 0) {
        const assetsContainer = document.createElement('div');
        assetsContainer.className = 'assets-container';
        
        release.assets.forEach(asset => {
          const downloadButton = document.createElement('button');
          downloadButton.className = 'download-button';
          downloadButton.textContent = `下载 ${asset.name} (${formatBytes(asset.size)})`;
          
          downloadButton.addEventListener('click', async (event) => {
            try {
              event.stopPropagation();
              downloadButton.textContent = '下载中...';
              downloadButton.disabled = true;
              
              try {
                // 确保下载管理器已初始化
                if (!downloadsManager.indicator || !downloadsManager.notificationsContainer) {
                  console.log('下载管理器未初始化，正在初始化...');
                  initDownloadManager();
                }
                
                console.log('开始下载文件:', asset.name, asset.browser_download_url);
                
                // 添加下载任务，显示下载指示器
                addDownloadTask(asset.name);
                
                // 显示下载进度模态框
                showDownloadProgressModal();
                
                // 检查下载管理器是否已正确初始化
                if (!downloadsManager.progressModal || !downloadsManager.progressList) {
                  console.error('下载管理器未完全初始化，重新初始化');
                  initDownloadManager();
                  showDownloadProgressModal();
                }
                
                const result = await window.api.downloadFile(asset.browser_download_url, asset.name);
                
                if (result.canceled) {
                  downloadButton.textContent = `下载 ${asset.name} (${formatBytes(asset.size)})`;
                  downloadButton.disabled = false;
                  // 取消下载，减少活跃下载数
                  downloadsManager.activeDownloads--;
                  updateDownloadIndicator();
                } else if (result.error) {
                  downloadButton.textContent = '下载失败';
                  setTimeout(() => {
                    downloadButton.textContent = `下载 ${asset.name} (${formatBytes(asset.size)})`;
                    downloadButton.disabled = false;
                  }, 3000);
                  // 下载失败，减少活跃下载数
                  downloadsManager.activeDownloads--;
                  updateDownloadIndicator();
                } else {
                  downloadButton.textContent = '下载完成';
                  setTimeout(() => {
                    downloadButton.textContent = `下载 ${asset.name} (${formatBytes(asset.size)})`;
                    downloadButton.disabled = false;
                  }, 3000);
                  // 下载完成，更新下载状态并显示通知
                  completeDownloadTask(asset.name, result.path);
                }
              } catch (error) {
                console.error('下载过程中出错:', error);
                downloadButton.textContent = '下载失败';
                setTimeout(() => {
                  downloadButton.textContent = `下载 ${asset.name} (${formatBytes(asset.size)})`;
                  downloadButton.disabled = false;
                }, 3000);
                // 下载失败，减少活跃下载数
                if (downloadsManager.activeDownloads > 0) {
                  downloadsManager.activeDownloads--;
                }
                try {
                  updateDownloadIndicator();
                } catch (indicatorError) {
                  console.error('更新下载指示器失败:', indicatorError);
                }
              }
            } catch (outerError) {
              console.error('下载按钮点击事件处理失败:', outerError);
              downloadButton.textContent = '下载失败';
              downloadButton.disabled = false;
            }
          });
          
          assetsContainer.appendChild(downloadButton);
        });
        
        releaseElement.appendChild(assetsContainer);
      }
      
      releasesContent.appendChild(releaseElement);
    });
  } catch (error) {
    // 确保releasesContent是最新的DOM元素
    const releasesContent = document.getElementById('releases-content');
    if (releasesContent) {
      releasesContent.innerHTML = createErrorHTML(`加载版本信息失败: ${error.message}`);
    } else {
      console.error('加载版本信息失败，且无法找到releases-content元素:', error);
    }
  }
}

// 加载仓库代码内容
async function loadRepoContents(repoFullName, path = '') {
  try {
    // 确保codeContent是最新的DOM元素
    const codeContent = document.getElementById('code-content');
    if (!codeContent) {
      console.error('无法找到code-content元素');
      return;
    }
    
    codeContent.innerHTML = createLoadingHTML('加载代码信息中');
    
    const apiUrl = `https://api.github.com/repos/${repoFullName}/contents${path ? '/' + path : ''}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': appSettings.githubToken ? `Bearer ${appSettings.githubToken}` : '',
        'User-Agent': 'HubHub-App',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    
    const data = await response.json();
    
    if (response.status !== 200) {
      codeContent.innerHTML = createErrorHTML(`加载代码失败: ${data.message}`);
      return;
    }
    
    // 创建代码浏览器UI
    const codeBrowser = document.createElement('div');
    codeBrowser.className = 'code-browser';
    
    // 显示当前路径
    const codePath = document.createElement('div');
    codePath.className = 'code-path';
    codePath.textContent = path || '/';
    codeBrowser.appendChild(codePath);
    
    // 创建文件列表
    const fileList = document.createElement('ul');
    fileList.className = 'code-file-list';
    
    // 添加返回上一级按钮（如果在子目录中）
    if (path) {
      const parentPath = path.split('/').slice(0, -1).join('/');
      const backItem = document.createElement('li');
      backItem.className = 'code-file-item';
      backItem.innerHTML = '<span class="code-file-icon">📁</span> ..';
      backItem.addEventListener('click', () => loadRepoContents(repoFullName, parentPath));
      fileList.appendChild(backItem);
    }
    
    // 添加目录和文件
    const sortedData = [...data].sort((a, b) => {
      // 先按类型排序（目录在前，文件在后）
      if (a.type !== b.type) {
        return a.type === 'dir' ? -1 : 1;
      }
      // 再按名称排序
      return a.name.localeCompare(b.name);
    });
    
    sortedData.forEach(item => {
      const fileItem = document.createElement('li');
      fileItem.className = 'code-file-item';
      
      const isDir = item.type === 'dir';
      fileItem.innerHTML = `<span class="code-file-icon">${isDir ? '📁' : '📄'}</span> ${item.name}`;
      
      fileItem.addEventListener('click', () => {
        if (isDir) {
          const newPath = path ? `${path}/${item.name}` : item.name;
          loadRepoContents(repoFullName, newPath);
        } else {
          window.open(item.html_url, '_blank');
        }
      });
      
      fileList.appendChild(fileItem);
    });
    
    codeBrowser.appendChild(fileList);
    codeContent.innerHTML = '';
    codeContent.appendChild(codeBrowser);
  } catch (error) {
    // 确保codeContent是最新的DOM元素
    const codeContent = document.getElementById('code-content');
    if (codeContent) {
      codeContent.innerHTML = createErrorHTML(`加载代码失败: ${error.message}`);
    } else {
      console.error('加载代码失败，且无法找到code-content元素:', error);
    }
  }
}

// 工具函数 - 显示视图
function showView(viewToShow) {
  try {
    // 确保获取最新的DOM元素引用
    const searchResultsElement = document.getElementById('search-results');
    const repoDetailElement = document.getElementById('repo-detail');
    const trendingViewElement = document.getElementById('trending-view');
    const randomViewElement = document.getElementById('random-view');
    const settingsViewElement = document.getElementById('settings-view');
    
    // 如果找不到任何视图元素，则记录错误并返回
    if (!searchResultsElement || !repoDetailElement || !trendingViewElement || !randomViewElement) {
      console.error('无法找到必要的视图元素');
      return;
    }
    
    // 如果是初始状态，并且要切换到非搜索结果页，则切换到底部搜索栏
    if (appState.isInitialState && viewToShow !== searchResultsElement) {
      switchToBottomSearch();
    }
    
    // 如果是显示热门或随机项目视图时，确保内容不为空
    if ((viewToShow === trendingViewElement || viewToShow === randomViewElement) && 
        (!viewToShow.querySelector('.repo-item') && !viewToShow.querySelector('.loading'))) {
      console.log(`视图 ${viewToShow.id} 内容为空，准备切换并重新加载`);
      // 显示加载动画
      if (viewToShow === trendingViewElement) {
        viewToShow.innerHTML = createLoadingHTML('正在加载热门项目...');
      } else {
        viewToShow.innerHTML = createLoadingHTML('正在加载随机项目...');
      }
    }
    
    // 隐藏所有视图，除了设置视图（设置视图现在是模态框）
    searchResultsElement.classList.add('hidden-view');
    searchResultsElement.classList.remove('active-view');
    repoDetailElement.classList.add('hidden-view');
    repoDetailElement.classList.remove('active-view');
    trendingViewElement.classList.add('hidden-view');
    trendingViewElement.classList.remove('active-view');
    randomViewElement.classList.add('hidden-view');
    randomViewElement.classList.remove('active-view');
    
    // 不要在这里处理设置视图，因为设置现在是模态框
    
    // 记录切换前的navigationHistory状态
    console.log('切换视图前导航历史:', JSON.stringify({
      currentView: navigationHistory.currentView ? navigationHistory.currentView.id : 'null',
      previousView: navigationHistory.previousView ? navigationHistory.previousView.id : 'null'
    }));
    console.log('切换到视图:', viewToShow.id);
    
    // 我们不再在这里更新导航历史，而是由调用者负责
    // 只记录当前的导航历史状态
    console.log('导航历史当前状态:', JSON.stringify({
        currentView: navigationHistory.currentView ? navigationHistory.currentView.id : 'null',
        previousView: navigationHistory.previousView ? navigationHistory.previousView.id : 'null'
      }));
      
      // 当视图切换时，更新滚动容器
      if (viewToShow === searchResultsElement || viewToShow === trendingViewElement || viewToShow === randomViewElement) {
        lastContainerScrolled = viewToShow;
        
        // 重新添加滚动监听器
        setTimeout(() => {
          if (viewToShow === trendingViewElement || 
              (viewToShow === searchResultsElement && navigationHistory.lastSearch)) {
            window.removeEventListener('scroll', handleScroll);
            window.addEventListener('scroll', handleScroll);
            console.log('视图切换，重新添加滚动监听器');
          }
        }, 500);
    }
    
    // 显示指定视图，但如果是设置视图则使用模态方式显示
    if (viewToShow !== settingsViewElement) {
      viewToShow.classList.remove('hidden-view');
      viewToShow.classList.add('active-view');
      
      // 视图切换后，检查热门或随机项目视图是否需要加载内容
      setTimeout(() => {
        if (viewToShow === trendingViewElement && 
            (!viewToShow.querySelector('.repo-item') && !viewToShow.querySelector('.loading'))) {
          console.log('热门项目视图内容为空，自动重新加载');
          showTrendingRepos();
        } else if (viewToShow === randomViewElement && 
                  (!viewToShow.querySelector('.repo-item') && !viewToShow.querySelector('.loading'))) {
          console.log('随机项目视图内容为空，自动重新加载');
          showRandomRepos();
        }
      }, 100);
    }
  } catch (error) {
    console.error('显示视图失败:', error);
  }
}

// 工具函数 - 格式化数字
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// 工具函数 - 格式化字节大小
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// 添加Marked库（用于渲染Markdown）
const markedScript = document.createElement('script');
markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
document.head.appendChild(markedScript);

// 初始化页面加载时显示欢迎界面而不是热门项目
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 初始化导航历史
    navigationHistory = {
      currentView: searchResults,
      previousView: null, 
      lastSearch: null,
      lastSearchContainer: searchResults
    };
    
    // 显示欢迎界面而不是热门项目
    searchResults.innerHTML = createWelcomeHTML();
    const searchResultsElement = document.getElementById('search-results');
    if (searchResultsElement) {
      showView(searchResultsElement);
    }
    
    // 获取并应用设置
    await initSettings();
    
    // 初始化事件监听器
    initEventListeners();
    
    // 添加设置页面关闭按钮的事件监听器
    if (closeSettings) {
      closeSettings.addEventListener('click', () => {
        console.log('点击关闭设置按钮');
        if (settingsOverlay && settingsView) {
          settingsOverlay.classList.remove('active');
          settingsView.classList.remove('active');
        }
      });
    } else {
      console.error('无法找到关闭设置按钮元素!');
    }
    
    // 设置页面背景点击关闭设置
    if (settingsOverlay) {
      settingsOverlay.addEventListener('click', (e) => {
        // 确保点击的是遮罩层本身，而不是设置面板内的元素
        if (e.target === settingsOverlay) {
          console.log('点击设置遮罩层，关闭设置');
          settingsOverlay.classList.remove('active');
          settingsView.classList.remove('active');
        }
      });
    }
    
    // 初始化花朵主题调试面板
    initFlowerDebugPanel();
    
    // 监听花朵主题复选框变化
    themeFlower.addEventListener('change', () => {
      if (themeFlower.checked) {
        const currentTheme = document.querySelector('input[name="theme"]:checked').value;
        updateFlowerColor(currentTheme);
      }
    });
    
    // 监听来自主进程的打开设置请求
    window.api.onOpenSettings && window.api.onOpenSettings(() => {
      settingsOverlay.classList.add('active');
      settingsView.classList.add('active');
      updateSettingsUI();
    });
    
    // 初始化下载管理
    try {
      console.log('初始化下载管理器...');
      initDownloadManager();
      console.log('下载管理器初始化完成');
    } catch (downloadManagerError) {
      console.error('初始化下载管理器失败:', downloadManagerError);
    }
    
    // 添加"如何获取Token?"链接的点击事件处理
    const tokenHelpLink = document.querySelector('.token-info a');
    if (tokenHelpLink) {
      tokenHelpLink.addEventListener('click', async (event) => {
        event.preventDefault();
        const url = event.target.href;
        await window.api.openInDefaultBrowser(url);
      });
    }
    
    // 页面加载完成后添加全局滚动监听
    window.addEventListener('load', () => {
      console.log('页面完全加载，添加全局滚动监听');
      // 确保移除旧的监听器，避免重复监听
      window.removeEventListener('scroll', handleScroll);
      window.addEventListener('scroll', handleScroll);
      
      // 确保当前滚动容器设置正确
      if (navigationHistory.currentView) {
        lastContainerScrolled = navigationHistory.currentView;
      }
      
      // 设置初始状态
      showCenterSearch();
    });
    
    // 添加欢迎界面的CSS
    const welcomeStyle = document.createElement('style');
    welcomeStyle.textContent = `
      .welcome-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 70vh;
        text-align: center;
        padding: 2rem;
      }
    `;
    document.head.appendChild(welcomeStyle);
    
    // 添加搜索栏和设置按钮切换功能
    setupSearchTransition();
    
    // 删除可能存在的多余的DOMContentLoaded事件监听器
    const oldHandler = window.domContentLoadedHandler;
    if (typeof oldHandler === 'function') {
      document.removeEventListener('DOMContentLoaded', oldHandler);
    }
    window.domContentLoadedHandler = () => {}; // 无操作的假处理程序
    
    // 监听窗口控制按钮
    minimizeButton.addEventListener('click', () => {
      try {
        console.log('点击最小化按钮');
        window.api.minimizeWindow()
          .then(result => {
            if (result && !result.success) {
              console.error('最小化窗口失败:', result.error);
            }
          })
          .catch(err => {
            console.error('最小化窗口出错:', err);
          });
      } catch (error) {
        console.error('最小化窗口错误:', error);
      }
    });
    
    closeButton.addEventListener('click', () => {
      try {
        console.log('点击关闭按钮');
        window.api.closeWindow()
          .then(result => {
            if (result && !result.success) {
              console.error('关闭窗口失败:', result.error);
            }
          })
          .catch(err => {
            console.error('关闭窗口出错:', err);
          });
      } catch (error) {
        console.error('关闭窗口错误:', error);
      }
    });
    
    // 监听全屏状态变化
    if (window.api.onFullscreenChange) {
      window.api.onFullscreenChange((isFullscreen) => {
        console.log('全屏状态变化:', isFullscreen);
        if (isFullscreen) {
          document.body.classList.add('is-fullscreen');
        } else {
          document.body.classList.remove('is-fullscreen');
        }
      });
    }
  } catch (error) {
    console.error('DOMContentLoaded事件处理失败:', error);
  }
});

// 创建加载动画HTML
function createLoadingHTML(message) {
  return `
    <div class="loading">
      <div class="spinner"></div>
      <div class="spinner-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <div class="loading-text">${message}</div>
    </div>
  `;
}

// 创建错误提示HTML
function createErrorHTML(message, isRateLimit = false, isConnectionError = false) {
  if (isConnectionError) {
    return `
      <div class="error connection-error">
        <h3>网络连接错误</h3>
        <p>${message}</p>
        <div class="error-actions">
          <button id="retry-connection" class="settings-button">重试连接</button>
          <button id="open-settings-from-error" class="settings-button">打开设置</button>
        </div>
        <p class="connection-error-info">可能的原因: 网络连接不稳定、网络代理设置问题、防火墙阻止或GitHub服务暂时不可用。</p>
      </div>
    `;
  }
  
  if (isRateLimit) {
    return `
      <div class="error rate-limit-error">
        <h3>API速率限制</h3>
        <p>${message}</p>
        <button id="open-settings-from-error" class="settings-button">打开设置</button>
        <p class="rate-limit-info">GitHub API对未授权请求限制为每小时60次。添加个人访问令牌可提高至每小时5000次。</p>
      </div>
    `;
  }
  
  return `<div class="error">${message}</div>`;
}

// 创建无结果HTML
function createNoResultsHTML(message) {
  return `
    <div class="no-results">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
      <div>${message}</div>
    </div>
  `;
}

// 初始化下载管理器
function initDownloadManager() {
  try {
    console.log('初始化下载管理器...');
    
    // 获取下载指示器元素
    downloadsManager.container = document.getElementById('download-indicator-container');
    downloadsManager.indicator = document.getElementById('download-indicator');
    downloadsManager.notificationsContainer = document.getElementById('download-notifications-container');
    downloadsManager.progressModal = document.getElementById('download-progress-modal');
    downloadsManager.progressList = downloadsManager.progressModal ? 
      downloadsManager.progressModal.querySelector('.download-progress-list') : null;
    
    // 检查元素是否存在，如果不存在则创建
    if (!downloadsManager.container) {
      console.warn('下载指示器容器不存在，创建新的容器');
      const container = document.createElement('div');
      container.id = 'download-indicator-container';
      container.className = 'download-indicator-container';
      document.body.appendChild(container);
      downloadsManager.container = container;
    }
    
    if (!downloadsManager.indicator) {
      console.warn('下载指示器不存在，创建新的指示器');
      const indicator = document.createElement('div');
      indicator.id = 'download-indicator';
      indicator.className = 'download-indicator';
      indicator.innerHTML = `
        <div class="download-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </div>
        <div class="download-count">0</div>
      `;
      downloadsManager.container.appendChild(indicator);
      downloadsManager.indicator = indicator;
    }
    
    if (!downloadsManager.notificationsContainer) {
      console.warn('下载通知容器不存在，创建新的容器');
      const notificationsContainer = document.createElement('div');
      notificationsContainer.id = 'download-notifications-container';
      notificationsContainer.className = 'download-notifications-container';
      document.body.appendChild(notificationsContainer);
      downloadsManager.notificationsContainer = notificationsContainer;
    }
    
    if (!downloadsManager.progressModal) {
      console.warn('下载进度模态框不存在，创建新的模态框');
      const modal = document.createElement('div');
      modal.id = 'download-progress-modal';
      modal.className = 'download-progress-modal';
      modal.innerHTML = `
        <div class="download-progress-container">
          <div class="download-progress-header">
            <h3>下载进度</h3>
            <button class="close-progress-modal">✕</button>
          </div>
          <div class="download-progress-list"></div>
        </div>
      `;
      document.body.appendChild(modal);
      downloadsManager.progressModal = modal;
      
      // 添加关闭按钮事件
      const closeButton = modal.querySelector('.close-progress-modal');
      closeButton.addEventListener('click', () => {
        hideDownloadProgressModal();
      });
    }
    
    // 确保获取到进度列表容器
    if (!downloadsManager.progressList && downloadsManager.progressModal) {
      downloadsManager.progressList = downloadsManager.progressModal.querySelector('.download-progress-list');
      console.log('获取下载进度列表:', downloadsManager.progressList ? '成功' : '失败');
    }
    
    // 添加点击事件，显示下载管理器
    downloadsManager.indicator.addEventListener('click', () => {
      showDownloadProgressModal();
    });
    
    // 监听下载事件
    initDownloadListeners();
    
    console.log('下载管理器初始化完成:', {
      container: !!downloadsManager.container,
      indicator: !!downloadsManager.indicator,
      notificationsContainer: !!downloadsManager.notificationsContainer,
      progressModal: !!downloadsManager.progressModal,
      progressList: !!downloadsManager.progressList
    });
  } catch (error) {
    console.error('初始化下载管理器失败:', error);
  }
}

// 初始化下载事件监听
function initDownloadListeners() {
  // 监听下载开始
  window.api.onDownloadStarted((data) => {
    console.log('下载开始事件:', data);
    
    // 添加到下载列表
    downloadsManager.downloads[data.id] = {
      id: data.id,
      fileName: data.fileName,
      filePath: data.filePath,
      totalBytes: data.totalBytes,
      downloadedBytes: 0,
      progress: 0,
      status: 'downloading' // downloading, finished, error
    };
    
    console.log('下载任务已添加:', downloadsManager.downloads[data.id]);
    
    // 更新下载进度列表UI
    updateDownloadProgressUI(data.id);
  });
  
  // 监听下载进度
  window.api.onDownloadProgress((data) => {
    console.log('下载进度事件:', data.id, data.progress + '%');
    
    if (downloadsManager.downloads[data.id]) {
      downloadsManager.downloads[data.id].downloadedBytes = data.downloadedBytes;
      downloadsManager.downloads[data.id].progress = data.progress;
      
      // 更新下载进度列表UI
      updateDownloadProgressUI(data.id);
    } else {
      console.warn('收到未知下载ID的进度更新:', data.id);
    }
  });
  
  // 监听下载完成
  window.api.onDownloadFinished((data) => {
    console.log('下载完成事件:', data);
    
    if (downloadsManager.downloads[data.id]) {
      downloadsManager.downloads[data.id].status = 'finished';
      downloadsManager.downloads[data.id].progress = 100;
      
      // 更新下载进度列表UI
      updateDownloadProgressUI(data.id);
    } else {
      console.warn('收到未知下载ID的完成通知:', data.id);
    }
  });
  
  // 监听下载错误
  window.api.onDownloadError((data) => {
    console.error('下载错误事件:', data);
    
    if (downloadsManager.downloads[data.id]) {
      downloadsManager.downloads[data.id].status = 'error';
      downloadsManager.downloads[data.id].error = data.error;
      
      // 更新下载进度列表UI
      updateDownloadProgressUI(data.id);
    } else {
      console.warn('收到未知下载ID的错误通知:', data.id);
    }
  });
}

// 显示下载进度模态框
function showDownloadProgressModal() {
  console.log('显示下载进度模态框');
  
  if (!downloadsManager.progressModal) {
    console.log('下载进度模态框不存在，初始化下载管理器');
    initDownloadManager();
  }
  
  if (!downloadsManager.progressModal) {
    console.error('初始化后下载进度模态框仍不存在');
    return;
  }
  
  downloadsManager.progressModal.classList.add('visible');
  console.log('已显示下载进度模态框');
  
  // 获取所有下载项
  const downloadIds = Object.keys(downloadsManager.downloads);
  console.log(`当前有 ${downloadIds.length} 个下载项，更新UI`);
  
  // 更新所有下载项的UI
  downloadIds.forEach(id => {
    updateDownloadProgressUI(id);
  });
}

// 隐藏下载进度模态框
function hideDownloadProgressModal() {
  if (downloadsManager.progressModal) {
    downloadsManager.progressModal.classList.remove('visible');
  }
}

// 更新下载进度UI
function updateDownloadProgressUI(downloadId) {
  console.log('更新下载进度UI:', downloadId);
  
  if (!downloadsManager.progressList) {
    console.error('下载进度列表容器不存在');
    return;
  }
  
  const downloadData = downloadsManager.downloads[downloadId];
  if (!downloadData) {
    console.error('下载数据不存在:', downloadId);
    return;
  }
  
  console.log('下载数据:', downloadData);
  
  // 检查项目是否已存在
  let itemElement = document.getElementById(`download-item-${downloadId}`);
  
  if (!itemElement) {
    console.log('创建新的下载项:', downloadId);
    // 创建新的下载项
    itemElement = document.createElement('div');
    itemElement.id = `download-item-${downloadId}`;
    itemElement.className = 'download-progress-item';
    downloadsManager.progressList.appendChild(itemElement);
  }
  
  // 格式化文件大小
  const totalSizeFormatted = formatBytes(downloadData.totalBytes);
  const downloadedSizeFormatted = formatBytes(downloadData.downloadedBytes);
  
  // 设置状态类
  itemElement.className = `download-progress-item download-status-${downloadData.status}`;
  
  // 更新项目内容
  const itemContent = `
    <div class="download-item-info">
      <div class="download-item-name">${downloadData.fileName}</div>
      <div class="download-item-size">${downloadedSizeFormatted} / ${totalSizeFormatted}</div>
    </div>
    <div class="download-item-progress-container">
      <div class="download-item-progress-bar" style="width: ${downloadData.progress}%"></div>
    </div>
    <div class="download-item-status">
      ${downloadData.status === 'downloading' ? `${downloadData.progress}%` : 
        downloadData.status === 'finished' ? '完成' : '失败'}
    </div>
  `;
  
  itemElement.innerHTML = itemContent;
  console.log('已更新下载项内容');
  
  // 如果下载已完成，添加打开文件夹按钮
  if (downloadData.status === 'finished' && !itemElement.querySelector('.download-item-actions')) {
    console.log('添加打开文件夹按钮');
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'download-item-actions';
    
    const openFolderButton = document.createElement('button');
    openFolderButton.className = 'download-item-action';
    openFolderButton.textContent = '打开文件夹';
    openFolderButton.addEventListener('click', () => {
      // 直接打开文件夹
      const filePath = downloadData.filePath;
      const folderPath = filePath.substring(0, filePath.lastIndexOf('\\'));
      window.api.openInDefaultBrowser(`file:///${folderPath}`);
    });
    
    actionsDiv.appendChild(openFolderButton);
    itemElement.appendChild(actionsDiv);
  }
}

// 更新下载指示器
function updateDownloadIndicator() {
  try {
    // 确保下载指示器已经初始化
    if (!downloadsManager.indicator) {
      console.warn('下载指示器未初始化，尝试重新初始化');
      initDownloadManager();
      // 如果仍然没有初始化成功，则退出
      if (!downloadsManager.indicator) {
        console.error('无法初始化下载指示器');
        return;
      }
    }
    
    const count = downloadsManager.activeDownloads;
    const countElement = downloadsManager.indicator.querySelector('.download-count');
    
    if (!countElement) {
      console.error('找不到下载计数元素');
      return;
    }
    
    if (count > 0) {
      countElement.textContent = count;
      downloadsManager.indicator.classList.add('active');
    } else {
      countElement.textContent = '0';
      downloadsManager.indicator.classList.remove('active');
    }
  } catch (error) {
    console.error('更新下载指示器失败:', error);
  }
}

// 添加下载任务
function addDownloadTask(fileName) {
  try {
    console.log('添加下载任务:', fileName);
    downloadsManager.activeDownloads++;
    updateDownloadIndicator();
    console.log('当前活跃下载数:', downloadsManager.activeDownloads);
    return downloadsManager.activeDownloads;
  } catch (error) {
    console.error('添加下载任务失败:', error);
    return 0;
  }
}

// 完成下载任务
function completeDownloadTask(fileName, filePath) {
  try {
    downloadsManager.activeDownloads--;
    // 确保活跃下载数不为负数
    if (downloadsManager.activeDownloads < 0) {
      downloadsManager.activeDownloads = 0;
    }
    updateDownloadIndicator();
    
    // 创建下载完成通知
    showDownloadNotification(fileName, filePath);
  } catch (error) {
    console.error('完成下载任务失败:', error);
  }
}

// 显示下载完成通知
function showDownloadNotification(fileName, filePath) {
  try {
    // 确保通知容器已经初始化
    if (!downloadsManager.notificationsContainer) {
      console.warn('下载通知容器未初始化，尝试重新初始化');
      initDownloadManager();
      // 如果仍然没有初始化成功，则退出
      if (!downloadsManager.notificationsContainer) {
        console.error('无法初始化下载通知容器');
        return;
      }
    }
    
    const notificationId = 'download-' + Date.now();
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'download-notification';
    notification.id = notificationId;
    
    // 设置通知内容
    notification.innerHTML = `
      <div class="download-notification-header">
        <div class="download-notification-title">下载完成</div>
        <button class="download-notification-close">✕</button>
      </div>
      <div class="download-notification-content">
        文件 <strong>${fileName}</strong> 已下载完成
      </div>
      <div class="download-notification-actions">
        <button class="download-notification-action open-folder-action">打开文件夹</button>
      </div>
    `;
    
    // 添加到通知容器
    downloadsManager.notificationsContainer.appendChild(notification);
    
    // 添加关闭按钮点击事件
    const closeButton = notification.querySelector('.download-notification-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        notification.remove();
      });
    }
    
    // 添加打开文件夹按钮点击事件
    const openFolderButton = notification.querySelector('.open-folder-action');
    if (openFolderButton) {
      openFolderButton.addEventListener('click', async () => {
        // 打开包含下载文件的文件夹
        try {
          // 获取文件路径的目录部分
          const folderPath = filePath.substring(0, filePath.lastIndexOf('\\'));
          await window.api.openInDefaultBrowser('file://' + folderPath);
        } catch (error) {
          console.error('打开文件夹失败:', error);
        }
        notification.remove();
      });
    }
    
    // 设置自动清除
    setTimeout(() => {
      if (document.getElementById(notificationId)) {
        notification.remove();
      }
    }, 5500); // 5.5秒后自动移除，与动画时间匹配
  } catch (error) {
    console.error('显示下载完成通知失败:', error);
  }
}

// 创建仓库卡片
function createRepoCard(repo) {
  const card = document.createElement('div');
  card.className = 'repo-card';
  card.addEventListener('click', () => showRepoDetail(repo));
  
  // 仓库名称和作者
  const titleArea = document.createElement('div');
  titleArea.className = 'repo-title-area';
  
  // 仓库图标
  const iconContainer = document.createElement('div');
  iconContainer.className = 'repo-icon loading';
  titleArea.appendChild(iconContainer);
  
  // 仓库名和作者
  const nameContainer = document.createElement('div');
  nameContainer.className = 'repo-name-container';
  
  const name = document.createElement('h3');
  name.className = 'repo-name';
  name.textContent = repo.name;
  name.addEventListener('click', async (event) => {
    event.stopPropagation(); // 阻止事件冒泡，防止触发卡片点击
    await window.api.openInDefaultBrowser(repo.html_url);
  });
  name.style.cursor = 'pointer'; // 添加指针样式以表明可点击
  
  const owner = document.createElement('span');
  owner.className = 'repo-owner';
  owner.textContent = repo.owner.login;
  
  nameContainer.appendChild(name);
  nameContainer.appendChild(owner);
  titleArea.appendChild(nameContainer);
  
  card.appendChild(titleArea);
  
  // 仓库描述
  if (repo.description) {
    const description = document.createElement('p');
    description.className = 'repo-description';
    description.textContent = repo.description.length > 120 
      ? repo.description.substring(0, 120) + '...' 
      : repo.description;
    card.appendChild(description);
  }
  
  // 仓库信息
  const statsContainer = document.createElement('div');
  statsContainer.className = 'repo-stats';
  
  const stars = document.createElement('span');
  stars.className = 'repo-stat';
  stars.innerHTML = `⭐ ${formatNumber(repo.stargazers_count)}`;
  
  const forks = document.createElement('span');
  forks.className = 'repo-stat';
  forks.innerHTML = `📌 ${formatNumber(repo.forks_count)}`;
  
  const language = document.createElement('span');
  language.className = 'repo-stat';
  language.textContent = repo.language || 'N/A';
  
  statsContainer.appendChild(stars);
  statsContainer.appendChild(forks);
  statsContainer.appendChild(language);
  
  card.appendChild(statsContainer);
  
  return card;
}

// 监听赞助按钮点击
if (sponsorButton) {
  sponsorButton.addEventListener('click', async () => {
    try {
      await window.api.openInBrowser('https://afdian.com/a/xieshuoxing');
    } catch (error) {
      console.error('打开赞助页面失败:', error);
    }
  });
}

// 添加错误提示的CSS样式
const errorToastStyle = document.createElement('style');
errorToastStyle.textContent = `
  .error-toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #f44336;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    font-size: 14px;
    max-width: 80%;
    text-align: center;
    animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; bottom: 0; }
    to { opacity: 1; bottom: 20px; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; bottom: 20px; }
    to { opacity: 0; bottom: 0; }
  }
`;
document.head.appendChild(errorToastStyle);

// 添加GitHub Token相关的CSS样式
const tokenStyle = document.createElement('style');
tokenStyle.textContent = `
  .token-needed {
    border-color: #f44336 !important;
    background-color: rgba(244, 67, 54, 0.05) !important;
  }
  
  .token-alert {
    margin-top: 10px;
    padding: 10px;
    background-color: #fff3cd;
    border-left: 4px solid #ffc107;
    color: #856404;
    border-radius: 4px;
    display: flex;
    align-items: center;
    font-size: 14px;
  }
  
  .alert-icon {
    margin-right: 10px;
    font-size: 18px;
  }
  
  .token-link {
    margin-left: 10px;
    color: #0366d6;
    text-decoration: underline;
    cursor: pointer;
  }
  
  .token-link:hover {
    text-decoration: none;
  }
`;
document.head.appendChild(tokenStyle);

// 添加欢迎界面的HTML
function createWelcomeHTML() {
  return `
    <div class="welcome-container">
      <!-- 移除了图标和HubHub名字 -->
    </div>
  `;
}

// 设置搜索栏转换逻辑
function setupSearchTransition() {
  // 中心搜索按钮点击事件
  centerSearchButton.addEventListener('click', () => {
    const query = centerSearchInput.value.trim();
    if (query) {
      // 记录下最后的搜索内容和容器
      navigationHistory.lastSearch = query;
      navigationHistory.lastSearchContainer = searchResults;
      
      // 设置appState状态
      appState.hasSearched = true;
      
      // 执行搜索
      processSearch(query);
      
      // 切换到底部搜索栏
      switchToBottomSearch().then(() => {
        // 在动画完成后设置底部搜索栏的内容
        searchInput.value = query;
        searchInput.placeholder = '搜索GitHub项目...';
      });
    }
  });
  
  // 中心搜索输入框按下回车时触发搜索
  centerSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = centerSearchInput.value.trim();
      if (query) {
        // 记录下最后的搜索内容和容器
        navigationHistory.lastSearch = query;
        navigationHistory.lastSearchContainer = searchResults;
        
        // 设置appState状态
        appState.hasSearched = true;
        
        // 执行搜索
        processSearch(query);
        
        // 切换到底部搜索栏
        switchToBottomSearch().then(() => {
          // 在动画完成后设置底部搜索栏的内容
          searchInput.value = query;
          searchInput.placeholder = '搜索GitHub项目...';
        });
      }
    }
  });
  
  // 底部设置按钮点击事件
  bottomSettingsButton.addEventListener('click', () => {
    console.log('点击底部设置按钮');
    showSettings();
  });
  
  // 底部搜索帮助按钮点击事件
  if (bottomSearchHelpButton) {
    bottomSearchHelpButton.addEventListener('click', () => {
      console.log('点击了底部搜索帮助按钮');
      showTooltip();
    });
      } else {
    console.error('底部搜索帮助按钮不存在');
  }
  
  // 辅助函数：统一处理tooltip关闭
  function hideTooltip() {
    if (searchTooltip) {
      searchTooltip.classList.remove('active');
      // 等待淡出动画完成
      setTimeout(() => {
        // 重置样式
        searchTooltip.style.display = '';
        // 移除鼠标事件阻止
        document.body.classList.remove('modal-open');
      }, 300);
    }
  }
  
  // 确保closeTooltip按钮有效
  if (closeTooltip) {
    console.log('为关闭提示按钮添加事件监听器');
    closeTooltip.addEventListener('click', () => {
      console.log('点击了关闭提示按钮');
      hideTooltip();
    });
  } else {
    console.error('无法找到关闭提示按钮元素!');
  }
  
  // 其他点击位置关闭提示
  document.addEventListener('click', (e) => {
    if (searchTooltip && searchTooltip.classList.contains('active') && 
        !searchTooltip.contains(e.target) && 
        e.target !== searchHelpButton && 
        e.target !== bottomSearchHelpButton) {
      console.log('点击外部区域，关闭提示');
      hideTooltip();
    }
  });
}

// 切换到中心搜索栏
function showCenterSearch() {
  // 设置应用状态
  appState.isInitialState = true;
  
  // 先定位并显示中心搜索栏
  centerSearchContainer.style.top = '50%';
  centerSearchContainer.style.left = '50%';
  centerSearchContainer.style.transform = 'translate(-50%, -50%)';
  
  // 确保中心搜索栏位置是固定的
  setTimeout(() => {
  // 显示中心搜索栏，隐藏底部搜索栏
  centerSearchContainer.classList.add('active');
  bottomControlBar.classList.remove('visible');
  bottomControlBar.classList.add('initial-state');
  
  // 显示底部工具按钮
  bottomToolsContainer.classList.add('initial-state');
  bottomToolsContainer.classList.remove('moved');
  }, 0);
}

// 切换到底部搜索栏
async function switchToBottomSearch() {
  if (!appState.isInitialState) return; // 如果已经切换过，不再执行
  
  // 设置应用状态
  appState.isInitialState = false;
  
  // 先隐藏中心搜索栏，减少可能的视觉跳动
  centerSearchContainer.style.opacity = '0';
  
  // 确保底部控制栏已经完全准备好，禁用过渡动画以避免跳动
  bottomControlBar.style.transition = 'none';
  bottomControlBar.style.bottom = '20px';
  bottomControlBar.style.left = '0';
  bottomControlBar.style.right = '0';
  bottomControlBar.style.transform = 'translateY(0)';
  bottomControlBar.style.opacity = '0';
  bottomControlBar.classList.remove('initial-state');
  bottomControlBar.classList.add('visible');
  
  // 强制浏览器重绘
  void bottomControlBar.offsetWidth;
  
  // 恢复过渡动画
  bottomControlBar.style.transition = '';
  
  // 让底部搜索栏淡入
  bottomControlBar.style.opacity = '1';
  
  // 在动画完成后设置底部搜索栏的内容
  searchInput.placeholder = '搜索GitHub项目...';
  
  // 中心搜索栏完全隐藏
  centerSearchContainer.classList.remove('active');
  
  // 隐藏底部工具按钮
  bottomToolsContainer.classList.remove('initial-state');
  bottomToolsContainer.classList.add('moved');
  
  // 等待动画完成
  return new Promise(resolve => setTimeout(resolve, 300));
}

// 搜索按钮动画
function animateSearchButton(isSearching) {
  if (isSearching) {
    searchButton.classList.add('searching');
    searchIcon.textContent = 'UwU';
    // 如果中心搜索按钮可见，也应用相同动画
    if (centerSearchContainer.classList.contains('active')) {
      centerSearchButton.classList.add('searching');
      centerSearchIcon.textContent = 'UwU';
    }
  } else {
    searchButton.classList.remove('searching');
    searchIcon.textContent = 'U_U';
    // 如果中心搜索按钮可见，恢复其状态
    if (centerSearchContainer.classList.contains('active')) {
      centerSearchButton.classList.remove('searching');
      centerSearchIcon.textContent = 'U_U';
    }
  }
}

// 辅助函数：统一处理tooltip显示
function showTooltip() {
  if (searchTooltip) {
    // 禁用页面上所有的过渡动画，确保不会出现跳动
    document.body.classList.add('disable-transitions');
    // 阻止鼠标事件干扰
    document.body.classList.add('modal-open');
    
    // 禁用tooltip的过渡动画
    searchTooltip.style.transition = 'none';
    
    // 先隐藏tooltip
    searchTooltip.style.visibility = 'hidden';
    searchTooltip.style.opacity = '0';
    
    // 先设置精确位置
    searchTooltip.style.top = '50%';
    searchTooltip.style.left = '50%';
    searchTooltip.style.transform = 'translate(-50%, -50%)';
    searchTooltip.style.margin = '0';
    searchTooltip.style.bottom = 'auto';
    searchTooltip.style.right = 'auto';
    
    // 确保其他元素不会改变位置
    bottomControlBar.style.transition = 'none';
    if (settingsView) settingsView.style.transition = 'none';
    if (settingsOverlay) settingsOverlay.style.transition = 'none';
    
    // 先设置display: block以便计算位置
    searchTooltip.style.display = 'block';
    
    // 强制浏览器重绘
    void searchTooltip.offsetWidth;
    
    // 等待一段时间确保先进行定位再显示
    setTimeout(() => {
      // 恢复过渡动画
      searchTooltip.style.transition = '';
      bottomControlBar.style.transition = '';
      if (settingsView) settingsView.style.transition = '';
      if (settingsOverlay) settingsOverlay.style.transition = '';
      
      // 显示tooltip
      searchTooltip.classList.add('active');
      searchTooltip.style.visibility = 'visible';
      searchTooltip.style.opacity = '1';
      
      // 加载API速率限制信息
      loadApiRateLimit();
      
      // 恢复所有过渡动画
      setTimeout(() => {
        document.body.classList.remove('disable-transitions');
      }, 100);
    }, 50);
  }
}

// 添加图片缓存
const REPO_ICON_CACHE = new Map();
const REPO_ICON_CACHE_MAX_SIZE = 200; // 最大缓存数量

// 优化获取仓库图标，添加缓存机制
async function getRepoIcon(repoFullName) {
  try {
    // 首先检查缓存
    if (REPO_ICON_CACHE.has(repoFullName)) {
      console.log('使用缓存的仓库图标:', repoFullName);
      return REPO_ICON_CACHE.get(repoFullName);
    }
    
    const result = await window.api.getRepoIcon(repoFullName);
    
    // 缓存结果
    if (REPO_ICON_CACHE.size >= REPO_ICON_CACHE_MAX_SIZE) {
      // 如果缓存满了，删除最早添加的项（简单的LRU实现）
      const firstKey = REPO_ICON_CACHE.keys().next().value;
      REPO_ICON_CACHE.delete(firstKey);
    }
    REPO_ICON_CACHE.set(repoFullName, result);
    
    return result;
  } catch (error) {
    console.error('获取仓库图标失败:', error);
    // 返回默认图标
    return { 
      success: false, 
      letter: repoFullName.charAt(0).toUpperCase() 
    };
  }
}

// 性能监控与优化
const performanceMetrics = {
  fps: 0,
  frameTime: 0,
  deviceMemory: navigator.deviceMemory || 4, // 默认假设4GB
  hardwareConcurrency: navigator.hardwareConcurrency || 4, // 默认假设4核
  isLowEndDevice: false,
  scrollFPS: 0,
  lastScrollTime: 0,
  scrollSamples: [],
  // 添加节流控制
  throttleTimer: null,
  THROTTLE_DELAY: 100, // 节流延迟100ms
  // 添加图片加载控制
  imageLoadCount: 0,
  MAX_CONCURRENT_IMAGE_LOADS: 5 // 最大并发图片加载数
};

// 添加节流函数
function throttle(func, delay) {
  return function(...args) {
    if (!performanceMetrics.throttleTimer) {
      performanceMetrics.throttleTimer = setTimeout(() => {
        func.apply(this, args);
        performanceMetrics.throttleTimer = null;
      }, delay);
    }
  };
}

// 修改checkDevicePerformance函数，增加对图片加载策略的控制
function checkDevicePerformance() {
  // 检查是否为低端设备
  const isLowMemory = performanceMetrics.deviceMemory <= 4; 
  const isLowCPU = performanceMetrics.hardwareConcurrency <= 2; 
  const isLowFPS = performanceMetrics.fps < 30; 
  const isHighFrameTime = performanceMetrics.frameTime > 30; 
  const isLowScrollFPS = performanceMetrics.scrollFPS > 0 && performanceMetrics.scrollFPS < 45; 

  // 根据条件判断是否为低端设备
  performanceMetrics.isLowEndDevice = isLowMemory || isLowCPU || isLowFPS || isHighFrameTime || isLowScrollFPS;

  // 应用性能优化
  if (performanceMetrics.isLowEndDevice) {
    console.log('检测到低性能设备，启用性能优化模式');
    document.body.classList.add('low-performance-mode');
    
    // 低端设备性能设置
    window.appPerformance = {
      isLowEndDevice: true,
      useBatchProcessing: true,
      useVirtualization: true,
      reduceAnimations: true,
      useEventDelegation: true,
      frameInterval: 100, // 低端设备的帧间隔
      scrollOptimization: true, // 启用滚动优化
      lazyLoadImages: true, // 启用图片懒加载
      skipSocialPreview: true, // 跳过加载社交预览图
      maxConcurrentImageLoads: 3 // 减少并发图片加载数
    };
    
    // 更新最大并发图片加载数
    performanceMetrics.MAX_CONCURRENT_IMAGE_LOADS = 3;
  } else {
    console.log('检测到高性能设备，使用普通模式');
    document.body.classList.remove('low-performance-mode');
    
    // 高端设备的设置
    window.appPerformance = {
      isLowEndDevice: false,
      useBatchProcessing: false,
      useVirtualization: true, // 虚拟化对所有设备都有好处
      reduceAnimations: false,
      useEventDelegation: true,
      frameInterval: 16, // 约60fps
      scrollOptimization: false,
      lazyLoadImages: false,
      skipSocialPreview: false,
      maxConcurrentImageLoads: 10
    };
    
    // 更新最大并发图片加载数
    performanceMetrics.MAX_CONCURRENT_IMAGE_LOADS = 10;
  }
}

// 修改createRepoCard函数，加入图片加载控制和缓存
async function createRepoCard(repo) {
  try {
    const card = document.createElement('div');
    card.className = 'repo-card';
    card.setAttribute('data-repo-id', repo.id);
    
    // 创建卡片内容结构
    card.innerHTML = `
      <div class="repo-icon-placeholder"></div>
      <div class="repo-info">
        <h3 class="repo-name">${repo.name}</h3>
        <p class="repo-description">${repo.description || '无描述'}</p>
        <div class="repo-meta">
          <span class="repo-stars">⭐ ${repo.stargazers_count.toLocaleString()}</span>
          <span class="repo-language">${repo.language || '未指定'}</span>
          <span class="repo-updated">更新于: ${new Date(repo.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    `;
    
    // 添加点击事件，进入详情页
    card.addEventListener('click', () => {
      displayRepoDetails(repo);
    });
    
    // 延迟加载仓库图标，使用节流控制并发
    if (performanceMetrics.imageLoadCount < performanceMetrics.MAX_CONCURRENT_IMAGE_LOADS) {
      performanceMetrics.imageLoadCount++;
      
      // 使用优化后的带缓存的getRepoIcon函数
      getRepoIcon(repo.full_name).then(iconResult => {
        try {
          const iconPlaceholder = card.querySelector('.repo-icon-placeholder');
          
          if (iconResult.success) {
            const iconImg = document.createElement('img');
            iconImg.className = 'repo-icon';
            iconImg.src = iconResult.data;
            iconImg.alt = `${repo.name} icon`;
            iconImg.addEventListener('load', () => {
              performanceMetrics.imageLoadCount--;
            });
            iconImg.addEventListener('error', () => {
              performanceMetrics.imageLoadCount--;
              // 图片加载失败时使用字母图标
              iconPlaceholder.textContent = repo.name.charAt(0).toUpperCase();
              iconPlaceholder.classList.add('letter-icon');
            });
            
            // 清空占位符并添加图片
            iconPlaceholder.textContent = '';
            iconPlaceholder.appendChild(iconImg);
          } else {
            // 使用字母图标
            iconPlaceholder.textContent = iconResult.letter || repo.name.charAt(0).toUpperCase();
            iconPlaceholder.classList.add('letter-icon');
            performanceMetrics.imageLoadCount--;
          }
        } catch (iconError) {
          console.error('处理仓库图标失败:', iconError);
          performanceMetrics.imageLoadCount--;
        }
      });
    } else {
      // 如果图片加载数量超限，直接使用字母图标
      const iconPlaceholder = card.querySelector('.repo-icon-placeholder');
      iconPlaceholder.textContent = repo.name.charAt(0).toUpperCase();
      iconPlaceholder.classList.add('letter-icon');
    }
    
    return card;
  } catch (error) {
    console.error('创建仓库卡片失败:', error);
    // 返回错误卡片
    const errorCard = document.createElement('div');
    errorCard.className = 'repo-card error-card';
    errorCard.textContent = '加载失败';
    return errorCard;
  }
}


