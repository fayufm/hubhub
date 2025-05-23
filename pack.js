const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');
const packageJson = require('./package.json');

// 设置参数
const version = packageJson.version;
const appName = 'HubHub';
const distDir = path.join(__dirname, 'dist');
const portableDir = path.join(distDir, `${appName}-portable-${version}`);
const zipFilename = `${appName}-portable-${version}.zip`;

// 确保目录存在
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (fs.existsSync(portableDir)) {
  console.log(`正在清除旧的便携版目录: ${portableDir}`);
  fs.rmSync(portableDir, { recursive: true, force: true });
}

// 创建便携版目录
fs.mkdirSync(portableDir, { recursive: true });

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
  const targetDir = path.join(portableDir, dir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
});

// 复制文件
filesToCopy.forEach(file => {
  const sourcePath = path.join(__dirname, file);
  const targetPath = path.join(portableDir, file);
  
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
  const targetPath = path.join(portableDir, file);
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`已复制图片: ${file}`);
});

// 创建启动批处理文件
const batchContent = `@echo off
echo 正在启动 ${appName} v${version}...
.\\node_modules\\.bin\\electron.cmd .
`;
fs.writeFileSync(path.join(portableDir, 'start.bat'), batchContent);
console.log('已创建启动批处理文件: start.bat');

// 创建README.txt文件
const readmeContent = `${appName} 便携版 v${version}
===============================

感谢您使用 ${appName}！这是一个便携版，不需要安装即可运行。

使用说明:
1. 解压所有文件到任意文件夹
2. 双击"start.bat"文件启动应用程序
3. 如需设置个人GitHub Token，可点击应用内底部的设置按钮

注意事项:
- 请勿删除或移动任何文件
- 数据和设置将保存在应用程序文件夹内
- 如需移动应用，请整个文件夹一起移动

${new Date().toLocaleDateString()} 发布
`;
fs.writeFileSync(path.join(portableDir, 'README.txt'), readmeContent);
console.log('已创建README.txt文件');

// 安装依赖
console.log('安装生产依赖...');
process.chdir(portableDir);
execSync('npm install --production', { stdio: 'inherit' });

// 打包为zip
console.log(`正在创建zip包: ${zipFilename}`);
process.chdir(__dirname);

// 创建输出文件流
const output = fs.createWriteStream(path.join(distDir, zipFilename));
const archive = archiver('zip', {
  zlib: { level: 9 } // 设置压缩级别
});

// 监听所有归档数据都已写入输出文件流后触发的'close'事件
output.on('close', function() {
  console.log(`打包完成! 文件大小: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
  console.log(`打包文件路径: ${path.join(distDir, zipFilename)}`);
});

// 监听警告
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('警告:', err);
  } else {
    throw err;
  }
});

// 监听错误
archive.on('error', function(err) {
  throw err;
});

// 管道归档数据到文件
archive.pipe(output);

// 添加目录
archive.directory(portableDir, false);

// 完成归档
archive.finalize(); 