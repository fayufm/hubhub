const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const packageJson = require('./package.json');

// 设置参数
const version = packageJson.version;
const appName = 'HubHub';
const macDir = path.join(__dirname, 'mac_build');

// 确保目录存在
if (!fs.existsSync(macDir)) {
  fs.mkdirSync(macDir, { recursive: true });
}

console.log('准备Mac打包环境...');

// 创建Mac图标说明文件
const macIconInfoContent = `
# Mac打包注意事项

## 图标文件
Mac应用需要使用.icns格式的图标文件。要将app.ico转换为.icns格式，可以按照以下步骤操作：

1. 从app.ico提取高分辨率PNG图标（至少1024x1024像素）
2. 使用以下工具之一转换：
   - 在线工具: https://cloudconvert.com/png-to-icns
   - 使用Mac上的IconUtil命令行工具
   - 使用图标编辑软件如Icon Composer

## 签名和公证
在macOS上发布应用时，为了获得最佳用户体验，应考虑对应用进行签名和公证：

1. 需要一个有效的Apple Developer ID证书
2. 使用以下命令为您的应用签名：
   \`\`\`
   electron-builder --mac --sign="Developer ID Application: Your Name (TEAM_ID)"
   \`\`\`
3. 应用打包后，需要提交给Apple进行公证

## 构建命令
在Mac系统上运行以下命令进行构建：

### 标准安装版
\`\`\`
npm run build:mac
\`\`\`

这将会生成两种格式：
- .dmg 安装映像
- .zip 便携压缩版

### 便携版（无需安装）
\`\`\`
npm run build:mac-portable
\`\`\`

这将生成一个目录结构，包含完整的.app应用程序，可以直接运行，无需安装。

## 架构支持
构建配置已经包含对Intel (x64)和Apple Silicon (arm64)的支持。

## 便携版使用说明
便携版构建完成后，您会在dist/mac目录下找到HubHub.app文件。这是一个标准的Mac应用程序包，可以：

1. 复制到任何位置（比如U盘）
2. 直接双击运行，无需安装
3. 用户数据会存储在应用程序包内部，保持完全便携性

注意：由于macOS的安全机制，首次运行未签名的应用可能会显示警告，用户需要在"系统设置">"安全性与隐私"中允许打开。

## 注意事项
- 跨平台构建Mac应用存在限制，建议在Mac系统上构建Mac版本
- 如果在Windows上使用electron-builder打包，它只能生成未签名的Mac应用
- 对于正式发布，推荐在Mac系统上执行构建和签名
`;

fs.writeFileSync(path.join(macDir, 'MAC_BUILD_INFO.txt'), macIconInfoContent);
console.log('已创建Mac打包说明文件: MAC_BUILD_INFO.txt');

// 创建一个简单脚本，可在Mac上用于便捷构建
const macScriptContent = `#!/bin/bash
# Mac构建脚本

# 安装依赖
npm install

# 构建应用
if [ "$1" == "portable" ]; then
  echo "构建便携版应用..."
  npm run build:mac-portable
  
  # 创建便携版分发包
  echo "创建便携版分发包..."
  VERSION=$(node -e "console.log(require('./package.json').version)")
  ARCH=$(uname -m)
  if [ "$ARCH" == "x86_64" ]; then
    ARCH="x64"
  elif [ "$ARCH" == "arm64" ]; then
    ARCH="arm64"
  fi
  
  # 创建便携版目录
  mkdir -p "./dist/HubHub-Portable-$VERSION-$ARCH"
  cp -r "./dist/mac/HubHub.app" "./dist/HubHub-Portable-$VERSION-$ARCH/"
  
  # 创建启动脚本
  cat > "./dist/HubHub-Portable-$VERSION-$ARCH/启动HubHub.command" << EOL
#!/bin/bash
DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
open "\$DIR/HubHub.app"
EOL
  
  chmod +x "./dist/HubHub-Portable-$VERSION-$ARCH/启动HubHub.command"
  
  # 创建README
  cat > "./dist/HubHub-Portable-$VERSION-$ARCH/README.txt" << EOL
HubHub 便携版 $VERSION

使用方法：
1. 双击"HubHub.app"直接运行程序
2. 如果无法运行，请双击"启动HubHub.command"脚本启动

注意：
- 首次运行可能需要在"系统设置">"安全性与隐私"中允许打开
- 所有数据会保存在应用程序内部，保持完全便携性
- 可以将整个文件夹复制到U盘或其他位置使用
EOL
  
  # 压缩便携版目录
  cd "./dist"
  zip -r "HubHub-Portable-$VERSION-$ARCH.zip" "HubHub-Portable-$VERSION-$ARCH"
  echo "便携版已创建: ./dist/HubHub-Portable-$VERSION-$ARCH.zip"
  
else
  echo "构建标准版应用..."
  npm run build:mac
fi

echo "Mac构建完成！"
`;

fs.writeFileSync(path.join(macDir, 'build_mac.sh'), macScriptContent);
console.log('已创建Mac构建脚本: build_mac.sh');

// 创建便携版复制脚本
const portableScriptContent = `#!/bin/bash
# 便携版复制脚本

# 显示使用帮助
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
  echo "HubHub 便携版复制脚本"
  echo "用法: ./copy_portable.sh [目标路径]"
  echo ""
  echo "如果不提供目标路径，将会提示选择目标文件夹"
  exit 0
fi

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION=$(node -e "console.log(require('./package.json').version)")
ARCH=$(uname -m)
if [ "$ARCH" == "x86_64" ]; then
  ARCH="x64"
elif [ "$ARCH" == "arm64" ]; then
  ARCH="arm64"
fi

APP_NAME="HubHub-Portable-$VERSION-$ARCH"
SOURCE_DIR="$SCRIPT_DIR/dist/$APP_NAME"

# 检查源目录是否存在
if [ ! -d "$SOURCE_DIR" ]; then
  echo "错误：便携版应用目录 '$SOURCE_DIR' 不存在！"
  echo "请先运行打包命令：./build_mac.sh portable"
  exit 1
fi

# 如果提供了目标路径，直接使用
if [ -n "$1" ]; then
  TARGET_DIR="$1"
else
  # 否则使用对话框选择目标文件夹
  echo "请选择要复制到的文件夹（如U盘）..."
  TARGET_DIR=$(osascript -e 'tell application "Finder" to set folderName to POSIX path of (choose folder with prompt "选择要复制HubHub便携版的目标文件夹：")')
  
  # 检查是否取消选择
  if [ -z "$TARGET_DIR" ]; then
    echo "已取消操作"
    exit 0
  fi
fi

# 确保目标目录存在
if [ ! -d "$TARGET_DIR" ]; then
  echo "创建目标目录: $TARGET_DIR"
  mkdir -p "$TARGET_DIR"
fi

# 在目标目录中创建应用目录
APP_TARGET_DIR="$TARGET_DIR/$APP_NAME"
if [ -d "$APP_TARGET_DIR" ]; then
  echo "警告：目标目录 '$APP_TARGET_DIR' 已存在，将被覆盖！"
  read -p "是否继续？(y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消操作"
    exit 0
  fi
  rm -rf "$APP_TARGET_DIR"
fi

# 复制文件
echo "正在复制HubHub便携版到 '$APP_TARGET_DIR'..."
mkdir -p "$APP_TARGET_DIR"
cp -r "$SOURCE_DIR/"* "$APP_TARGET_DIR/"

# 确保权限正确
chmod +x "$APP_TARGET_DIR/启动HubHub.command"
chmod -R 755 "$APP_TARGET_DIR/HubHub.app"

echo "完成！HubHub便携版已复制到："
echo "$APP_TARGET_DIR"
echo ""
echo "使用方法："
echo "1. 进入便携版目录"
echo "2. 双击 'HubHub.app' 启动应用"
echo "3. 或使用 '启动HubHub.command' 脚本启动"
`;

fs.writeFileSync(path.join(macDir, 'copy_portable.sh'), portableScriptContent);
console.log('已创建便携版复制脚本: copy_portable.sh');

// 创建README
const readmeContent = `# ${appName} Mac构建

本目录包含为Mac构建${appName}应用的相关资源和说明。

## 文件说明
- MAC_BUILD_INFO.txt: 包含Mac构建的详细说明
- build_mac.sh: Mac平台上可直接运行的构建脚本
- copy_portable.sh: 便携版复制脚本，用于将便携版复制到U盘等移动设备

## 构建选项
### 标准版（DMG安装包和ZIP版）
\`\`\`
./build_mac.sh
\`\`\`

### 便携版（无需安装）
\`\`\`
./build_mac.sh portable
\`\`\`

## 关于跨平台构建
由于macOS应用签名和公证的特性，为获得最佳体验，建议在Mac系统上构建应用。
如果您在Windows系统上构建Mac版本，可能会出现以下限制：

1. 无法为应用签名
2. 用户首次运行时可能会收到安全警告
3. 某些Mac特定功能可能无法正常使用

## 快速开始
1. 将项目文件复制到Mac系统
2. 运行以下命令：
   \`\`\`
   cd 项目目录
   chmod +x mac_build/build_mac.sh
   chmod +x mac_build/copy_portable.sh
   ./mac_build/build_mac.sh portable  # 构建便携版
   \`\`\`

3. 构建完成后，可以在\`dist\`目录中找到Mac应用程序
4. 要将便携版复制到U盘，可以运行：
   \`\`\`
   ./mac_build/copy_portable.sh [目标路径]
   \`\`\`

## 便携版特性
- 所有数据保存在应用程序内部（HubHubData目录）
- 可以直接从U盘运行，不影响系统
- 包含启动脚本，确保在任何Mac上都能正常运行

构建于: ${new Date().toLocaleDateString()}
`;

fs.writeFileSync(path.join(macDir, 'README.md'), readmeContent);
console.log('已创建README.md文件');

console.log('\n准备完成！Mac打包环境已创建于：' + macDir);
console.log('要在Mac系统上构建，请将项目文件和这个目录复制到Mac系统，并按照README的指导进行操作。');
console.log('注意：在Windows上直接打包Mac应用存在一定限制，建议在Mac系统上执行最终构建。'); 