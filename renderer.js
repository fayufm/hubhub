const axios = require('axios');
const { marked } = require('marked');
const { shell, ipcRenderer } = require('electron');
const Store = require('electron-store');
const path = require('path');
const os = require('os');
const translations = require('./translations');

// 当前语言
let currentLanguage = 'zh_CN';

// 获取翻译文本
function t(key) {
    const lang = translations[currentLanguage] || translations['zh_CN'];
    return lang[key] || key;
}

// 为API通信创建window.api对象
window.api = {
    selectFile: (options) => ipcRenderer.invoke('select-file', options),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    selectDownloadPath: () => ipcRenderer.invoke('select-download-path')
};

// 默认token（隐藏显示）
const PRIMARY_TOKEN = '{{YOUR_GITHUB_TOKEN}}'; // 最优先使用的内置token
const SECONDARY_TOKEN = '{{YOUR_GITHUB_TOKEN}}'; // 次优先级token
const TERTIARY_TOKEN = '{{YOUR_GITHUB_TOKEN}}'; // 最后使用的备用token

// 使用优先级最高的内置token作为默认token
const DEFAULT_TOKEN = PRIMARY_TOKEN;

// 初始化存储
const store = new Store({
    defaults: {
        github_token: DEFAULT_TOKEN,
        theme: 'light',
        language: 'zh_CN',
        card_display: 'grid',
        hide_badges: true,
        daily_visits: 0,
        last_visit_date: new Date().toDateString(),
        download_path: path.join(os.homedir(), 'Downloads')
    },
    // 启用加密
    encryptionKey: 'chengren_secure_encryption_key'
});

// 每日访问限制
const MAX_DAILY_VISITS = 300;

// 下载管理器
const downloadManager = {
    downloads: new Map(),
    activeDownloads: 0,
    
    // 初始化下载管理器
    init() {
        // 下载按钮
        this.downloadButton = document.getElementById('downloadButton');
        this.downloadCount = document.getElementById('downloadCount');
        this.downloadManager = document.getElementById('downloadManager');
        this.downloadList = document.getElementById('downloadList');
        this.downloadEmpty = document.getElementById('downloadEmpty');
        this.closeDownloads = document.getElementById('closeDownloads');
        
        // 点击下载按钮显示下载管理器
        if (this.downloadButton) {
            this.downloadButton.addEventListener('click', () => {
                this.toggleDownloadManager();
            });
        }
        
        // 点击关闭按钮隐藏下载管理器
        if (this.closeDownloads) {
            this.closeDownloads.addEventListener('click', () => {
                this.hideDownloadManager();
            });
        }
        
        // 监听下载事件
        this.listenForDownloadEvents();
    },
    
    // 显示/隐藏下载管理器
    toggleDownloadManager() {
        if (this.downloadManager.style.display === 'none' || !this.downloadManager.style.display) {
            this.downloadManager.style.display = 'block';
        } else {
            this.downloadManager.style.display = 'none';
        }
    },
    
    // 隐藏下载管理器
    hideDownloadManager() {
        this.downloadManager.style.display = 'none';
    },
    
    // 更新下载按钮状态
    updateDownloadButton() {
        if (this.activeDownloads > 0) {
            this.downloadButton.style.display = 'flex';
            this.downloadCount.textContent = this.activeDownloads;
        } else {
            this.downloadButton.style.display = 'none';
        }
    },
    
    // 更新下载列表
    updateDownloadList() {
        if (this.downloads.size === 0) {
            this.downloadEmpty.style.display = 'block';
            this.downloadList.style.display = 'none';
        } else {
            this.downloadEmpty.style.display = 'none';
            this.downloadList.style.display = 'block';
            
            // 清空列表
            this.downloadList.innerHTML = '';
            
            // 添加下载项
            this.downloads.forEach((download) => {
                const downloadItem = this.createDownloadItem(download);
                this.downloadList.appendChild(downloadItem);
            });
        }
    },
    
    // 创建下载项DOM
    createDownloadItem(download) {
        const item = document.createElement('div');
        item.className = 'download-item';
        item.dataset.id = download.id;
        
        // 格式化大小
        const totalSize = this.formatSize(download.size);
        const downloadedSize = this.formatSize(download.downloaded);
        
        // 格式化速度
        const speed = this.formatSpeed(download.speed);
        
        // 状态文本
        let statusText = '';
        let actions = '';
        
        switch (download.status) {
            case 'downloading':
                statusText = `${downloadedSize} / ${totalSize} - ${speed}`;
                actions = `<button class="download-action-button" data-action="cancel" data-id="${download.id}">取消</button>`;
                break;
            case 'completed':
                statusText = `已完成 - ${totalSize}`;
                actions = `
                    <button class="download-action-button" data-action="open" data-id="${download.id}">打开</button>
                    <button class="download-action-button" data-action="folder" data-id="${download.id}">打开目录</button>
                `;
                break;
            case 'error':
                statusText = `下载失败 - ${download.error || '未知错误'}`;
                actions = `<button class="download-action-button" data-action="retry" data-id="${download.id}">重试</button>`;
                break;
            case 'cancelled':
                statusText = '已取消';
                actions = `<button class="download-action-button" data-action="retry" data-id="${download.id}">重试</button>`;
                break;
        }
        
        item.innerHTML = `
            <div class="download-item-header">
                <div class="download-item-name">${download.filename}</div>
                <div class="download-item-size">${totalSize}</div>
            </div>
            <div class="download-progress-bar">
                <div class="download-progress-fill" style="width: ${download.progress}%"></div>
            </div>
            <div class="download-item-status">
                <div class="download-status-text">${statusText}</div>
                <div class="download-item-actions">
                    ${actions}
                </div>
            </div>
        `;
        
        // 添加点击事件
        const actionButtons = item.querySelectorAll('.download-action-button');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = button.dataset.action;
                const id = button.dataset.id;
                
                switch (action) {
                    case 'cancel':
                        this.cancelDownload(id);
                        break;
                    case 'open':
                        this.openFile(id);
                        break;
                    case 'folder':
                        this.openFolder(id);
                        break;
                    case 'retry':
                        this.retryDownload(id);
                        break;
                }
                
                e.stopPropagation();
            });
        });
        
        return item;
    },
    
    // 格式化文件大小
    formatSize(bytes) {
        if (!bytes || isNaN(bytes)) return '未知大小';
        
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
    },
    
    // 格式化下载速度
    formatSpeed(bytesPerSecond) {
        if (!bytesPerSecond || isNaN(bytesPerSecond)) return '未知速度';
        
        const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
        const i = Math.floor(Math.log(bytesPerSecond) / Math.log(1024));
        return (bytesPerSecond / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
    },
    
    // 添加下载任务
    addDownload(downloadInfo) {
        const id = downloadInfo.id || Date.now().toString();
        const download = {
            id,
            url: downloadInfo.url,
            filename: downloadInfo.filename,
            size: downloadInfo.size || 0,
            downloaded: 0,
            progress: 0,
            speed: 0,
            status: 'downloading',
            path: downloadInfo.path
        };
        
        this.downloads.set(id, download);
        this.activeDownloads++;
        
        this.updateDownloadButton();
        this.updateDownloadList();
        
        return id;
    },
    
    // 更新下载进度
    updateDownloadProgress(id, progress, downloaded, size, speed) {
        const download = this.downloads.get(id);
        if (download) {
            download.progress = progress;
            download.downloaded = downloaded;
            download.size = size;
            download.speed = speed;
            
            this.updateDownloadList();
        }
    },
    
    // 完成下载
    completeDownload(id, filePath) {
        const download = this.downloads.get(id);
        if (download) {
            download.status = 'completed';
            download.progress = 100;
            download.filePath = filePath;
            this.activeDownloads--;
            
            this.updateDownloadButton();
            this.updateDownloadList();
        }
    },
    
    // 下载错误
    errorDownload(id, error) {
        const download = this.downloads.get(id);
        if (download) {
            download.status = 'error';
            download.error = error;
            this.activeDownloads--;
            
            this.updateDownloadButton();
            this.updateDownloadList();
        }
    },
    
    // 取消下载
    cancelDownload(id) {
        const download = this.downloads.get(id);
        if (download && download.status === 'downloading') {
            // 通知主进程取消下载
            ipcRenderer.send('cancel-download', { id });
            
            download.status = 'cancelled';
            this.activeDownloads--;
            
            this.updateDownloadButton();
            this.updateDownloadList();
        }
    },
    
    // 打开文件
    openFile(id) {
        const download = this.downloads.get(id);
        if (download && download.filePath) {
            shell.openPath(download.filePath);
        }
    },
    
    // 打开文件夹
    openFolder(id) {
        const download = this.downloads.get(id);
        if (download && download.filePath) {
            shell.showItemInFolder(download.filePath);
        }
    },
    
    // 重试下载
    retryDownload(id) {
        const download = this.downloads.get(id);
        if (download) {
            // 删除旧的下载
            this.downloads.delete(id);
            
            // 创建新的下载
            const newDownload = {
                url: download.url,
                filename: download.filename,
                path: store.get('download_path')
            };
            
            // 开始新的下载
            this.startDownload(newDownload);
            
            this.updateDownloadList();
        }
    },
    
    // 开始下载
    startDownload(downloadInfo) {
        // 获取下载路径
        const downloadPath = store.get('download_path');
        
        // 创建下载ID
        const id = Date.now().toString();
        
        // 添加到下载列表
        this.addDownload({
            id,
            url: downloadInfo.url,
            filename: downloadInfo.filename,
            path: downloadPath
        });
        
        // 通知主进程开始下载
        ipcRenderer.send('start-download', {
            id,
            url: downloadInfo.url,
            filename: downloadInfo.filename,
            downloadPath
        });
    },
    
    // 监听下载事件
    listenForDownloadEvents() {
        // 监听下载进度
        ipcRenderer.on('download-progress', (event, { id, progress, downloaded, size, speed }) => {
            this.updateDownloadProgress(id, progress, downloaded, size, speed);
        });
        
        // 监听下载完成
        ipcRenderer.on('download-complete', (event, { id, filePath }) => {
            this.completeDownload(id, filePath);
        });
        
        // 监听下载错误
        ipcRenderer.on('download-error', (event, { id, error }) => {
            this.errorDownload(id, error);
        });
        
        // 监听下载取消
        ipcRenderer.on('download-cancelled', (event, { id }) => {
            const download = this.downloads.get(id);
            if (download) {
                download.status = 'cancelled';
                this.updateDownloadList();
            }
        });
        
        // 监听下载重定向
        ipcRenderer.on('download-redirect', (event, { id, url }) => {
            const download = this.downloads.get(id);
            if (download) {
                download.url = url;
                this.startDownload({
                    url,
                    filename: download.filename
                });
            }
        });
    }
};

// 检查并更新访问计数
function checkVisitLimits() {
    const currentDate = new Date().toDateString();
    const lastVisitDate = store.get('last_visit_date');
    
    // 如果日期不同，重置计数
    if (currentDate !== lastVisitDate) {
        store.set('daily_visits', 0);
        store.set('last_visit_date', currentDate);
    }
    
    // 获取当前访问次数
    const dailyVisits = store.get('daily_visits');
    
    // 检查是否使用默认token且已达到限制
    if (GITHUB_TOKEN === DEFAULT_TOKEN && dailyVisits >= MAX_DAILY_VISITS) {
        alert('您今日的访问次数已达到上限(300次)。请设置您自己的GitHub Token以获取更高的访问限制。');
        return false;
    }
    
    // 如果使用默认token，增加访问计数
    if (GITHUB_TOKEN === DEFAULT_TOKEN) {
        store.set('daily_visits', dailyVisits + 1);
    }
    
    return true;
}

// 获取存储的GitHub Token
let GITHUB_TOKEN = store.get('github_token');
// 不再需要单独的备用token变量，因为已经在上面定义了token优先级

// DOM元素
const searchInput = document.getElementById('unifiedSearchInput');
const searchButton = document.getElementById('unifiedSearchButton');
const resultsContainer = document.getElementById('results');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const closeButton = document.querySelector('.close');
const searchTabs = document.querySelectorAll('.search-tabs .tab-button');
const searchContents = document.querySelectorAll('.search-content');

// 配置axios默认值
axios.defaults.baseURL = 'https://api.github.com';
axios.defaults.headers.common['Accept'] = 'application/vnd.github.v3+json';
axios.defaults.headers.common['Authorization'] = `token ${GITHUB_TOKEN}`;
axios.defaults.timeout = 10000; // 10秒超时

// 设置相关的DOM元素
let settingsButton, settingsPanel, closeSettings, tokenInput, saveTokenButton, themeOptions;
let cardDisplayOptions, hideBadgesCheckbox;

// 页面状态控制
let currentPage = 'search'; // 'search'、'random' 或 'trending'
let randomProjectsLoaded = false;
let trendingProjects = {
    currentTime: '3d',
    page: 1,
    data: new Map(), // 使用Map存储不同时间段的数据
    hasMore: true,
    currentLanguage: 'all',
    currentStars: '0' // 星级筛选，0表示不限制最小星级
};

// 获取随机流行项目
async function getRandomPopularProjects() {
    // 检查访问限制
    if (!checkVisitLimits()) {
        throw new Error('已达到今日访问限制');
    }
    
    try {
        console.log('正在获取随机项目...');
        
        // 常用语言列表
        const languages = [
            'javascript', 'python', 'java', 'go', 'typescript', 
            'c++', 'rust', 'php', 'c#', 'swift', 'kotlin'
        ];
        
        // 随机选择3种语言
        const shuffledLanguages = languages.sort(() => 0.5 - Math.random());
        const selectedLanguages = shuffledLanguages.slice(0, 3);
        console.log('选择的语言:', selectedLanguages.join(', '));
        
        // 构建搜索查询 - 按语言和星级筛选
        const randomQueries = selectedLanguages.map(lang => 
            `language:${lang} stars:>1000`
        );
        
        // 直接尝试一个简单查询，看看API是否正常工作
        console.log('尝试获取热门JavaScript项目...');
        let testResponse;
        try {
            testResponse = await axios.get(`/search/repositories`, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                },
                params: {
                    q: 'language:javascript stars:>5000',
                    sort: 'stars',
                    order: 'desc',
                    per_page: 10
                }
            });
        } catch (error) {
            // 检查是否是API限制或授权问题，尝试回退token
            if (error.response && (error.response.status === 403 || error.response.status === 401)) {
                if (tryFallbackToken()) {
                    // 使用新token重试整个函数
                    return getRandomPopularProjects();
                }
            }
            throw error;
        }
        
        console.log(`测试查询返回 ${testResponse.data.items?.length || 0} 个项目`);
        
        if (!testResponse.data.items || testResponse.data.items.length === 0) {
            console.error('测试查询未返回任何结果:', testResponse.data);
            return testResponse.data.items || [];
        }
        
        // 存储所有获取到的项目
        let allProjects = [];
        
        // 为每个语言获取项目
        for (const query of randomQueries) {
            try {
                console.log(`正在获取 ${query} 的项目...`);
                const response = await axios.get(`/search/repositories`, {
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    params: {
                        q: query,
                        sort: 'stars',
                        order: 'desc',
                        per_page: 20
                    }
                });
                
                if (response.data.items && response.data.items.length > 0) {
                    console.log(`获取到 ${response.data.items.length} 个 ${query} 项目`);
                    allProjects = [...allProjects, ...response.data.items];
                } else {
                    console.warn(`未获取到 ${query} 项目`);
                }
            } catch (error) {
                console.error(`获取 ${query} 项目失败:`, error);
                if (error.response) {
                    console.error('错误状态:', error.response.status);
                    console.error('错误数据:', error.response.data);
                    
                    // 检查是否是API限制或授权问题，尝试回退token
                    if (error.response.status === 403 || error.response.status === 401) {
                        if (tryFallbackToken()) {
                            // 重试当前的查询
                            try {
                                const retryResponse = await axios.get(`/search/repositories`, {
                                    headers: {
                                        'Authorization': `token ${GITHUB_TOKEN}`,
                                        'Accept': 'application/vnd.github.v3+json'
                                    },
                                    params: {
                                        q: query,
                                        sort: 'stars',
                                        order: 'desc',
                                        per_page: 20
                                    }
                                });
                                
                                if (retryResponse.data.items && retryResponse.data.items.length > 0) {
                                    console.log(`重试成功! 获取到 ${retryResponse.data.items.length} 个 ${query} 项目`);
                                    allProjects = [...allProjects, ...retryResponse.data.items];
                                }
                            } catch (retryError) {
                                console.error(`使用新token重试仍然失败:`, retryError);
                            }
                        }
                    }
                }
            }
        }
        
        // 如果没有获取到任何项目，使用测试查询的结果
        if (allProjects.length === 0) {
            console.log('使用测试查询结果作为备选');
            allProjects = testResponse.data.items || [];
        }
        
        // 合并项目并打乱顺序
        allProjects = allProjects.sort(() => 0.5 - Math.random());
        console.log(`共获取到 ${allProjects.length} 个项目，准备显示`);
        
        // 限制为30个项目
        return allProjects.slice(0, 30);
    } catch (error) {
        console.error('获取随机项目失败:', error);
        if (error.response) {
            console.error('API错误状态:', error.response.status);
            console.error('API错误数据:', error.response.data);
            
            // 检查是否是API限制或授权问题，尝试回退token
            if (error.response.status === 403 || error.response.status === 401) {
                if (tryFallbackToken()) {
                    // 重新尝试获取随机项目
                    return getRandomPopularProjects();
                }
            }
        }
        throw error;
    }
}

// 显示随机项目
async function showRandomProjects() {
    const randomResultsContainer = document.getElementById('randomResults');
    const loadingElement = document.getElementById('loadingRandom');
    const randomPage = document.getElementById('randomPage');
    
    // 确保随机页面是显示的
    randomPage.classList.add('active');
    
    // 显示加载中
    randomResultsContainer.style.display = 'none';
    loadingElement.style.display = 'flex';
    
    console.log('开始加载随机项目...');
    
    try {
        const randomProjects = await getRandomPopularProjects();
        console.log(`获取到 ${randomProjects.length} 个随机项目`);
        
        if (randomProjects && randomProjects.length > 0) {
            // 直接操作DOM显示项目
            randomResultsContainer.innerHTML = '';
            
            // 获取当前卡片显示方式
            const cardDisplay = store.get('card_display');
            const hideBadges = store.get('hide_badges');
            
            // 设置结果容器的类名
            randomResultsContainer.classList.toggle('list-view', cardDisplay === 'list');
            randomResultsContainer.classList.add('show');
            
            // 手动创建并添加每个项目卡片
            randomProjects.forEach(repo => {
                const card = document.createElement('div');
                card.className = 'repo-card';
                
                // 检查是否有主题徽章，如果hideBadges为true则隐藏
                let badgeHtml = '';
                if (!hideBadges) {
                    badgeHtml = `<img class="repo-badge" src="https://img.shields.io/github/stars/${repo.full_name}" alt="Stars" onerror="this.style.display='none'">`;
                }
                
                // 获取仓库所属用户/组织的头像作为图标
                const avatarUrl = repo.owner.avatar_url;
                
                // 根据卡片显示方式应用不同的HTML结构
                if (cardDisplay === 'list') {
                    card.innerHTML = `
                        <div class="repo-avatar">
                            <img src="${avatarUrl}" alt="${repo.owner.login}" onerror="this.src='./assets/default-avatar.png'">
                        </div>
                        <div class="repo-info">
                            <div class="repo-name" data-url="https://github.com/${repo.full_name}">${repo.full_name}</div>
                            <div class="repo-description">${repo.description || '无描述'}</div>
                        </div>
                        <div class="repo-stats">
                            <span>⭐ ${repo.stargazers_count}</span>
                            <span>👁️ ${repo.watchers_count}</span>
                            <span>🍴 ${repo.forks_count}</span>
                            ${badgeHtml}
                        </div>
                    `;
                } else {
                    card.innerHTML = `
                        <div class="repo-header">
                            <div class="repo-avatar">
                                <img src="${avatarUrl}" alt="${repo.owner.login}" onerror="this.src='./assets/default-avatar.png'">
                            </div>
                            <div class="repo-name" data-url="https://github.com/${repo.full_name}">${repo.full_name}</div>
                        </div>
                        <div class="repo-description">${repo.description || '无描述'}</div>
                        <div class="repo-stats">
                            <span>⭐ ${repo.stargazers_count}</span>
                            <span>👁️ ${repo.watchers_count}</span>
                            <span>🍴 ${repo.forks_count}</span>
                            ${badgeHtml}
                        </div>
                    `;
                }
                
                // 添加卡片点击事件
                card.addEventListener('click', () => showRepositoryDetails(repo));
                randomResultsContainer.appendChild(card);
                
                // 添加项目名称点击事件 - 在浏览器中打开GitHub页面
                const repoNameElement = card.querySelector('.repo-name');
                if (repoNameElement) {
                    repoNameElement.addEventListener('click', (e) => {
                        e.stopPropagation(); // 阻止事件冒泡，不触发卡片点击事件
                        const url = repoNameElement.getAttribute('data-url');
                        if (url) {
                            shell.openExternal(url);
                        }
                    });
                }
            });
            
            randomProjectsLoaded = true;
            
            // 确保结果可见
            randomResultsContainer.style.display = 'grid';
            console.log('随机项目已渲染到DOM');
            
            // 强制重排DOM
            setTimeout(() => {
                randomResultsContainer.style.opacity = '0';
                setTimeout(() => {
                    randomResultsContainer.style.opacity = '1';
                }, 50);
            }, 0);
        } else {
            console.error('未获取到随机项目');
            randomResultsContainer.innerHTML = `
                <div class="error-message">
                    <h3>获取项目失败</h3>
                    <p>无法获取随机项目，请稍后再试或检查您的网络连接。</p>
                    <button id="retryRandomButton" class="retry-button">重试</button>
                </div>
            `;
            
            // 添加重试按钮事件
            setTimeout(() => {
                const retryBtn = document.getElementById('retryRandomButton');
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => {
                        randomProjectsLoaded = false;
                        showRandomProjects();
                    });
                }
            }, 100);
        }
    } catch (error) {
        console.error('显示随机项目出错:', error);
        randomResultsContainer.innerHTML = `
            <div class="error-message">
                <h3>获取项目失败</h3>
                <p>${error.message || '未知错误'}</p>
                <button id="retryRandomButton" class="retry-button">重试</button>
            </div>
        `;
        
        // 添加重试按钮事件
        setTimeout(() => {
            const retryBtn = document.getElementById('retryRandomButton');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    randomProjectsLoaded = false;
                    showRandomProjects();
                });
            }
        }, 100);
    } finally {
        // 隐藏加载中
        loadingElement.style.display = 'none';
        randomResultsContainer.style.display = 'grid';
    }
}

// 切换页面
function switchPage(targetPage) {
    const searchPage = document.getElementById('searchPage');
    const randomPage = document.getElementById('randomPage');
    const trendingPage = document.getElementById('trendingPage');
    const searchNavButton = document.getElementById('searchNavButton');
    const randomNavButton = document.getElementById('randomNavButton');
    const trendingNavButton = document.getElementById('trendingNavButton');
    
    console.log(`切换到页面: ${targetPage}`);
    
    // 如果当前已经是目标页面，不做任何操作
    if (currentPage === targetPage) {
        console.log(`已经在 ${targetPage} 页面，不需要切换`);
        return;
    }
    
    // 隐藏所有页面
    searchPage.classList.remove('active');
    randomPage.classList.remove('active');
    trendingPage.classList.remove('active');
    
    // 确保所有页面的显示样式被重置
    searchPage.style.display = 'none';
    randomPage.style.display = 'none';
    trendingPage.style.display = 'none';
    
    // 重置所有导航按钮
    searchNavButton.classList.remove('active');
    randomNavButton.classList.remove('active');
    trendingNavButton.classList.remove('active');
    
    // 根据目标页面显示相应内容
    if (targetPage === 'random') {
        // 切换到随机页面
        randomPage.classList.add('active');
        randomPage.style.display = 'block';
        randomNavButton.classList.add('active');
        currentPage = 'random';
        
        // 强制重置随机项目标志，确保每次都重新加载
        randomProjectsLoaded = false;
        
        // DOM更新后再加载随机项目
        setTimeout(() => {
            // 强制重新计算DOM布局
            randomPage.offsetHeight; // 触发重排
            
            console.log('即将加载随机项目...');
            showRandomProjects();
        }, 100);
    } else if (targetPage === 'trending') {
        // 切换到热门项目页面
        trendingPage.classList.add('active');
        trendingPage.style.display = 'block';
        trendingNavButton.classList.add('active');
        currentPage = 'trending';
        
        // 强制清空热门项目数据缓存和重置页码
        trendingProjects.data.clear();
        trendingProjects.page = 1;
        trendingProjects.hasMore = true;
        
        // 先确保DOM完全更新
        setTimeout(() => {
            // 重新获取元素并强制显示
            const trendingPage = document.getElementById('trendingPage');
            const trendingResults = document.getElementById('trendingResults');
            const loadingTrending = document.getElementById('loadingTrending');
            
            // 确保元素存在并可见
            if (trendingPage) {
                trendingPage.style.display = 'block';
                console.log('热门页面显示样式已设置为block');
            }
            
            if (trendingResults) {
                trendingResults.innerHTML = ''; // 清空内容
                trendingResults.style.display = 'grid';
                console.log('热门结果容器已清空并设置为grid显示');
            }
            
            if (loadingTrending) {
                loadingTrending.style.display = 'flex';
                console.log('加载指示器显示样式已设置为flex');
            }
            
            // 强制重新计算DOM布局
            document.body.offsetHeight; // 触发全局重排
            
            console.log('即将加载热门项目，DOM已强制更新...');
            // 始终使用reset=true，确保清空并重新加载
            showTrendingProjects(true);
        }, 100);
    } else if (targetPage === 'search') {
        // 切换到搜索页面
        searchPage.classList.add('active');
        searchPage.style.display = 'block';
        searchNavButton.classList.add('active');
        currentPage = 'search';
        
        // 重置搜索页面状态
        setTimeout(() => {
            const searchSection = document.getElementById('search-section');
            if (resultsContainer.children.length === 0) {
                searchSection.classList.add('centered');
            }
        }, 100);
    }
}

// 调试辅助函数 - 检查DOM元素状态
function debugElement(selector, message = '') {
    const element = document.querySelector(selector);
    if (!element) {
        console.error(`${message} 元素不存在: ${selector}`);
        return;
    }
    
    const style = window.getComputedStyle(element);
    console.log(`${message || '元素'} ${selector}:`, {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        height: style.height,
        width: style.width,
        position: style.position,
        zIndex: style.zIndex,
        overflow: style.overflow,
        childElementCount: element.childElementCount
    });
    
    // 如果是结果容器，检查子元素
    if ((selector === '#randomResults' || selector === '#trendingResults') && element.childElementCount > 0) {
        const firstChild = element.children[0];
        const firstChildStyle = window.getComputedStyle(firstChild);
        console.log('第一个子元素:', {
            tagName: firstChild.tagName,
            className: firstChild.className,
            display: firstChildStyle.display,
            visibility: firstChildStyle.visibility,
            opacity: firstChildStyle.opacity
        });
    }
}

// 初始化页面按钮
function initPageButtons() {
    const searchNavButton = document.getElementById('searchNavButton');
    const randomNavButton = document.getElementById('randomNavButton');
    const trendingNavButton = document.getElementById('trendingNavButton');
    
    // 初始化搜索按钮
    if (searchNavButton) {
        searchNavButton.classList.add('active'); // 默认激活
        searchNavButton.addEventListener('click', () => {
            if (currentPage !== 'search') {
                switchPage('search');
            }
        });
    }
    
    // 初始化随机项目按钮
    if (randomNavButton) {
        randomNavButton.addEventListener('click', () => {
            if (currentPage !== 'random') {
                switchPage('random');
                
                // 2秒后检查随机页面状态
                setTimeout(() => {
                    debugElement('#randomPage', '随机页面');
                    debugElement('#randomResults', '随机结果容器');
                }, 2000);
            }
        });
    }
    
    // 初始化热门项目按钮
    if (trendingNavButton) {
        trendingNavButton.addEventListener('click', () => {
            if (currentPage !== 'trending') {
                switchPage('trending');
                
                // 2秒后检查热门项目页面状态
                setTimeout(() => {
                    debugElement('#trendingPage', '热门项目页面');
                    debugElement('#trendingResults', '热门项目结果容器');
                }, 2000);
            }
        });
    }
    
    // 初始化时间筛选按钮
    const timeFilterButtons = document.querySelectorAll('.time-filter-btn');
    timeFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const time = button.dataset.time;
            console.log(`切换时间筛选: ${time}`);
            
            // 更新按钮状态
            timeFilterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 更新当前时间筛选
            trendingProjects.currentTime = time;
            trendingProjects.page = 1;
            
            // 重新加载热门项目
            showTrendingProjects(true);
        });
    });
    
    // 初始化语言筛选按钮
    const languageFilterButtons = document.querySelectorAll('.language-filter-btn');
    languageFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const lang = button.dataset.lang;
            console.log(`切换语言筛选: ${lang}`);
            
            // 更新按钮状态
            languageFilterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 更新当前语言筛选
            trendingProjects.currentLanguage = lang;
            trendingProjects.page = 1;
            
            // 重新加载热门项目
            showTrendingProjects(true);
        });
    });
    
    // 初始化星级筛选按钮
    const starsFilterButtons = document.querySelectorAll('.stars-filter-btn');
    starsFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const stars = button.dataset.stars;
            console.log(`切换星级筛选: ${stars}`);
            
            // 更新按钮状态
            starsFilterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 更新当前星级筛选
            trendingProjects.currentStars = stars;
            trendingProjects.page = 1;
            
            // 重新加载热门项目
            showTrendingProjects(true);
        });
    });
    
    // 初始化加载更多按钮
    const loadMoreButton = document.getElementById('loadMoreTrending');
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
            console.log('加载更多热门项目');
            loadMoreTrendingProjects();
        });
    }
}

// 修改显示仓库函数，接收可选的容器参数
function displayRepositories(repositories, container = null) {
    // 确定使用哪个容器
    const resultsContainer = container || document.getElementById('results');
    console.log(`显示 ${repositories.length} 个仓库到容器:`, container ? 'randomResults' : 'results');
    
    // 清空容器
    resultsContainer.innerHTML = '';
    
    // 获取当前卡片显示方式
    const cardDisplay = store.get('card_display');
    const hideBadges = store.get('hide_badges');
    
    // 设置结果容器的类名
    resultsContainer.classList.toggle('list-view', cardDisplay === 'list');
    resultsContainer.classList.add('show');
    
    if (repositories.length === 0) {
        resultsContainer.innerHTML = `
            <div class="error-message">
                <h3>未找到项目</h3>
                <p>没有匹配的项目或发生了错误</p>
            </div>
        `;
        return;
    }
    
    repositories.forEach(repo => {
        const card = document.createElement('div');
        card.className = 'repo-card';
        
        // 检查是否有主题徽章，如果hideBadges为true则隐藏
        let badgeHtml = '';
        if (!hideBadges) {
            badgeHtml = `<img class="repo-badge" src="https://img.shields.io/github/stars/${repo.full_name}" alt="Stars" onerror="this.style.display='none'">`;
        }
        
        // 获取仓库所属用户/组织的头像作为图标
        const avatarUrl = repo.owner.avatar_url;
        
        // 根据卡片显示方式应用不同的HTML结构
        if (cardDisplay === 'list') {
            card.innerHTML = `
                <div class="repo-avatar">
                    <img src="${avatarUrl}" alt="${repo.owner.login}" onerror="this.src='./assets/default-avatar.png'">
                </div>
                <div class="repo-info">
                    <div class="repo-name" data-url="https://github.com/${repo.full_name}">${repo.full_name}</div>
                    <div class="repo-description">${repo.description || '无描述'}</div>
                </div>
                <div class="repo-stats">
                    <span>⭐ ${repo.stargazers_count}</span>
                    <span>👁️ ${repo.watchers_count}</span>
                    <span>🍴 ${repo.forks_count}</span>
                    ${badgeHtml}
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="repo-header">
                    <div class="repo-avatar">
                        <img src="${avatarUrl}" alt="${repo.owner.login}" onerror="this.src='./assets/default-avatar.png'">
                    </div>
                    <div class="repo-name" data-url="https://github.com/${repo.full_name}">${repo.full_name}</div>
                </div>
                <div class="repo-description">${repo.description || '无描述'}</div>
                <div class="repo-stats">
                    <span>⭐ ${repo.stargazers_count}</span>
                    <span>👁️ ${repo.watchers_count}</span>
                    <span>🍴 ${repo.forks_count}</span>
                    ${badgeHtml}
                </div>
            `;
        }
        
        // 添加卡片点击事件 - 显示仓库详情
        card.addEventListener('click', () => showRepositoryDetails(repo));
        
        // 添加到容器
        resultsContainer.appendChild(card);
        
        // 添加项目名称点击事件 - 在浏览器中打开GitHub页面
        const repoNameElement = card.querySelector('.repo-name');
        if (repoNameElement) {
            repoNameElement.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡，不触发卡片点击事件
                const url = repoNameElement.getAttribute('data-url');
                if (url) {
                    shell.openExternal(url);
                }
            });
        }
    });
}

// 初始化DOM元素
function initDomElements() {
    settingsButton = document.getElementById('settingsButton');
    settingsPanel = document.getElementById('settingsPanel');
    closeSettings = document.getElementById('closeSettings');
    tokenInput = document.getElementById('tokenInput');
    saveTokenButton = document.getElementById('saveToken');
    themeOptions = document.querySelectorAll('input[name="theme"]');
    cardDisplayOptions = document.querySelectorAll('input[name="card-display"]');
    hideBadgesCheckbox = document.getElementById('hideBadges');
    
    // 如果正在使用默认token，不显示token内容
    if (tokenInput) {
        if (GITHUB_TOKEN === DEFAULT_TOKEN) {
            tokenInput.value = '';
            tokenInput.placeholder = '请设置您的GitHub Token';
        } else {
            tokenInput.value = GITHUB_TOKEN;
        }
    }
    
    // 下载路径输入框
    const downloadPathInput = document.getElementById('downloadPathInput');
    const selectDownloadPathButton = document.getElementById('selectDownloadPath');
    
    if (downloadPathInput) {
        downloadPathInput.value = store.get('download_path');
    }
    
    if (selectDownloadPathButton) {
        selectDownloadPathButton.addEventListener('click', async () => {
            const path = await ipcRenderer.invoke('select-download-path');
            if (path) {
                store.set('download_path', path);
                downloadPathInput.value = path;
            }
        });
    }
    
    // 初始化语言下拉选择器
    initLanguageDropdown();
    
    // 窗口控制按钮初始化
    initWindowControls();
}

// 初始化语言下拉选择器
function initLanguageDropdown() {
    const languageDropdown = document.getElementById('languageDropdown');
    const languageOptions = document.querySelector('.language-options');
    
    if (languageDropdown && languageOptions) {
        // 点击显示/隐藏语言选项
        languageDropdown.addEventListener('click', function() {
            const isVisible = languageOptions.style.display !== 'none';
            languageOptions.style.display = isVisible ? 'none' : 'block';
            languageDropdown.classList.toggle('active');
        });
        
        // 点击外部区域关闭下拉菜单
        document.addEventListener('click', function(event) {
            if (!event.target.closest('#languageDropdown') && !event.target.closest('.language-options')) {
                languageOptions.style.display = 'none';
                languageDropdown.classList.remove('active');
            }
        });
        
        // 选择语言
        const languageOptionElements = document.querySelectorAll('.language-option');
        languageOptionElements.forEach(option => {
            option.addEventListener('click', function() {
                const language = this.getAttribute('data-value');
                
                // 如果选择繁体中文，显示提示框
                if (language === 'zh_TW') {
                    showTWMessage();
                    return; // 不切换语言
                }
                
                saveLanguage(language);
                languageOptions.style.display = 'none';
                languageDropdown.classList.remove('active');
            });
        });
    }
}

// 更新当前语言显示
function updateCurrentLanguageDisplay() {
    const currentLanguage = localStorage.getItem('language') || 'zh_CN';
    const languageNames = {
        'zh_CN': '简体中文',
        'zh_TW': '繁體中文',
        'en_US': '美式英语 (US English)',
        'en_GB': '英式英语 (UK English)',
        'ar_SA': 'اللغة العربية (Arabic)',
        'fr_FR': 'Français (French)'
    };
    
    const currentLanguageText = document.querySelector('.current-language-text');
    if (currentLanguageText) {
        currentLanguageText.textContent = languageNames[currentLanguage] || languageNames['zh_CN'];
    }
}

// 显示繁体中文提示框
function showTWMessage() {
    const twMessageOverlay = document.getElementById('twMessageOverlay');
    if (twMessageOverlay) {
        twMessageOverlay.classList.add('show');
        
        // 3秒后自动关闭
        setTimeout(() => {
            twMessageOverlay.classList.remove('show');
        }, 3000);
        
        // 添加关闭按钮事件
        const twMessageClose = document.getElementById('twMessageClose');
        if (twMessageClose) {
            twMessageClose.addEventListener('click', () => {
                twMessageOverlay.classList.remove('show');
            });
        }
        
        // 点击遮罩层关闭
        twMessageOverlay.addEventListener('click', (e) => {
            if (e.target === twMessageOverlay) {
                twMessageOverlay.classList.remove('show');
            }
        });
    }
}

// 初始化语言设置
function initLanguage() {
    const savedLanguage = localStorage.getItem('language') || 'zh_CN';
    saveLanguage(savedLanguage);
    updateCurrentLanguageDisplay();
    updateUILanguage();
    
    // 设置文档的dir属性，用于RTL支持
    updateDocumentDirection(savedLanguage);
}

// 保存语言设置
function saveLanguage(language) {
    localStorage.setItem('language', language);
    updateUILanguage();
    updateCurrentLanguageDisplay();
    
    // 更新文档方向
    updateDocumentDirection(language);
}

// 更新文档方向属性，用于RTL支持
function updateDocumentDirection(language) {
    // 阿拉伯语需要RTL方向
    if (language === 'ar_SA') {
        document.documentElement.setAttribute('dir', 'rtl');
    } else {
        document.documentElement.setAttribute('dir', 'ltr');
    }
}

// 更新UI语言
function updateUILanguage() {
    const currentLanguage = localStorage.getItem('language') || 'zh_CN';
    const translations = require('./translations');
    
    // 如果没有找到对应的翻译，使用简体中文作为默认
    const translationData = translations[currentLanguage] || translations.zh_CN;
    
    // 更新各页面的文本
    updateSettingsPanelLanguage(translationData);
    updateMainPageLanguage(translationData);
    updateNavigationLanguage(translationData);
    updateDownloadManagerLanguage(translationData);
}

// 更新设置面板语言
function updateSettingsPanelLanguage(translations) {
    // 标题
    const settingsHeader = document.querySelector('.settings-header h2');
    if (settingsHeader) settingsHeader.textContent = translations.settings;
    
    // 语言设置
    const languageSettingsHeader = document.querySelector('.settings-group:nth-child(1) h3');
    if (languageSettingsHeader) languageSettingsHeader.textContent = translations.language_settings;
    
    // 主题设置
    const themeSettingsHeader = document.querySelector('.settings-group:nth-child(2) h3');
    if (themeSettingsHeader) themeSettingsHeader.textContent = translations.theme_settings;
    
    const lightThemeLabel = document.querySelector('.theme-options label:nth-child(1)');
    if (lightThemeLabel) lightThemeLabel.childNodes[1].textContent = translations.light_theme;
    
    const darkThemeLabel = document.querySelector('.theme-options label:nth-child(2)');
    if (darkThemeLabel) darkThemeLabel.childNodes[1].textContent = translations.dark_theme;
    
    // 卡片显示设置
    const cardDisplayHeader = document.querySelector('.settings-group:nth-child(3) h3');
    if (cardDisplayHeader) cardDisplayHeader.textContent = translations.card_display;
    
    const gridViewLabel = document.querySelector('.card-display-options label:nth-child(1)');
    if (gridViewLabel) gridViewLabel.childNodes[1].textContent = translations.grid_view;
    
    const listViewLabel = document.querySelector('.card-display-options label:nth-child(2)');
    if (listViewLabel) listViewLabel.childNodes[1].textContent = translations.list_view;
    
    const hideBadgesLabel = document.querySelector('.display-options label');
    if (hideBadgesLabel) hideBadgesLabel.childNodes[1].textContent = translations.hide_badges;
    
    // GitHub Token设置
    const tokenHeader = document.querySelector('.settings-group:nth-child(4) h3');
    if (tokenHeader) tokenHeader.textContent = translations.github_token;
    
    const tokenInput = document.getElementById('tokenInput');
    if (tokenInput) tokenInput.placeholder = translations.token_placeholder;
    
    const saveTokenButton = document.getElementById('saveToken');
    if (saveTokenButton) saveTokenButton.textContent = translations.save;
    
    const tokenTip = document.querySelector('.token-tip');
    if (tokenTip) tokenTip.textContent = translations.token_tip;
    
    const tokenLimitInfo = document.querySelector('.token-limit-tip strong');
    if (tokenLimitInfo) tokenLimitInfo.textContent = translations.access_limit;
    
    const tokenLimitDesc = document.querySelector('.token-limit-tip');
    if (tokenLimitDesc) {
        // 保留strong标签
        const strong = tokenLimitDesc.querySelector('strong');
        tokenLimitDesc.innerHTML = '';
        tokenLimitDesc.appendChild(strong);
        tokenLimitDesc.appendChild(document.createElement('br'));
        tokenLimitDesc.appendChild(document.createTextNode(translations.access_limit_desc));
    }
    
    const tokenHelpLink = document.getElementById('tokenHelpLink');
    if (tokenHelpLink) tokenHelpLink.textContent = translations.how_to_token;
    
    // 下载设置
    const downloadSettingsHeader = document.querySelector('.settings-group:nth-child(5) h3');
    if (downloadSettingsHeader) downloadSettingsHeader.textContent = translations.download_settings;
    
    const downloadPathInput = document.getElementById('downloadPathInput');
    if (downloadPathInput) downloadPathInput.placeholder = translations.download_path;
    
    const selectPathButton = document.getElementById('selectDownloadPath');
    if (selectPathButton) selectPathButton.textContent = translations.select_path;
    
    const downloadPathTip = document.querySelector('.download-path-tip');
    if (downloadPathTip) downloadPathTip.textContent = translations.download_path_tip;
    
    // 背景设置
    const backgroundHeader = document.querySelector('.settings-group:nth-child(6) h3');
    if (backgroundHeader) backgroundHeader.textContent = translations.custom_background;
    
    const noBackgroundLabel = document.querySelector('.background-options label:nth-child(1)');
    if (noBackgroundLabel) noBackgroundLabel.childNodes[1].textContent = translations.no_background;
    
    const colorBackgroundLabel = document.querySelector('.background-options label:nth-child(2)');
    if (colorBackgroundLabel) colorBackgroundLabel.childNodes[1].textContent = translations.color_background;
    
    const localImageLabel = document.querySelector('.background-options label:nth-child(3)');
    if (localImageLabel) localImageLabel.childNodes[1].textContent = translations.local_image;
    
    const urlImageLabel = document.querySelector('.background-options label:nth-child(4)');
    if (urlImageLabel) urlImageLabel.childNodes[1].textContent = translations.url_image;
    
    const selectLocalImageButton = document.getElementById('selectBackgroundImage');
    if (selectLocalImageButton) selectLocalImageButton.textContent = translations.select_local_image;
    
    const backgroundUrlInput = document.getElementById('backgroundUrlInput');
    if (backgroundUrlInput) backgroundUrlInput.placeholder = translations.enter_image_url;
    
    const applyUrlButton = document.getElementById('applyBackgroundUrl');
    if (applyUrlButton) applyUrlButton.textContent = translations.apply;
    
    const backgroundSettingsHeader = document.querySelector('.background-settings h4');
    if (backgroundSettingsHeader) backgroundSettingsHeader.textContent = translations.background_settings;
    
    const opacityLabel = document.querySelector('.background-opacity label');
    if (opacityLabel) opacityLabel.textContent = translations.opacity;
    
    const blurLabel = document.querySelector('.background-blur label');
    if (blurLabel) blurLabel.textContent = translations.blur;
}

// 更新主页面语言
function updateMainPageLanguage(translations) {
    // 更新搜索页面
    document.querySelector('#unifiedSearchInput').placeholder = translations.search_placeholder;
    document.querySelector('.search-tip').textContent = translations.search_tip;
    
    // 更新随机项目页面
    document.querySelector('#randomPage h2').textContent = translations.random;
    document.querySelector('#randomPage .page-description').textContent = translations.random_description;
    document.querySelector('#loadingRandom p').textContent = translations.loading_random;
    
    // 更新热门项目页面
    document.querySelector('#trendingPage h2').textContent = translations.trending;
    document.querySelector('#trendingPage .page-description').textContent = translations.trending_description;
    document.querySelector('#loadingTrending p').textContent = translations.loading_trending;
    document.querySelector('#loadMoreTrending').textContent = translations.load_more;
    
    // 更新时间筛选按钮
    document.querySelectorAll('.time-filter-btn').forEach(btn => {
        const timeKey = `time_${btn.dataset.time}`;
        if (translations[timeKey]) {
            btn.textContent = translations[timeKey];
        }
    });
    
    // 更新语言筛选组件
    document.querySelector('.language-filter-label').textContent = translations.language_filter;
    document.querySelectorAll('.language-filter-btn').forEach(btn => {
        const langKey = `lang_${btn.dataset.lang}`;
        if (translations[langKey]) {
            btn.textContent = translations[langKey];
        }
    });
    
    // 更新星级筛选组件
    const starsFilterLabel = document.querySelector('.stars-filter-label');
    if (starsFilterLabel) {
        starsFilterLabel.textContent = translations.stars_filter;
    }
    
    document.querySelectorAll('.stars-filter-btn').forEach(btn => {
        const starsKey = `stars_${btn.dataset.stars}`;
        if (translations[starsKey]) {
            btn.textContent = translations[starsKey];
        }
    });
    
    // 更新任何可能存在的错误消息
    const errorMsgTitle = document.querySelector('#trendingResults .error-message h3');
    if (errorMsgTitle) {
        errorMsgTitle.textContent = translations.no_results;
        
        const errorMsgDesc = document.querySelector('#trendingResults .error-message p');
        if (errorMsgDesc) {
            errorMsgDesc.textContent = translations.no_results_desc;
        }
        
        const retryButton = document.querySelector('#retryTrendingButton');
        if (retryButton) {
            retryButton.textContent = translations.retry;
        }
    }
}

// 更新导航语言
function updateNavigationLanguage(translations) {
    const searchNavText = document.querySelector('#searchNavButton .nav-text');
    // 搜索页面
    const searchInput = document.getElementById('unifiedSearchInput');
    if (searchInput) searchInput.placeholder = translations.search_placeholder;
    
    const searchTip = document.querySelector('.search-tip');
    if (searchTip) searchTip.textContent = translations.search_tip;
    
    // 随机页面
    const randomTitle = document.querySelector('#randomPage .page-header h2');
    if (randomTitle) randomTitle.textContent = translations.random;
    
    const randomDesc = document.querySelector('#randomPage .page-description');
    if (randomDesc) randomDesc.textContent = translations.random_description;
    
    const loadingRandom = document.querySelector('#loadingRandom p');
    if (loadingRandom) loadingRandom.textContent = translations.loading_random;
    
    // 热门页面
    const trendingTitle = document.querySelector('#trendingPage .page-header h2');
    if (trendingTitle) trendingTitle.textContent = translations.trending;
    
    const trendingDesc = document.querySelector('#trendingPage .page-description');
    if (trendingDesc) trendingDesc.textContent = translations.trending_description;
    
    // 时间筛选按钮
    const timeButtons = document.querySelectorAll('.time-filter-btn');
    if (timeButtons.length) {
        timeButtons[0].textContent = translations.time_3d;
        timeButtons[1].textContent = translations.time_7d;
        timeButtons[2].textContent = translations.time_30d;
        timeButtons[3].textContent = translations.time_90d;
        timeButtons[4].textContent = translations.time_1y;
        timeButtons[5].textContent = translations.time_all;
    }
    
    const loadingTrending = document.querySelector('#loadingTrending p');
    if (loadingTrending) loadingTrending.textContent = translations.loading_trending;
    
    const loadMoreBtn = document.getElementById('loadMoreTrending');
    if (loadMoreBtn) loadMoreBtn.textContent = translations.load_more;
}

// 更新导航语言
function updateNavigationLanguage(translations) {
    const searchNavText = document.querySelector('#searchNavButton .nav-text');
    if (searchNavText) searchNavText.textContent = translations.search;
    
    const randomNavText = document.querySelector('#randomNavButton .nav-text');
    if (randomNavText) randomNavText.textContent = translations.random;
    
    const trendingNavText = document.querySelector('#trendingNavButton .nav-text');
    if (trendingNavText) trendingNavText.textContent = translations.trending;
}

// 更新下载管理器语言
function updateDownloadManagerLanguage(translations) {
    const downloadManagerTitle = document.querySelector('.download-header h2');
    if (downloadManagerTitle) downloadManagerTitle.textContent = translations.download_manager;
    
    const noDownloads = document.querySelector('.download-empty p');
    if (noDownloads) noDownloads.textContent = translations.no_downloads;
}

// 保存主题设置
function saveTheme(theme) {
    store.set('theme', theme);
    document.body.classList.toggle('dark-theme', theme === 'dark');
    
    // 触发主题变更事件，供其他组件响应
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
}

// 保存卡片显示设置
function saveCardDisplay(displayMode) {
    store.set('card_display', displayMode);
    resultsContainer.classList.toggle('list-view', displayMode === 'list');
}

// 保存徽章显示设置
function saveHideBadges(hide) {
    store.set('hide_badges', hide);
}

// 保存Token
function saveToken(token) {
    if (token) {
        if (token !== DEFAULT_TOKEN) {
            store.set('github_token', token);
            GITHUB_TOKEN = token;
            alert('GitHub Token已保存');
            // 更新axios默认设置
            axios.defaults.headers.common['Authorization'] = `token ${GITHUB_TOKEN}`;
        } else {
            alert('请不要使用默认Token');
        }
    }
}

// 初始化设置
function initSettings() {
    // 确保DOM元素已加载
    initDomElements();
    
    if (!settingsButton || !settingsPanel) {
        console.error('设置按钮或面板未找到');
        return;
    }
    
    // 初始化主题
    initTheme();
    
    // 初始化卡片显示设置
    initCardDisplay();
    
    // 初始化语言设置
    initLanguage();
    
    // 设置按钮点击事件
    settingsButton.addEventListener('click', () => {
        settingsPanel.style.display = 'block';
    });
    
    // 关闭按钮点击事件
    closeSettings.addEventListener('click', () => {
        settingsPanel.style.display = 'none';
    });
    
    // Token帮助链接点击事件
    const tokenHelpLink = document.getElementById('tokenHelpLink');
    if (tokenHelpLink) {
        tokenHelpLink.addEventListener('click', (e) => {
            e.preventDefault();
            shell.openExternal('https://docs.github.com/cn/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token');
        });
    }
    
    // 赞助链接点击事件
    const sponsorLink = document.getElementById('sponsorLink');
    if (sponsorLink) {
        sponsorLink.addEventListener('click', (e) => {
            e.preventDefault();
            shell.openExternal('https://afdian.com/a/xieshuoxing');
        });
    }
    
    // 主题切换事件
    themeOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            if (e.target.checked) {
                saveTheme(e.target.value);
            }
        });
    });
    
    // 卡片显示方式切换事件
    cardDisplayOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            if (e.target.checked) {
                saveCardDisplay(e.target.value);
            }
        });
    });
    
    // 徽章显示设置事件
    hideBadgesCheckbox.addEventListener('change', (e) => {
        saveHideBadges(e.target.checked);
    });
    
    // 保存Token按钮点击事件
    saveTokenButton.addEventListener('click', () => {
        saveToken(tokenInput.value.trim());
    });
    
    // 点击面板外关闭
    window.addEventListener('click', (e) => {
        // 检查点击的元素是否在设置面板之外
        // 如果设置面板正在显示，且点击的不是设置面板内的元素，也不是设置按钮
        if (settingsPanel.style.display === 'block' && 
            !settingsPanel.contains(e.target) && 
            e.target !== settingsButton &&
            !settingsButton.contains(e.target)) {
            settingsPanel.style.display = 'none';
        }
    });
    
    // 为Token输入框添加回车键事件
    tokenInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveToken(tokenInput.value.trim());
        }
    });
    
    // 为下载路径选择按钮添加回车键事件
    const selectDownloadPathButton = document.getElementById('selectDownloadPath');
    if (selectDownloadPathButton) {
        selectDownloadPathButton.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                selectDownloadPathButton.click();
            }
        });
    }
}

// 检查API响应状态
function checkApiResponse(response) {
    if (response.status === 403) {
        throw new Error('API访问受限，请稍后再试或检查Token是否有效');
    }
    if (response.status === 404) {
        throw new Error('未找到请求的资源');
    }
    return response;
}

// 添加token回退机制
function tryFallbackToken() {
    // 如果当前token是用户自定义token但已失效，尝试回退到内置token
    if (GITHUB_TOKEN !== PRIMARY_TOKEN && GITHUB_TOKEN !== SECONDARY_TOKEN && GITHUB_TOKEN !== TERTIARY_TOKEN) {
        console.log('用户自定义token可能已失效，尝试使用内置token');
        GITHUB_TOKEN = PRIMARY_TOKEN;
    }
    // 如果当前是优先内置token但已失效，尝试次优先级token
    else if (GITHUB_TOKEN === PRIMARY_TOKEN) {
        console.log('主要内置token可能已失效，尝试使用次要内置token');
        GITHUB_TOKEN = SECONDARY_TOKEN;
    }
    // 如果当前是次优先级token但已失效，尝试第三优先级token
    else if (GITHUB_TOKEN === SECONDARY_TOKEN) {
        console.log('次要内置token可能已失效，尝试使用备用内置token');
        GITHUB_TOKEN = TERTIARY_TOKEN;
    }
    // 如果所有token都已尝试，给出提示
    else {
        console.log('所有可用token均已尝试，API访问可能仍受限');
        return false;
    }

    // 更新axios默认token
    axios.defaults.headers.common['Authorization'] = `token ${GITHUB_TOKEN}`;
    return true;
}

// 切换搜索标签页
searchTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        searchTabs.forEach(t => t.classList.remove('active'));
        searchContents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}Tab`).classList.add('active');
    });
});

// 从URL中提取仓库信息
function extractRepoInfo(url) {
    try {
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
            return {
                owner: match[1],
                repo: match[2].replace(/\.git$/, '')
            };
        }
    } catch (error) {
        console.error('URL解析错误:', error);
    }
    return null;
}

// 从URL访问仓库
async function visitRepository(url) {
    // 检查访问限制
    if (!checkVisitLimits()) {
        return;
    }
    
    const repoInfo = extractRepoInfo(url);
    if (!repoInfo) {
        alert('无效的GitHub仓库URL');
        return;
    }

    try {
        const response = await axios.get(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        const repo = response.data;
        showRepositoryDetails(repo);
    } catch (error) {
        console.error('访问仓库失败:', error);
        
        // 检查是否是API限制或授权问题，尝试回退token
        if (error.response && (error.response.status === 403 || error.response.status === 401)) {
            if (tryFallbackToken()) {
                // 使用新token重试
                return visitRepository(url);
            }
        }
        
        alert('无法访问该仓库，请检查URL是否正确或仓库是否存在');
    }
}

// 搜索GitHub仓库
async function searchRepositories(query) {
    // 检查访问限制
    if (!checkVisitLimits()) {
        return [];
    }
    
    try {
        const response = await axios.get(`https://api.github.com/search/repositories`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            params: {
                q: query,
                sort: 'stars',
                order: 'desc'
            }
        });
        return response.data.items;
    } catch (error) {
        console.error('搜索出错:', error.message);
        
        // 检查是否是API限制或授权问题，尝试回退token
        if (error.response && (error.response.status === 403 || error.response.status === 401)) {
            if (tryFallbackToken()) {
                // 使用新token重试
                return searchRepositories(query);
            }
        }
        
        return [];
    }
}

// 获取仓库详情
async function getRepositoryDetails(owner, repo) {
    try {
        // 获取仓库基本信息
        let repoResponse;
        try {
            repoResponse = await axios.get(`/repos/${owner}/${repo}`, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`
                }
            }).then(checkApiResponse);
        } catch (error) {
            // 检查是否是API限制或授权问题，尝试回退token
            if (error.response && (error.response.status === 403 || error.response.status === 401)) {
                if (tryFallbackToken()) {
                    // 使用新token重试
                    return getRepositoryDetails(owner, repo);
                }
            }
            throw error;
        }
        
        // 获取Releases信息
        let releases = [];
        try {
            const releasesResponse = await axios.get(`/repos/${owner}/${repo}/releases`, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`
                },
                params: {
                    per_page: 10 // 限制每页数量，减少数据量
                }
            }).then(checkApiResponse);
            
            releases = releasesResponse.data;
            console.log(`获取到 ${releases.length} 个发布版本`);
        } catch (error) {
            console.error('获取Releases失败:', error.message);
            if (error.response) {
                console.error('API响应状态:', error.response.status);
                console.error('API响应数据:', error.response.data);
                
                // 检查是否是API限制或授权问题，尝试回退token
                if (error.response.status === 403 || error.response.status === 401) {
                    if (tryFallbackToken()) {
                        // 尝试单独获取releases，而不重新获取整个仓库详情
                        try {
                            const retryResponse = await axios.get(`/repos/${owner}/${repo}/releases`, {
                                headers: {
                                    'Authorization': `token ${GITHUB_TOKEN}`
                                },
                                params: {
                                    per_page: 10
                                }
                            }).then(checkApiResponse);
                            
                            releases = retryResponse.data;
                            console.log(`重试成功！获取到 ${releases.length} 个发布版本`);
                        } catch (retryError) {
                            console.error('重试获取Releases失败:', retryError.message);
                        }
                    }
                }
            }
        }

        // 获取README内容
        let readme = '';
        try {
            const readmeResponse = await axios.get(`/repos/${owner}/${repo}/readme`, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`
                }
            }).then(checkApiResponse);
            
            if (readmeResponse.data && readmeResponse.data.content) {
                readme = Buffer.from(readmeResponse.data.content, 'base64').toString();
            } else {
                readme = '暂无README内容';
            }
        } catch (error) {
            console.error('获取README失败:', error.message);
            readme = '暂无README内容';
            
            // 检查是否是API限制或授权问题，尝试回退token
            if (error.response && (error.response.status === 403 || error.response.status === 401)) {
                if (tryFallbackToken()) {
                    // 尝试单独获取README，而不重新获取整个仓库详情
                    try {
                        const retryResponse = await axios.get(`/repos/${owner}/${repo}/readme`, {
                            headers: {
                                'Authorization': `token ${GITHUB_TOKEN}`
                            }
                        }).then(checkApiResponse);
                        
                        if (retryResponse.data && retryResponse.data.content) {
                            readme = Buffer.from(retryResponse.data.content, 'base64').toString();
                            console.log('重试成功！成功获取README内容');
                        }
                    } catch (retryError) {
                        console.error('重试获取README失败:', retryError.message);
                    }
                }
            }
        }

        return {
            details: repoResponse.data,
            releases: releases,
            readme: readme
        };
    } catch (error) {
        console.error('获取仓库详情出错:', error.message);
        
        // 检查是否是API限制或授权问题，尝试回退token
        if (error.response && (error.response.status === 403 || error.response.status === 401)) {
            if (tryFallbackToken()) {
                // 重新尝试获取仓库详情
                return getRepositoryDetails(owner, repo);
            }
        }
        
        throw error;
    }
}

// 获取仓库文件列表
async function getRepositoryFiles(owner, repo, path = '') {
    try {
        console.log(`正在获取文件列表: ${owner}/${repo}/${path}`);
        const response = await axios.get(`/repos/${owner}/${repo}/contents/${path}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`
            }
        }).then(checkApiResponse);
        
        if (Array.isArray(response.data)) {
            console.log(`获取到 ${response.data.length} 个文件/目录`);
            return response.data;
        } else {
            console.error('API返回了非数组数据:', response.data);
            return [];
        }
    } catch (error) {
        console.error('获取文件列表失败:', error.message);
        if (error.response) {
            console.error('API响应状态:', error.response.status);
        }
        
        if (error.message.includes('API访问受限')) {
            throw error;
        }
        
        return [];
    }
}

// 获取文件内容
async function getFileContent(owner, repo, path) {
    try {
        console.log(`正在获取文件内容: ${owner}/${repo}/${path}`);
        const response = await axios.get(`/repos/${owner}/${repo}/contents/${path}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`
            }
        }).then(checkApiResponse);
        
        if (response.data && response.data.content) {
            return Buffer.from(response.data.content, 'base64').toString();
        } else {
            console.error('API返回的数据不包含content:', response.data);
            return '无法读取文件内容';
        }
    } catch (error) {
        console.error('获取文件内容失败:', error.message);
        
        if (error.response) {
            if (error.response.status === 403) {
                return '文件访问受限，请检查您的Token权限或稍后再试';
            } else if (error.response.status === 404) {
                return '找不到文件';
            } else {
                return `获取文件失败: ${error.message}`;
            }
        }
        
        return `获取文件失败: ${error.message}`;
    }
}

// 显示代码文件
async function showCodeFiles(owner, repo, path = '') {
    try {
        const files = await getRepositoryFiles(owner, repo, path);
        if (!files || files.length === 0) {
            return '<div class="error-message">无法获取文件列表或目录为空</div>';
        }
        
        let content = '<div class="file-explorer">';
        
        // 添加返回上级目录按钮（如果不是根目录）
        if (path) {
            const parentPath = path.split('/').slice(0, -1).join('/');
            content += `
                <div class="file-item" data-path="${parentPath}" data-type="dir">
                    <span class="file-icon">📁</span>
                    <span class="file-name">..</span>
                </div>
            `;
        }

        // 先显示目录，再显示文件
        const directories = files.filter(file => file.type === 'dir');
        const fileItems = files.filter(file => file.type !== 'dir');
        
        // 显示目录
        for (const dir of directories) {
            content += `
                <div class="file-item" data-path="${dir.path}" data-type="dir">
                    <span class="file-icon">📁</span>
                    <span class="file-name">${dir.name}</span>
                </div>
            `;
        }
        
        // 显示文件
        for (const file of fileItems) {
            // 跳过大文件和二进制文件
            if (file.size > 1000000) { // 大于1MB的文件
                content += `
                    <div class="file-item file-large" data-path="${file.path}" data-type="large">
                        <span class="file-icon">📄</span>
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">(${(file.size / 1024 / 1024).toFixed(2)} MB - 文件过大)</span>
                    </div>
                `;
            } else {
                content += `
                    <div class="file-item" data-path="${file.path}" data-type="file">
                        <span class="file-icon">📄</span>
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">(${(file.size / 1024).toFixed(2)} KB)</span>
                    </div>
                `;
            }
        }
        
        content += '</div>';
        
        // 添加文件内容显示区域
        content += '<div class="file-content"></div>';
        
        return content;
    } catch (error) {
        return `<div class="error-message">加载文件列表失败: ${error.message}</div>`;
    }
}

// 显示仓库卡片
function displayRepositories(repositories) {
    resultsContainer.innerHTML = '';
    
    // 获取当前卡片显示方式
    const cardDisplay = store.get('card_display');
    const hideBadges = store.get('hide_badges');
    
    // 设置结果容器的类名
    resultsContainer.classList.toggle('list-view', cardDisplay === 'list');
    
    repositories.forEach(repo => {
        const card = document.createElement('div');
        card.className = 'repo-card';
        
        // 检查是否有主题徽章，如果hideBadges为true则隐藏
        let badgeHtml = '';
        if (!hideBadges) {
            badgeHtml = `<img class="repo-badge" src="https://img.shields.io/github/stars/${repo.full_name}" alt="Stars" onerror="this.style.display='none'">`;
        }
        
        // 获取仓库所属用户/组织的头像作为图标
        const avatarUrl = repo.owner.avatar_url;
        
        // 根据卡片显示方式应用不同的HTML结构
        if (cardDisplay === 'list') {
            card.innerHTML = `
                <div class="repo-avatar">
                    <img src="${avatarUrl}" alt="${repo.owner.login}" onerror="this.src='./assets/default-avatar.png'">
                </div>
                <div class="repo-info">
                    <div class="repo-name">${repo.full_name}</div>
                    <div class="repo-description">${repo.description || '无描述'}</div>
                </div>
                <div class="repo-stats">
                    <span>⭐ ${repo.stargazers_count}</span>
                    <span>👁️ ${repo.watchers_count}</span>
                    <span>🍴 ${repo.forks_count}</span>
                    ${badgeHtml}
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="repo-header">
                    <div class="repo-avatar">
                        <img src="${avatarUrl}" alt="${repo.owner.login}" onerror="this.src='./assets/default-avatar.png'">
                    </div>
                    <div class="repo-name">${repo.full_name}</div>
                </div>
                <div class="repo-description">${repo.description || '无描述'}</div>
                <div class="repo-stats">
                    <span>⭐ ${repo.stargazers_count}</span>
                    <span>👁️ ${repo.watchers_count}</span>
                    <span>🍴 ${repo.forks_count}</span>
                    ${badgeHtml}
                </div>
            `;
        }
        
        card.addEventListener('click', () => showRepositoryDetails(repo));
        resultsContainer.appendChild(card);
    });
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 显示仓库详情
async function showRepositoryDetails(repo) {
    try {
        modalContent.innerHTML = '<div class="loading">正在加载仓库详情...</div>';
        const details = await getRepositoryDetails(repo.owner.login, repo.name);
        
        modalContent.innerHTML = `
            <div class="repo-header-detail">
                <div class="repo-avatar-large">
                    <img src="${repo.owner.avatar_url}" alt="${repo.owner.login}" onerror="this.src='./assets/default-avatar.png'">
                </div>
                <h2>${repo.full_name}</h2>
            </div>
            <div class="tab-container">
                <div class="tab-buttons">
                    <button class="tab-button active" data-tab="readme">README</button>
                    <button class="tab-button" data-tab="releases">Releases</button>
                    <button class="tab-button" data-tab="code">代码</button>
                </div>
                <div class="tab-content active" id="readme">
                    ${marked(details.readme)}
                </div>
                <div class="tab-content" id="releases">
                    ${details.releases && details.releases.length > 0 ? 
                        details.releases.map(release => `
                            <div class="release-item">
                                <div class="release-header">
                                    <h3>${release.name || release.tag_name}</h3>
                                    <span class="release-date">${formatDate(release.published_at)}</span>
                                </div>
                                <div class="release-body">
                                    ${marked(release.body || '无描述')}
                                </div>
                                <div class="release-assets">
                                    ${release.assets && release.assets.length > 0 ? 
                                        release.assets.map(asset => `
                                            <div class="asset-item">
                                                <span class="asset-name">${asset.name}</span>
                                                <span class="asset-size">${(asset.size / 1024 / 1024).toFixed(2)} MB</span>
                                                <span class="asset-downloads">下载次数: ${asset.download_count}</span>
                                                <button class="asset-download-button" data-url="${asset.browser_download_url}">
                                                    下载
                                                </button>
                                            </div>
                                        `).join('') : 
                                        '<p class="no-assets">此版本没有可下载的资源</p>'
                                    }
                                </div>
                            </div>
                        `).join('') : 
                        `<div class="no-releases">
                            <p>暂无发布版本</p>
                            <p class="token-tip">如果您确认此项目应该有发布版本，可能是由于API访问限制。尝试在设置中添加您自己的GitHub Token以获取更多数据。</p>
                         </div>`
                    }
                </div>
                <div class="tab-content" id="code">
                    <div class="code-container">
                        <div class="loading">加载中...</div>
                    </div>
                </div>
            </div>
        `;

        // 添加标签切换功能
        const tabButtons = modalContent.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', async () => {
                try {
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    
                    const tabContents = modalContent.querySelectorAll('.tab-content');
                    tabContents.forEach(content => content.classList.remove('active'));
                    const activeTab = modalContent.querySelector(`#${button.dataset.tab}`);
                    activeTab.classList.add('active');

                    // 如果切换到代码标签页，加载文件列表
                    if (button.dataset.tab === 'code') {
                        const codeContainer = activeTab.querySelector('.code-container');
                        try {
                            codeContainer.innerHTML = '<div class="loading">正在加载文件列表...</div>';
                            codeContainer.innerHTML = await showCodeFiles(repo.owner.login, repo.name);
                            
                            // 添加文件点击事件
                            addFileClickEvents(codeContainer, repo);
                        } catch (error) {
                            codeContainer.innerHTML = `<div class="error-message">加载文件列表失败: ${error.message}</div>`;
                        }
                    }
                } catch (error) {
                    console.error('切换标签页错误:', error);
                    const activeTab = modalContent.querySelector(`#${button.dataset.tab}`);
                    activeTab.innerHTML = `<div class="error-message">${error.message}</div>`;
                }
            });
        });

        // 添加下载按钮事件监听
        const downloadButtons = modalContent.querySelectorAll('.asset-download-button');
        downloadButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const url = button.dataset.url;
                const filename = url.split('/').pop();
                
                // 开始下载
                downloadManager.startDownload({
                    url,
                    filename
                });
            });
        });

        modal.style.display = 'block';
    } catch (error) {
        console.error('显示仓库详情错误:', error);
        
        let errorMessage = error.message;
        let retryButton = '';
        
        if (error.response && error.response.status === 403) {
            errorMessage = 'API访问受限。GitHub API有访问次数限制，您可能已达到限制或需要更高权限的Token。';
            retryButton = `<button id="openSettings" class="retry-button">设置Token</button>`;
        } else {
            retryButton = `<button id="retryButton" class="retry-button">重试</button>`;
        }
        
        modalContent.innerHTML = `
            <div class="error-message">
                <h3>加载失败</h3>
                <p>${errorMessage}</p>
                <div class="error-actions">
                    ${retryButton}
                    <button id="closeErrorButton" class="close-button">关闭</button>
                </div>
            </div>
        `;
        
        // 添加重试按钮事件
        const retryBtn = modalContent.querySelector('#retryButton');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                showRepositoryDetails(repo);
            });
        }
        
        // 添加设置按钮事件
        const openSettingsBtn = modalContent.querySelector('#openSettings');
        if (openSettingsBtn) {
            openSettingsBtn.addEventListener('click', () => {
                settingsPanel.style.display = 'block';
                modal.style.display = 'none';
            });
        }
        
        // 添加关闭按钮事件
        const closeErrorBtn = modalContent.querySelector('#closeErrorButton');
        if (closeErrorBtn) {
            closeErrorBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        modal.style.display = 'block';
    }
}

// 添加文件点击事件
function addFileClickEvents(container, repo) {
    const fileItems = container.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        item.addEventListener('click', async () => {
            try {
                const path = item.dataset.path;
                const type = item.dataset.type;
                
                if (type === 'dir') {
                    container.innerHTML = '<div class="loading">正在加载文件列表...</div>';
                    container.innerHTML = await showCodeFiles(repo.owner.login, repo.name, path);
                    addFileClickEvents(container, repo);
                } else if (type === 'large') {
                    alert('文件过大，无法直接查看。请前往GitHub下载查看。');
                } else {
                    container.innerHTML = '<div class="loading">正在加载文件内容...</div>';
                    const content = await getFileContent(repo.owner.login, repo.name, path);
                    if (content) {
                        container.innerHTML = `
                            <div class="file-header">
                                <button class="back-button">返回</button>
                                <span class="file-path">${path}</span>
                            </div>
                            <pre class="file-content"><code>${content}</code></pre>
                        `;
                        
                        // 添加返回按钮事件
                        const backButton = container.querySelector('.back-button');
                        backButton.addEventListener('click', async () => {
                            const parentPath = path.split('/').slice(0, -1).join('/');
                            container.innerHTML = '<div class="loading">正在加载文件列表...</div>';
                            container.innerHTML = await showCodeFiles(repo.owner.login, repo.name, parentPath);
                            addFileClickEvents(container, repo);
                        });
                    } else {
                        container.innerHTML = `<div class="error-message">无法加载文件内容</div>`;
                    }
                }
            } catch (error) {
                container.innerHTML = `<div class="error-message">${error.message}</div>`;
            }
        });
    });
}

// 检查字符串是否为URL
function isURL(str) {
    const pattern = /^(https?:\/\/)?(www\.)?(github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9_.-]+).*$/i;
    return pattern.test(str);
}

// 处理统一搜索
async function handleUnifiedSearch() {
    const query = searchInput.value.trim();
    
    if (!query) return;
    
    // 移除搜索区域的居中效果
    const searchSection = document.getElementById('search-section');
    searchSection.classList.remove('centered');
    
    // 显示加载中状态
    resultsContainer.innerHTML = '<div class="loading">处理中...</div>';
    
    // 更改搜索按钮表情
    const searchButton = document.getElementById('unifiedSearchButton');
    const emojiElement = searchButton.querySelector('.emoji-face');
    searchButton.classList.add('searching');
    emojiElement.textContent = 'UwU';
    
    try {
        // 判断输入内容是URL还是搜索关键词
        if (isURL(query)) {
            // 处理URL访问
            await visitRepository(query);
        } else {
            // 处理搜索
            const repositories = await searchRepositories(query);
            displayRepositories(repositories);
        }
    } finally {
        // 恢复搜索按钮表情
        setTimeout(() => {
            searchButton.classList.remove('searching');
            emojiElement.textContent = 'U_U';
        }, 500);
    }
    
    // 显示结果区域
    resultsContainer.classList.add('show');
}

// 事件监听器
searchButton.addEventListener('click', handleUnifiedSearch);

// 为搜索输入框添加回车键事件
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleUnifiedSearch();
    }
});

// 为整个文档添加回车键监听
document.addEventListener('keypress', (e) => {
    // 如果当前焦点不在输入框上
    const activeElement = document.activeElement;
    if (activeElement !== searchInput && 
        activeElement.tagName.toLowerCase() !== 'input' &&
        activeElement.tagName.toLowerCase() !== 'textarea') {
        
        // 按回车键触发搜索
        if (e.key === 'Enter') {
            searchButton.click();
        }
    }
});

// 重置搜索UI
function resetSearchUI() {
    const searchSection = document.getElementById('search-section');
    
    // 如果结果区域为空，恢复居中效果
    if (resultsContainer.children.length === 0 || 
        (resultsContainer.children.length === 1 && resultsContainer.children[0].className === 'loading')) {
        searchSection.classList.add('centered');
        resultsContainer.classList.remove('show');
    }
}

// 清空搜索按钮
document.addEventListener('DOMContentLoaded', () => {
    // 添加清空搜索按钮
    if (searchInput) {
        searchInput.addEventListener('input', checkInputState);
    }
    
    // 初始检查搜索状态
    setTimeout(() => {
        resetSearchUI();
    }, 200);
});

// 检查输入状态
function checkInputState() {
    // 如果输入框为空且结果区域为空，恢复居中效果
    if ((!searchInput.value || searchInput.value.trim() === '') && 
        (resultsContainer.children.length === 0 || 
        (resultsContainer.children.length === 1 && resultsContainer.children[0].className === 'loading'))) {
        resetSearchUI();
    }
}

closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// 检查GitHub Token是否有效
async function checkGitHubToken() {
    console.log('正在检查GitHub Token有效性...');
    
    try {
        const response = await axios.get('/rate_limit', {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.status === 200) {
            const limits = response.data.rate;
            console.log(`GitHub API限制: ${limits.remaining}/${limits.limit} 次请求`);
            
            // 如果剩余请求次数太少，提醒用户
            if (limits.remaining < 10) {
                alert(`您的GitHub API请求次数即将用尽 (剩余 ${limits.remaining} 次)。请设置您自己的GitHub Token或稍后再试。`);
            }
            
            return true;
        }
    } catch (error) {
        console.error('检查GitHub Token失败:', error);
        if (error.response && error.response.status === 401) {
            // Token无效，尝试回退到其他token
            if (tryFallbackToken()) {
                // 使用新的token重新检查
                return checkGitHubToken();
            } else {
                // 所有token都已尝试且失败
                alert('所有可用的GitHub Token均无效或已过期。请在设置中更新您的Token。');
                return false;
            }
        }
    }
    
    return false;
}

// 获取热门项目数据
async function getTrendingProjects(time = '3d', page = 1, language = 'all') {
    // 检查访问限制
    if (!checkVisitLimits()) {
        throw new Error('已达到今日访问限制');
    }
    
    // 获取当前星级筛选设置
    const stars = trendingProjects.currentStars;
    
    const cacheKey = `${time}-${language}-${stars}-${page}`;
    const cachedData = trendingProjects.data.get(cacheKey);
    
    // 如果有缓存，使用缓存数据
    if (cachedData) {
        console.log(`使用缓存的热门项目数据: ${time}-${language}-${stars}-${page}`);
        return cachedData;
    }
    
    try {
        console.log(`正在获取热门项目: ${time} 时间段, ${language !== 'all' ? language + ' 语言, ' : ''} ${stars > 0 ? stars + '+ 星级, ' : ''} 第 ${page} 页`);
        
        // 构建查询参数
        let dateQuery = '';
        const today = new Date();
        
        switch (time) {
            case '3d':
                dateQuery = `created:>${getDateString(today, 3)}`;
                break;
            case '7d':
                dateQuery = `created:>${getDateString(today, 7)}`;
                break;
            case '30d':
                dateQuery = `created:>${getDateString(today, 30)}`;
                break;
            case '90d':
                dateQuery = `created:>${getDateString(today, 90)}`;
                break;
            case '1y':
                dateQuery = `created:>${getDateString(today, 365)}`;
                break;
            case 'all':
                dateQuery = '';
                break;
        }
        
        // 添加语言筛选
        let languageQuery = '';
        if (language !== 'all') {
            // 特殊处理C++和C#，因为它们的名称在URL中需要特殊处理
            if (language === 'c++') {
                languageQuery = 'language:c\\+\\+';
            } else if (language === 'csharp') {
                languageQuery = 'language:c\\#';
            } else {
                languageQuery = `language:${language}`;
            }
        }
        
        // 根据星级筛选设置构建查询
        let starsQuery = '';
        if (stars && parseInt(stars) > 0) {
            starsQuery = `stars:>=${stars}`;
        } else {
            // 默认获取100+星级的项目，除非特别指定不需要星级筛选
            if (time === 'all' && language === 'all' && !stars) {
                starsQuery = 'stars:>10000'; // 全部分类时默认显示星级较高的项目
            } else if (stars === '0') {
                starsQuery = ''; // 特别指定了0星级，不添加星级筛选
            } else {
                starsQuery = 'stars:>100'; // 其他情况默认显示100+星级
            }
        }
        
        // 构建完整查询
        let query = '';
        if (starsQuery) query = starsQuery;
        if (dateQuery) query += (query ? ' ' : '') + dateQuery;
        if (languageQuery) query += (query ? ' ' : '') + languageQuery;
        
        // 确保查询不为空
        if (!query) {
            query = 'stars:>0'; // 至少有一个条件
        }
        
        // 请求GitHub API
        console.log(`请求API: 查询=${query}, 页码=${page}, 每页数量=12`);
        try {
            const response = await axios.get(`/search/repositories`, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                },
                params: {
                    q: query,
                    sort: 'stars',
                    order: 'desc',
                    per_page: 12,
                    page: page
                }
            });
            
            console.log(`API响应状态: ${response.status}`);
            
            if (response.data.items && response.data.items.length > 0) {
                console.log(`获取到 ${response.data.items.length} 个热门项目, 总数: ${response.data.total_count}`);
                
                // 缓存数据
                trendingProjects.data.set(cacheKey, response.data.items);
                
                // 检查是否还有更多数据
                trendingProjects.hasMore = response.data.items.length >= 12 && 
                                        response.data.total_count > page * 12;
                
                return response.data.items;
            } else {
                console.warn(`未获取到热门项目数据，响应:`, response.data);
                trendingProjects.hasMore = false;
                return [];
            }
        } catch (error) {
            console.error('获取热门项目请求失败:', error);
            // 检查是否是API限制或授权问题，尝试回退token
            if (error.response && (error.response.status === 403 || error.response.status === 401)) {
                if (tryFallbackToken()) {
                    // 使用新token重试
                    console.log('使用新token重试获取热门项目...');
                    return getTrendingProjects(time, page, language);
                }
            }
            throw error;
        }
    } catch (error) {
        console.error('获取热门项目失败:', error);
        if (error.response) {
            console.error('API错误状态:', error.response.status);
            console.error('API错误数据:', error.response.data);
            
            // 检查是否是API限制或授权问题，尝试回退token
            if (error.response.status === 403 || error.response.status === 401) {
                if (tryFallbackToken()) {
                    // 重新尝试获取热门项目
                    return getTrendingProjects(time, page, language);
                }
            }
        }
        throw error;
    }
}

// 渲染热门项目卡片
function renderTrendingProjects(projects, container) {
    const cardDisplay = store.get('card_display');
    const hideBadges = store.get('hide_badges');
    
    console.log(`开始渲染 ${projects.length} 个热门项目卡片`);
    
    // 设置容器类名
    container.classList.toggle('list-view', cardDisplay === 'list');
    container.classList.add('show');
    
    // 如果容器不可见，先确保它可见
    if (container.style.display === 'none') {
        container.style.display = 'grid';
    }
    
    // 添加项目卡片
    projects.forEach(repo => {
        const card = document.createElement('div');
        card.className = 'repo-card';
        
        // 检查是否有主题徽章，如果hideBadges为true则隐藏
        let badgeHtml = '';
        if (!hideBadges) {
            badgeHtml = `<img class="repo-badge" src="https://img.shields.io/github/stars/${repo.full_name}" alt="Stars" onerror="this.style.display='none'">`;
        }
        
        // 获取仓库所属用户/组织的头像作为图标
        const avatarUrl = repo.owner.avatar_url;
        
        // 根据卡片显示方式应用不同的HTML结构
        if (cardDisplay === 'list') {
            card.innerHTML = `
                <div class="repo-avatar">
                    <img src="${avatarUrl}" alt="${repo.owner.login}" onerror="this.src='./assets/default-avatar.png'">
                </div>
                <div class="repo-info">
                    <div class="repo-name" data-url="https://github.com/${repo.full_name}">${repo.full_name}</div>
                    <div class="repo-description">${repo.description || '无描述'}</div>
                </div>
                <div class="repo-stats">
                    <span>⭐ ${repo.stargazers_count}</span>
                    <span>👁️ ${repo.watchers_count}</span>
                    <span>🍴 ${repo.forks_count}</span>
                    ${badgeHtml}
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="repo-header">
                    <div class="repo-avatar">
                        <img src="${avatarUrl}" alt="${repo.owner.login}" onerror="this.src='./assets/default-avatar.png'">
                    </div>
                    <div class="repo-name">${repo.full_name}</div>
                </div>
                <div class="repo-description">${repo.description || '无描述'}</div>
                <div class="repo-stats">
                    <span>⭐ ${repo.stargazers_count}</span>
                    <span>👁️ ${repo.watchers_count}</span>
                    <span>🍴 ${repo.forks_count}</span>
                    ${badgeHtml}
                </div>
            `;
        }
        
        card.addEventListener('click', () => showRepositoryDetails(repo));
        container.appendChild(card);
    });
    
    console.log(`热门项目卡片渲染完成，现在有 ${container.children.length} 个卡片`);
}

// 加载更多热门项目
function loadMoreTrendingProjects() {
    if (!trendingProjects.hasMore) {
        console.log('没有更多热门项目可加载');
        return;
    }
    
    // 增加页码
    trendingProjects.page++;
    console.log(`加载更多热门项目，页码增加到 ${trendingProjects.page}`);
    
    // 加载下一页数据
    showTrendingProjects(false);
}

// 辅助函数 - 获取日期字符串（n天前）
function getDateString(date, daysAgo) {
    const pastDate = new Date(date);
    pastDate.setDate(pastDate.getDate() - daysAgo);
    return pastDate.toISOString().split('T')[0];
}

// 显示热门项目
async function showTrendingProjects(reset = false) {
    const trendingResultsContainer = document.getElementById('trendingResults');
    const loadingElement = document.getElementById('loadingTrending');
    const loadMoreButton = document.getElementById('loadMoreTrending');
    const trendingPage = document.getElementById('trendingPage');
    
    console.log('开始显示热门项目页面...');
    
    // 确保页面和容器可见
    trendingPage.style.display = 'block';
    trendingPage.classList.add('active');
    
    // 如果是重置，清空容器
    if (reset) {
        trendingResultsContainer.innerHTML = '';
        trendingProjects.page = 1;
    }
    
    // 显示加载中，隐藏结果容器
    trendingResultsContainer.style.display = 'none';
    loadingElement.style.display = 'flex';
    loadMoreButton.style.display = 'none';
    
    console.log(`开始加载热门项目... 时间: ${trendingProjects.currentTime}, 语言: ${trendingProjects.currentLanguage}, 星级: ${trendingProjects.currentStars}+, 页码: ${trendingProjects.page}`);
    
    try {
        // 清空缓存强制重新获取数据
        if (reset) {
            const cacheKey = `${trendingProjects.currentTime}-${trendingProjects.currentLanguage}-${trendingProjects.currentStars}-${trendingProjects.page}`;
            trendingProjects.data.delete(cacheKey);
        }
        
        const projects = await getTrendingProjects(trendingProjects.currentTime, trendingProjects.page, trendingProjects.currentLanguage);
        console.log(`获取到 ${projects?.length || 0} 个热门项目`);
        
        if (projects && projects.length > 0) {
            // 直接设置innerHTML而不是appendChild
            let html = '';
            
            // 获取当前卡片显示方式和徽章设置
            const cardDisplay = store.get('card_display');
            const hideBadges = store.get('hide_badges');
            
            // 设置容器类名
            trendingResultsContainer.classList.toggle('list-view', cardDisplay === 'list');
            trendingResultsContainer.classList.add('show');
            
            // 生成所有卡片的HTML
            projects.forEach(repo => {
                // 检查是否有主题徽章，如果hideBadges为true则隐藏
                let badgeHtml = '';
                if (!hideBadges) {
                    badgeHtml = `<img class="repo-badge" src="https://img.shields.io/github/stars/${repo.full_name}" alt="Stars" onerror="this.style.display='none'">`;
                }
                
                // 获取仓库所属用户/组织的头像作为图标
                const avatarUrl = repo.owner.avatar_url;
                
                // 根据卡片显示方式应用不同的HTML结构
                if (cardDisplay === 'list') {
                    html += `
                        <div class="repo-card" data-repo-id="${repo.id}">
                            <div class="repo-avatar">
                                <img src="${avatarUrl}" alt="${repo.owner.login}" onerror="this.src='./assets/default-avatar.png'">
                            </div>
                            <div class="repo-info">
                                <div class="repo-name" data-url="https://github.com/${repo.full_name}">${repo.full_name}</div>
                                <div class="repo-description">${repo.description || '无描述'}</div>
                            </div>
                            <div class="repo-stats">
                                <span>⭐ ${repo.stargazers_count}</span>
                                <span>👁️ ${repo.watchers_count}</span>
                                <span>🍴 ${repo.forks_count}</span>
                                ${badgeHtml}
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="repo-card" data-repo-id="${repo.id}">
                            <div class="repo-header">
                                <div class="repo-avatar">
                                    <img src="${avatarUrl}" alt="${repo.owner.login}" onerror="this.src='./assets/default-avatar.png'">
                                </div>
                                <div class="repo-name" data-url="https://github.com/${repo.full_name}">${repo.full_name}</div>
                            </div>
                            <div class="repo-description">${repo.description || '无描述'}</div>
                            <div class="repo-stats">
                                <span>⭐ ${repo.stargazers_count}</span>
                                <span>👁️ ${repo.watchers_count}</span>
                                <span>🍴 ${repo.forks_count}</span>
                                ${badgeHtml}
                            </div>
                        </div>
                    `;
                }
            });
            
            // 一次性设置HTML，避免多次DOM操作
            trendingResultsContainer.innerHTML = html;
            
            // 为卡片添加点击事件
            setTimeout(() => {
                const cards = trendingResultsContainer.querySelectorAll('.repo-card');
                cards.forEach((card, index) => {
                    card.addEventListener('click', () => {
                        showRepositoryDetails(projects[index]);
                    });
                    
                    // 添加项目名称点击事件
                    const repoNameElement = card.querySelector('.repo-name');
                    if (repoNameElement) {
                        repoNameElement.addEventListener('click', (e) => {
                            e.stopPropagation(); // 阻止事件冒泡，不触发卡片点击事件
                            const url = repoNameElement.getAttribute('data-url');
                            if (url) {
                                shell.openExternal(url);
                            }
                        });
                    }
                });
                
                console.log(`热门项目卡片渲染完成，添加了 ${cards.length} 个卡片的点击事件`);
            }, 0);
            
            // 更新加载更多按钮状态
            loadMoreButton.style.display = trendingProjects.hasMore ? 'block' : 'none';
        } else {
            // 如果是重置且没有数据，显示无数据提示
            if (reset || trendingResultsContainer.children.length === 0) {
                trendingResultsContainer.innerHTML = `
                    <div class="error-message">
                        <h3>未找到项目</h3>
                        <p>该时间段内没有符合条件的热门项目</p>
                    </div>
                `;
            }
            
            // 隐藏加载更多按钮
            loadMoreButton.style.display = 'none';
        }
    } catch (error) {
        console.error('显示热门项目出错:', error);
        
        // 如果是重置或容器为空，显示错误信息
        if (reset || trendingResultsContainer.children.length === 0) {
            trendingResultsContainer.innerHTML = `
                <div class="error-message">
                    <h3>获取项目失败</h3>
                    <p>${error.message || '未知错误'}</p>
                    <button id="retryTrendingButton" class="retry-button">重试</button>
                </div>
            `;
            
            // 添加重试按钮点击事件
            document.getElementById('retryTrendingButton')?.addEventListener('click', () => {
                showTrendingProjects(true);
            });
        }
    } finally {
        // 无论成功或失败，都隐藏加载中显示结果容器
        loadingElement.style.display = 'none';
        trendingResultsContainer.style.display = 'grid';
    }
}

// 自定义背景功能
function initBackgroundSettings() {
    // 创建背景容器元素
    const appBackground = document.createElement('div');
    appBackground.className = 'app-background';
    document.body.appendChild(appBackground);

    // 获取所有相关元素
    const backgroundTypeInputs = document.querySelectorAll('input[name="background-type"]');
    const backgroundColorInput = document.getElementById('backgroundColorInput');
    const colorValue = document.querySelector('.color-value');
    const backgroundColorInputDiv = document.querySelector('.background-color-input');
    const backgroundLocalInputDiv = document.querySelector('.background-local-input');
    const backgroundUrlInputDiv = document.querySelector('.background-url-input');
    const selectBackgroundImage = document.getElementById('selectBackgroundImage');
    const localImagePreview = document.getElementById('localImagePreview');
    const selectedImagePreview = document.querySelector('.selected-image-preview');
    const backgroundUrlInput = document.getElementById('backgroundUrlInput');
    const applyBackgroundUrl = document.getElementById('applyBackgroundUrl');
    const urlImagePreview = document.getElementById('urlImagePreview');
    const urlImagePreviewDiv = document.querySelector('.url-image-preview');
    const backgroundOpacity = document.getElementById('backgroundOpacity');
    const opacityValue = document.getElementById('opacityValue');
    const backgroundBlur = document.getElementById('backgroundBlur');
    const blurValue = document.getElementById('blurValue');

    // 初始化设置
    let currentSettings = loadBackgroundSettings();
    applyBackgroundSettings(currentSettings);
    updateUIFromSettings(currentSettings);

    // 背景类型选择
    backgroundTypeInputs.forEach(input => {
        input.addEventListener('change', () => {
            backgroundColorInputDiv.style.display = 'none';
            backgroundLocalInputDiv.style.display = 'none';
            backgroundUrlInputDiv.style.display = 'none';
            
            const type = input.value;
            if (type === 'color') {
                backgroundColorInputDiv.style.display = 'flex';
            } else if (type === 'local') {
                backgroundLocalInputDiv.style.display = 'block';
            } else if (type === 'url') {
                backgroundUrlInputDiv.style.display = 'flex';
            }
            
            currentSettings.type = type;
            saveBackgroundSettings(currentSettings);
            applyBackgroundSettings(currentSettings);
        });
    });

    // 颜色选择器
    backgroundColorInput.addEventListener('input', () => {
        const color = backgroundColorInput.value;
        colorValue.textContent = color;
        currentSettings.color = color;
        saveBackgroundSettings(currentSettings);
        applyBackgroundSettings(currentSettings);
    });

    // 本地图片选择
    selectBackgroundImage.addEventListener('click', async () => {
        try {
            const result = await ipcRenderer.invoke('select-file', {
                title: '选择背景图片',
                filters: [
                    { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
                ]
            });
            
            if (!result.canceled && result.filePaths.length > 0) {
                const imagePath = result.filePaths[0];
                // 转换为data URL以便预览和存储
                const imageDataUrl = await fileToDataUrl(imagePath);
                
                if (imageDataUrl) {
                    localImagePreview.src = imageDataUrl;
                    selectedImagePreview.style.display = 'block';
                    
                    currentSettings.localImage = imageDataUrl;
                    saveBackgroundSettings(currentSettings);
                    applyBackgroundSettings(currentSettings);
                }
            }
        } catch (error) {
            console.error('选择背景图片出错:', error);
        }
    });

    // URL图片
    applyBackgroundUrl.addEventListener('click', () => {
        const url = backgroundUrlInput.value.trim();
        if (url) {
            urlImagePreview.src = url;
            urlImagePreviewDiv.style.display = 'block';
            
            currentSettings.urlImage = url;
            saveBackgroundSettings(currentSettings);
            applyBackgroundSettings(currentSettings);
        }
    });

    // 透明度调整
    backgroundOpacity.addEventListener('input', () => {
        const opacity = backgroundOpacity.value;
        opacityValue.textContent = `${opacity}%`;
        currentSettings.opacity = opacity;
        saveBackgroundSettings(currentSettings);
        applyBackgroundSettings(currentSettings);
    });

    // 模糊度调整
    backgroundBlur.addEventListener('input', () => {
        const blur = backgroundBlur.value;
        blurValue.textContent = `${blur}px`;
        currentSettings.blur = blur;
        saveBackgroundSettings(currentSettings);
        applyBackgroundSettings(currentSettings);
    });

    // 辅助函数：将文件转换为Data URL
    async function fileToDataUrl(filePath) {
        try {
            const fileData = await ipcRenderer.invoke('read-file', filePath);
            const fileExt = filePath.split('.').pop().toLowerCase();
            let mimeType = 'image/jpeg';
            
            if (fileExt === 'png') mimeType = 'image/png';
            else if (fileExt === 'gif') mimeType = 'image/gif';
            else if (fileExt === 'webp') mimeType = 'image/webp';
            
            // 将Buffer转换为Base64
            let binary = '';
            const bytes = new Uint8Array(fileData);
            const len = bytes.byteLength;
            
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            
            const base64Data = window.btoa(binary);
            return `data:${mimeType};base64,${base64Data}`;
        } catch (error) {
            console.error('读取文件失败:', error);
            return null;
        }
    }
}

// 加载背景设置
function loadBackgroundSettings() {
    const defaultSettings = {
        type: 'none',
        color: '#f5f5f5',
        localImage: '',
        urlImage: '',
        opacity: 30,
        blur: 5
    };
    
    try {
        const savedSettings = localStorage.getItem('backgroundSettings');
        return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    } catch (error) {
        console.error('加载背景设置失败:', error);
        return defaultSettings;
    }
}

// 保存背景设置
function saveBackgroundSettings(settings) {
    try {
        localStorage.setItem('backgroundSettings', JSON.stringify(settings));
    } catch (error) {
        console.error('保存背景设置失败:', error);
    }
}

// 应用背景设置
function applyBackgroundSettings(settings) {
    const appBackground = document.querySelector('.app-background');
    if (!appBackground) return;
    
    // 重置背景样式
    appBackground.style.backgroundColor = '';
    appBackground.style.backgroundImage = '';
    appBackground.style.opacity = '';
    appBackground.style.filter = '';
    
    // 设置不透明度和模糊度
    const opacity = settings.opacity / 100;
    const blur = settings.blur > 0 ? `blur(${settings.blur}px)` : '';
    
    appBackground.style.opacity = opacity;
    if (blur) {
        appBackground.style.filter = blur;
    }
    
    // 根据类型应用背景
    if (settings.type === 'color' && settings.color) {
        appBackground.style.backgroundColor = settings.color;
    } else if (settings.type === 'local' && settings.localImage) {
        appBackground.style.backgroundImage = `url('${settings.localImage}')`;
    } else if (settings.type === 'url' && settings.urlImage) {
        appBackground.style.backgroundImage = `url('${settings.urlImage}')`;
    }
}

// 根据设置更新UI
function updateUIFromSettings(settings) {
    // 选择正确的背景类型
    const typeInput = document.querySelector(`input[name="background-type"][value="${settings.type}"]`);
    if (typeInput) {
        typeInput.checked = true;
    }
    
    // 更新颜色选择器
    const backgroundColorInput = document.getElementById('backgroundColorInput');
    const colorValue = document.querySelector('.color-value');
    if (backgroundColorInput && colorValue && settings.color) {
        backgroundColorInput.value = settings.color;
        colorValue.textContent = settings.color;
    }
    
    // 更新本地图片预览
    const localImagePreview = document.getElementById('localImagePreview');
    const selectedImagePreview = document.querySelector('.selected-image-preview');
    if (localImagePreview && selectedImagePreview && settings.localImage) {
        localImagePreview.src = settings.localImage;
        selectedImagePreview.style.display = 'block';
    }
    
    // 更新URL图片预览
    const backgroundUrlInput = document.getElementById('backgroundUrlInput');
    const urlImagePreview = document.getElementById('urlImagePreview');
    const urlImagePreviewDiv = document.querySelector('.url-image-preview');
    if (backgroundUrlInput && urlImagePreview && urlImagePreviewDiv && settings.urlImage) {
        backgroundUrlInput.value = settings.urlImage;
        urlImagePreview.src = settings.urlImage;
        urlImagePreviewDiv.style.display = 'block';
    }
    
    // 更新透明度滑块
    const backgroundOpacity = document.getElementById('backgroundOpacity');
    const opacityValue = document.getElementById('opacityValue');
    if (backgroundOpacity && opacityValue) {
        backgroundOpacity.value = settings.opacity;
        opacityValue.textContent = `${settings.opacity}%`;
    }
    
    // 更新模糊度滑块
    const backgroundBlur = document.getElementById('backgroundBlur');
    const blurValue = document.getElementById('blurValue');
    if (backgroundBlur && blurValue) {
        backgroundBlur.value = settings.blur;
        blurValue.textContent = `${settings.blur}px`;
    }
    
    // 显示对应的输入区域
    const backgroundColorInputDiv = document.querySelector('.background-color-input');
    const backgroundLocalInputDiv = document.querySelector('.background-local-input');
    const backgroundUrlInputDiv = document.querySelector('.background-url-input');
    
    if (backgroundColorInputDiv && backgroundLocalInputDiv && backgroundUrlInputDiv) {
        backgroundColorInputDiv.style.display = 'none';
        backgroundLocalInputDiv.style.display = 'none';
        backgroundUrlInputDiv.style.display = 'none';
        
        if (settings.type === 'color') {
            backgroundColorInputDiv.style.display = 'flex';
        } else if (settings.type === 'local') {
            backgroundLocalInputDiv.style.display = 'block';
        } else if (settings.type === 'url') {
            backgroundUrlInputDiv.style.display = 'flex';
        }
    }
}

// 网络状态管理
const networkManager = {
    isOnline: navigator.onLine,
    pendingRequests: [],
    networkStatusElement: null,
    
    // 初始化网络状态监测
    init() {
        // 创建网络状态指示器
        this.createNetworkStatusIndicator();
        
        // 监听网络状态变化
        window.addEventListener('online', () => {
            console.log('网络连接已恢复');
            this.isOnline = true;
            this.updateNetworkStatusIndicator();
            this.retryPendingRequests();
        });
        
        window.addEventListener('offline', () => {
            console.log('网络连接已断开');
            this.isOnline = false;
            this.updateNetworkStatusIndicator();
        });
        
        // 初始化时检查网络状态
        this.updateNetworkStatusIndicator();
        
        // 监听主题变化，确保网络状态指示器和主题匹配
        document.addEventListener('themeChanged', (e) => {
            console.log('主题已变更，更新网络状态指示器样式');
            // 不需要特别处理，CSS会自动响应主题变化
        });
    },
    
    // 创建网络状态指示器
    createNetworkStatusIndicator() {
        this.networkStatusElement = document.createElement('div');
        this.networkStatusElement.className = 'network-status';
        document.body.appendChild(this.networkStatusElement);
    },
    
    // 更新网络状态指示器
    updateNetworkStatusIndicator() {
        if (!this.networkStatusElement) return;
        
        if (this.isOnline) {
            this.networkStatusElement.classList.remove('offline');
            this.networkStatusElement.classList.add('online');
            this.networkStatusElement.innerHTML = '<span class="status-icon online"></span>';
            
            // 网络恢复时，指示器自动消失
            setTimeout(() => {
                this.networkStatusElement.classList.remove('show');
            }, 3000);
        } else {
            this.networkStatusElement.classList.remove('online');
            this.networkStatusElement.classList.add('offline', 'show');
            this.networkStatusElement.innerHTML = '<span class="status-icon offline"></span><span class="status-text">网络已断开</span>';
        }
    },
    
    // 添加待重试的请求
    addPendingRequest(request) {
        if (!this.isOnline) {
            this.pendingRequests.push(request);
            return false;
        }
        return true;
    },
    
    // 重试所有待处理的请求
    retryPendingRequests() {
        if (this.pendingRequests.length === 0) return;
        
        console.log(`开始重试 ${this.pendingRequests.length} 个待处理请求`);
        
        // 复制并清空待处理请求列表
        const requests = [...this.pendingRequests];
        this.pendingRequests = [];
        
        // 逐个重试请求
        requests.forEach(request => {
            try {
                request.retry();
            } catch (error) {
                console.error('重试请求失败:', error);
            }
        });
    },
    
    // 检查网络状态
    checkConnection() {
        return this.isOnline;
    }
};

// 错误处理管理器
const errorManager = {
    errorElement: null,
    
    // 初始化错误处理
    init() {
        this.createErrorElement();
        this.setupGlobalErrorHandling();
        
        // 监听主题变化，确保错误提示与主题匹配
        document.addEventListener('themeChanged', (e) => {
            console.log('主题已变更，更新错误提示样式');
            // 不需要特别处理，CSS会自动响应主题变化
        });
    },
    
    // 创建错误提示元素
    createErrorElement() {
        this.errorElement = document.createElement('div');
        this.errorElement.className = 'global-error';
        document.body.appendChild(this.errorElement);
    },
    
    // 设置全局错误处理
    setupGlobalErrorHandling() {
        // 捕获未处理的Promise错误
        window.addEventListener('unhandledrejection', (event) => {
            console.error('未处理的Promise错误:', event.reason);
            
            // 检查是否是网络错误
            if (event.reason && (event.reason.message.includes('Network Error') || 
                event.reason.message.includes('网络连接'))) {
                // 网络错误由网络管理器处理，不显示错误提示
                return;
            }
            
            // 显示友好的错误提示
            this.showError(this.formatErrorMessage(event.reason));
        });
        
        // 捕获常规JavaScript错误
        window.addEventListener('error', (event) => {
            console.error('JavaScript错误:', event.error);
            
            // 过滤一些不需要提示用户的错误
            if (this.shouldIgnoreError(event.error)) {
                return;
            }
            
            this.showError(this.formatErrorMessage(event.error));
        });
    },
    
    // 决定是否忽略某些错误
    shouldIgnoreError(error) {
        if (!error) return true;
        
        // 忽略一些常见的非关键错误
        const ignoredErrors = [
            'ResizeObserver loop', // ResizeObserver循环错误
            'Script error', // 跨域脚本错误
            'Extension context invalidated', // 浏览器扩展错误
        ];
        
        return ignoredErrors.some(msg => error.message && error.message.includes(msg));
    },
    
    // 格式化错误信息，使其更友好
    formatErrorMessage(error) {
        if (!error) return '发生未知错误';
        
        const message = error.message || String(error);
        
        // GitHub API错误处理
        if (message.includes('API访问受限')) {
            return message; // 已经格式化过的API限制错误
        }
        
        if (message.includes('Network Error') || message.includes('network')) {
            return '网络连接错误，请检查您的网络连接';
        }
        
        if (message.includes('404')) {
            return '未找到请求的资源';
        }
        
        if (message.includes('403')) {
            return 'API访问受限，请稍后再试或检查Token是否有效';
        }
        
        if (message.includes('timeout') || message.includes('Timeout')) {
            return '请求超时，请稍后再试';
        }
        
        // 默认错误信息
        return message.length > 100 ? message.substring(0, 100) + '...' : message;
    },
    
    // 显示错误提示
    showError(message, duration = 5000) {
        if (!this.errorElement) return;
        
        this.errorElement.textContent = message;
        this.errorElement.classList.add('show');
        
        // 设置自动隐藏
        setTimeout(() => {
            this.errorElement.classList.remove('show');
        }, duration);
    }
};

// 测试辅助函数
function testFeatures() {
    // 测试网络状态指示器
    const testNetworkStatus = () => {
        // 模拟网络离线
        const originalOnline = navigator.onLine;
        Object.defineProperty(navigator, 'onLine', { 
            configurable: true,
            get: () => false 
        });
        
        // 手动触发离线事件
        window.dispatchEvent(new Event('offline'));
        
        // 2秒后恢复
        setTimeout(() => {
            Object.defineProperty(navigator, 'onLine', { 
                configurable: true,
                get: () => originalOnline 
            });
            window.dispatchEvent(new Event('online'));
        }, 2000);
    };
    
    // 测试错误提示
    const testErrorDisplay = () => {
        errorManager.showError('这是一条测试错误信息，支持深色主题！', 3000);
    };
    
    // 返回测试函数
    return {
        testNetworkStatus,
        testErrorDisplay
    };
}

// 添加键盘快捷键
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // 仅在开发环境或调试模式下启用
        // Alt+T: 切换主题
        if (e.altKey && e.key === 't') {
            const currentTheme = store.get('theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            saveTheme(newTheme);
            console.log(`主题已切换为: ${newTheme}`);
        }
        
        // Alt+E: 测试错误提示
        if (e.altKey && e.key === 'e') {
            const test = testFeatures();
            test.testErrorDisplay();
        }
        
        // Alt+N: 测试网络状态
        if (e.altKey && e.key === 'n') {
            const test = testFeatures();
            test.testNetworkStatus();
        }
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM已加载，开始初始化设置...');
    setTimeout(() => {
        try {
            // 获取存储的语言设置
            currentLanguage = store.get('language');
            
            initSettings();
            // 初始化下载管理器
            downloadManager.init();
            // 初始化页面按钮
            initPageButtons();
            // 检查GitHub Token
            checkGitHubToken();
            // 初始化自定义背景设置
            initBackgroundSettings();
            // 初始化网络状态管理
            networkManager.init();
            // 初始化错误管理
            errorManager.init();
            // 设置键盘快捷键
            setupKeyboardShortcuts();
            
            // 开发环境下自动测试
            if (process.env.NODE_ENV === 'development') {
                const test = testFeatures();
                // 延迟5秒测试，等待界面完全加载
                setTimeout(() => {
                    test.testErrorDisplay();
                    // 再等2秒测试网络状态
                    setTimeout(() => {
                        test.testNetworkStatus();
                    }, 2000);
                }, 5000);
            }
            
            console.log('设置初始化完成');
        } catch (error) {
            console.error('初始化设置时出错:', error);
        }
    }, 500);
});

// 初始化窗口控制按钮
function initWindowControls() {
    const minimizeButton = document.getElementById('window-minimize');
    const maximizeButton = document.getElementById('window-maximize');
    const closeButton = document.getElementById('window-close');
    const maximizeIcon = maximizeButton.querySelector('.maximize-icon');
    const restoreIcon = maximizeButton.querySelector('.restore-icon');
    
    // 监听窗口状态变化，更新按钮图标
    window.addEventListener('resize', () => {
        if (window.outerWidth === screen.availWidth && window.outerHeight === screen.availHeight) {
            maximizeIcon.style.display = 'none';
            restoreIcon.style.display = 'block';
        } else {
            maximizeIcon.style.display = 'block';
            restoreIcon.style.display = 'none';
        }
    });
    
    // 最小化窗口
    minimizeButton.addEventListener('click', () => {
        ipcRenderer.send('window-minimize');
    });
    
    // 最大化/还原窗口
    maximizeButton.addEventListener('click', () => {
        ipcRenderer.send('window-maximize');
    });
    
    // 关闭窗口
    closeButton.addEventListener('click', () => {
        ipcRenderer.send('window-close');
    });
}

// 初始化主题
function initTheme() {
    const savedTheme = store.get('theme');
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    const themeRadio = document.querySelector(`input[name="theme"][value="${savedTheme}"]`);
    if (themeRadio) {
        themeRadio.checked = true;
    }
}

// 初始化卡片显示设置
function initCardDisplay() {
    const savedCardDisplay = store.get('card_display');
    const cardDisplayRadio = document.querySelector(`input[name="card-display"][value="${savedCardDisplay}"]`);
    if (cardDisplayRadio) {
        cardDisplayRadio.checked = true;
    }
    resultsContainer.classList.toggle('list-view', savedCardDisplay === 'list');
    
    const hideBadges = store.get('hide_badges');
    if (hideBadgesCheckbox) {
        hideBadgesCheckbox.checked = hideBadges;
    }
} 