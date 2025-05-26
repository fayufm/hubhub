# HubHub 应用程序构建指南

本指南将帮助您构建 HubHub 应用程序的便携版和安装版。

## 前置要求

确保您的系统已安装以下软件：
- Node.js (建议 v14 或更高版本)
- npm (通常随 Node.js 一起安装)
- Git (用于版本控制，可选)

## 安装依赖

首先，打开命令行终端，导航到项目根目录，然后运行以下命令安装所有依赖：

```bash
npm install
```

这将安装 package.json 文件中列出的所有依赖项，包括 Electron 和 electron-builder。

## 构建应用程序

HubHub 已经配置了构建脚本，可以方便地创建便携版和安装版。

### 构建便携版

便携版是一个单独的可执行文件，无需安装即可运行。要构建便携版，请运行：

```bash
npm run build:portable
```

构建完成后，便携版文件将位于 `dist` 目录中，文件名为 `HubHub-便携版-2.0.2.exe`。

### 构建安装版

安装版会创建一个安装程序，用户可以通过它将应用程序安装到他们的系统中。要构建安装版，请运行：

```bash
npm run build:installer
```

构建完成后，安装程序将位于 `dist` 目录中，文件名为 `HubHub-Setup-2.0.2.exe`。

### 一次性构建两个版本

如果您想同时构建便携版和安装版，可以运行：

```bash
npm run build
```

这将按照 package.json 中的配置创建所有目标格式。

## 构建配置

应用程序的构建配置位于 package.json 文件的 "build" 部分。主要配置包括：

- **应用标识**：`com.hubhub.app`
- **产品名称**：`HubHub`
- **图标**：`assets/26.ico`
- **输出目录**：`dist`
- **Windows配置**：
  - 目标格式：nsis (安装版), portable (便携版)
  - 图标: `assets/26.ico`

如需修改这些配置，请编辑 package.json 文件。 