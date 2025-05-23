# HubHub - GitHub项目浏览器

版本 1.15.0

HubHub是一个用Electron构建的桌面应用程序，允许用户搜索、浏览和下载GitHub上的项目。

## 功能特点

- 搜索GitHub上的项目
- 查看项目的README文件（与GitHub风格一致）
- 浏览项目发布的版本，下载安装包
- 查看项目源代码
- 浏览GitHub上热门项目

## 开发说明

### 安装依赖

```bash
npm install
```

### 运行开发版本

```bash
npm run dev
```

### 构建可执行文件

```bash
npm run build
```

## 技术栈

- Electron
- JavaScript
- marked.js (用于Markdown渲染)
- GitHub REST API

## 注意事项

该应用程序使用GitHub API进行数据获取，可能会受到GitHub API请求限制。在运行应用时，请确保正确配置了GitHub令牌。 