@echo off
setlocal enabledelayedexpansion

echo ===== HubHub 应用程序构建工具 =====
echo 正在准备构建环境...

:: 检查Node.js是否已安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误: 未找到Node.js，请先安装Node.js。
    echo 您可以从 https://nodejs.org/ 下载并安装。
    pause
    exit /b 1
)

:: 检查npm是否已安装
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误: 未找到npm，请确认Node.js安装是否完整。
    pause
    exit /b 1
)

:: 检查是否在项目根目录
if not exist "package.json" (
    echo 错误: 未找到package.json文件，请确认您在项目根目录中运行此脚本。
    pause
    exit /b 1
)

:: 安装依赖
echo 正在安装项目依赖...
call npm install
if %ERRORLEVEL% neq 0 (
    echo 错误: 安装依赖失败，请检查网络连接或package.json文件。
    pause
    exit /b 1
)

:: 菜单选择
echo.
echo 请选择要构建的版本:
echo 1. 仅构建便携版
echo 2. 仅构建安装版
echo 3. 同时构建便携版和安装版
echo 4. 退出
echo.

set /p choice=请输入选项 (1-4): 

if "%choice%"=="1" (
    echo 正在构建便携版...
    call npm run build:portable
    if %ERRORLEVEL% neq 0 (
        echo 错误: 构建便携版失败。
        pause
        exit /b 1
    )
    echo 便携版构建成功！文件位于 dist 目录中。
) else if "%choice%"=="2" (
    echo 正在构建安装版...
    call npm run build:installer
    if %ERRORLEVEL% neq 0 (
        echo 错误: 构建安装版失败。
        pause
        exit /b 1
    )
    echo 安装版构建成功！文件位于 dist 目录中。
) else if "%choice%"=="3" (
    echo 正在构建便携版和安装版...
    call npm run build
    if %ERRORLEVEL% neq 0 (
        echo 错误: 构建失败。
        pause
        exit /b 1
    )
    echo 便携版和安装版构建成功！文件位于 dist 目录中。
) else if "%choice%"=="4" (
    echo 退出构建。
    exit /b 0
) else (
    echo 无效的选项。退出构建。
    pause
    exit /b 1
)

:: 完成
echo.
echo ===== 构建过程完成 =====
echo 请在 dist 目录中查看生成的文件。
pause 