const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const packageJson = require('./package.json');

// 设置参数
const version = packageJson.version;
const appName = 'HubHub';
const distDir = path.join(__dirname, 'dist1');
const installDir = path.join(distDir, `${appName}-installer-${version}`);

// 确保目录存在
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (fs.existsSync(installDir)) {
  console.log(`正在清除旧的安装版目录: ${installDir}`);
  fs.rmSync(installDir, { recursive: true, force: true });
}

// 创建安装版目录
fs.mkdirSync(installDir, { recursive: true });

// 复制必要的文件
const filesToCopy = [
  'main.js',
  'renderer.js',
  'preload.js',
  'index.html',
  'splash.html',
  'styles.css',
  'markdownWorker.js',
  'app.ico',
  'package.json'
];

const dirsToCreate = [
  'node_modules'
];

// 确保目标目录的子目录存在
dirsToCreate.forEach(dir => {
  const targetDir = path.join(installDir, dir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
});

// 复制文件
filesToCopy.forEach(file => {
  const sourcePath = path.join(__dirname, file);
  const targetPath = path.join(installDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`已复制文件: ${file}`);
  } else {
    console.warn(`警告: 文件不存在: ${sourcePath}`);
  }
});

// 复制一些图片文件
const pngFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.png'));
pngFiles.forEach(file => {
  const sourcePath = path.join(__dirname, file);
  const targetPath = path.join(installDir, file);
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`已复制图片: ${file}`);
});

// 创建启动批处理文件
const batchContent = `@echo off
echo 正在启动 ${appName} v${version}...
.\\node_modules\\.bin\\electron.cmd .
`;
fs.writeFileSync(path.join(installDir, 'start.bat'), batchContent);
console.log('已创建启动批处理文件: start.bat');

// 创建安装提示信息
const installInfoContent = `${appName} 安装版 v${version}
===============================

这是${appName}的安装版准备文件，可以使用Inno Setup进行打包。

图标文件: app.ico 
应用版本: ${version}
主程序入口: start.bat
所需文件: 目录中的所有文件

Inno Setup打包要点:
- 应用ID: com.hubhub.app
- 应用名称: ${appName}
- 版本: ${version}
- 安装目录: {pf}\\${appName}
- 桌面图标: 使用app.ico
- 开始菜单项: ${appName}/${appName}

${new Date().toLocaleDateString()} 生成
`;
fs.writeFileSync(path.join(installDir, 'INSTALL_INFO.txt'), installInfoContent);
console.log('已创建安装信息文件: INSTALL_INFO.txt');

// 安装依赖
console.log('安装生产依赖...');
process.chdir(installDir);
execSync('npm install --production', { stdio: 'inherit' });

// 返回原目录
process.chdir(__dirname);
console.log(`准备完成! 安装文件位于: ${installDir}`);
console.log('可以使用Inno Setup加载这些文件创建安装包'); 