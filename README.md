# GioPic

GioPic 是一个功能强大的浏览器图片上传扩展，支持多种图床和对象存储服务。
GioPic is a powerful browser extension for uploading images to various storage services.

[![Chrome](https://img.shields.io/badge/Chromium-chrome-blue?style=for-the-badge&logo=googlechrome)](https://chromewebstore.google.com/detail/giopic/cjmhdboadkifegpfnflaflbjeehndmak)

## 🌟 Features / 功能特性

- **多图床支持 (Multi-Storage Support)**:
  - Lsky Pro (兰空图床)
  - EasyImages (简单图床)
  - Chevereto
  - Aliyun OSS (阿里云对象存储)
  - AWS S3 & S3 Compatible Services
  - Tencent COS (腾讯云对象存储)
  - Qiniu Kodo (七牛云对象存储)
- **便捷上传 (Easy Upload)**:
  - 拖拽上传 (Drag & Drop)
  - 粘贴上传 (Paste to Upload)
  - 右键菜单上传 (Context Menu Upload)
- **历史记录 (History Management)**: 查看和管理上传历史 (View and manage upload history).
- **多语言 (Multi-language)**: 支持简体中文和英语 (English & Simplified Chinese).
- **现代化界面 (Modern UI)**: 基于 Vue 3 + Naive UI 构建 (Built with Vue 3 and Naive UI).

## 🔧 Supported Browsers / 支持的浏览器

- Google Chrome (Latest Version)
- Microsoft Edge (Latest Version)

## 演示图

[![](https://i.mji.rip/2026/01/14/2bafa0a93887a7bb20d16454648edcd5.png)](https://i.mji.rip/2026/01/14/2bafa0a93887a7bb20d16454648edcd5.png)
[![](https://i.mji.rip/2026/01/14/3c36933ae6050a35b25e5624c2d50517.png)](https://i.mji.rip/2026/01/14/3c36933ae6050a35b25e5624c2d50517.png)
[![](https://i.mji.rip/2026/01/14/399fe94db0b61260ea57b96b9936db81.png)](https://i.mji.rip/2026/01/14/399fe94db0b61260ea57b96b9936db81.png)

## 🛠️ Installation / 安装

1. Download the latest release or build from source.
   下载最新版本或从源码构建。
2. Open Chrome/Edge and go to `chrome://extensions/`.
   打开 Chrome/Edge 浏览器的扩展管理页面 `chrome://extensions/`。
3. Enable "Developer mode".
   开启 "开发者模式"。
4. Click "Load unpacked" and select the `dist` directory.
   点击 "加载已解压的扩展程序"，选择 `dist` 目录。
### 浏览器商店安装

- [Chrome 扩展商店](https://chromewebstore.google.com/detail/giopic/cjmhdboadkifegpfnflaflbjeehndmak)
- [Edge 扩展商店(待审核)](https://chromewebstore.google.com/detail/giopic/cjmhdboadkifegpfnflaflbjeehndmak)

## 💻 Development / 开发指南

### Prerequisites / 前置要求

- Node.js >= 20.19.0
- pnpm

### Setup / 初始化

```bash
pnpm install
```

### Development Mode / 开发模式

```bash
# Start development server (Watch mode)
# 启动开发服务器（监听模式）
pnpm dev
```

### Build / 构建

```bash
# Build for production
# 构建生产环境版本
pnpm build
```

## 🏗️ Tech Stack / 技术栈

- [Vue 3](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Naive UI](https://www.naiveui.com/)
- [Pinia](https://pinia.vuejs.org/)
- [UnoCSS](https://unocss.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [WebExtension Polyfill](https://github.com/mozilla/webextension-polyfill)
