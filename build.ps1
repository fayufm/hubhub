# HubHub 应用程序构建脚本
# 该脚本用于构建 HubHub 的便携版和安装版

Write-Host "===== HubHub 应用程序构建工具 =====" -ForegroundColor Cyan
Write-Host "正在准备构建环境..." -ForegroundColor Yellow

# 检查Node.js是否已安装
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未找到Node.js，请先安装Node.js。" -ForegroundColor Red
    Write-Host "您可以从 https://nodejs.org/ 下载并安装。" -ForegroundColor Red
    exit 1
}

# 检查npm是否已安装
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未找到npm，请确认Node.js安装是否完整。" -ForegroundColor Red
    exit 1
}

# 检查是否在项目根目录
if (-not (Test-Path -Path "package.json")) {
    Write-Host "错误: 未找到package.json文件，请确认您在项目根目录中运行此脚本。" -ForegroundColor Red
    exit 1
}

# 安装依赖
Write-Host "正在安装项目依赖..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 安装依赖失败，请检查网络连接或package.json文件。" -ForegroundColor Red
    exit 1
}

# 菜单选择
Write-Host
Write-Host "请选择要构建的版本:" -ForegroundColor Cyan
Write-Host "1. 仅构建便携版" -ForegroundColor White
Write-Host "2. 仅构建安装版" -ForegroundColor White
Write-Host "3. 同时构建便携版和安装版" -ForegroundColor White
Write-Host "4. 退出" -ForegroundColor White
Write-Host

$choice = Read-Host -Prompt "请输入选项 (1-4)"

switch ($choice) {
    "1" {
        Write-Host "正在构建便携版..." -ForegroundColor Yellow
        npm run build:portable
        if ($LASTEXITCODE -ne 0) {
            Write-Host "错误: 构建便携版失败。" -ForegroundColor Red
            exit 1
        }
        Write-Host "便携版构建成功！文件位于 dist 目录中。" -ForegroundColor Green
    }
    "2" {
        Write-Host "正在构建安装版..." -ForegroundColor Yellow
        npm run build:installer
        if ($LASTEXITCODE -ne 0) {
            Write-Host "错误: 构建安装版失败。" -ForegroundColor Red
            exit 1
        }
        Write-Host "安装版构建成功！文件位于 dist 目录中。" -ForegroundColor Green
    }
    "3" {
        Write-Host "正在构建便携版和安装版..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "错误: 构建失败。" -ForegroundColor Red
            exit 1
        }
        Write-Host "便携版和安装版构建成功！文件位于 dist 目录中。" -ForegroundColor Green
    }
    "4" {
        Write-Host "退出构建。" -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "无效的选项。退出构建。" -ForegroundColor Red
        exit 1
    }
}

# 完成
Write-Host
Write-Host "===== 构建过程完成 =====" -ForegroundColor Cyan
Write-Host "请在 dist 目录中查看生成的文件。" -ForegroundColor White
Write-Host "按任意键退出..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 