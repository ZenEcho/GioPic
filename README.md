# GioPic

GioPic 是一个多节点、多图床的浏览器图片上传扩展，一次操作即可将图片同时分发到多个对象存储、图床或自建服务。

GioPic is a multi-node image upload browser extension that can upload images to multiple providers (image hosts, object storages, GitHub and custom HTTP endpoints) at once.

[![Chrome](https://img.shields.io/badge/Chromium-chrome-blue?style=for-the-badge&logo=googlechrome)](https://chromewebstore.google.com/detail/giopic/cjmhdboadkifegpfnflaflbjeehndmak)

## 🌟 功能特性 / Features

- **多节点分发 (Multi-node Delivery)**：配置多个「分发节点」，一次上传并行推送到多个目标。
- **丰富图床与存储支持 (Rich Providers)**：
  - Lsky Pro、EasyImages、Chevereto、ImgURL、Hellohao、SM.MS、Imgur
  - Aliyun OSS、Tencent COS、AWS S3、GitHub 仓库、自定义 HTTP 接口
- **便捷上传方式 (Easy Upload)**：
  - 拖拽上传、点击选择、粘贴剪贴板图片
  - 网页图片右键菜单「GioPic 上传图片」
- **网页集成 (In-page Integration)**：
  - 网页侧边可拖动 GioPic 手柄，点击后在页面内打开上传面板
  - 浮动上传列表实时显示上传进度，一键复制或注入链接
- **历史记录与批量管理 (History & Batch)**：支持搜索、筛选、排序和批量删除上传记录。
- **云存储增强 (Cloud-friendly)**：内置 Aliyun / Tencent COS / AWS S3 的 CORS 与 ACL 可视化配置。
- **多语言与多布局 (Multi-language & Layouts)**：简体中文 / English，经典 / 控制台 / 中心 / 极简布局，深色 / 浅色主题与多种主题色。

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

## 📖 Usage Guide / 使用指南

### Adding Image Storage / 添加图床

1. **Open Extension / 打开扩展**: Click the extension icon in the browser toolbar.
   点击浏览器工具栏中的扩展图标。
2. **Add Node / 添加节点**: Click the "+" button in the sidebar ("Add New Interface").
   点击侧边栏中的 "+" 按钮 ("添加新接口")。
3. **Select Type / 选择类型**: Choose your storage provider (e.g., Lsky Pro, Aliyun OSS, Custom, etc.).
   选择您的存储服务提供商（如兰空图床、阿里云 OSS、自定义等）。
4. **Configure / 配置**: Enter the required information (API URL, Token/AccessKey, etc.).
   输入必要的信息（API 地址、Token/AccessKey 等）。
5. **Save / 保存**: Click "Save" to finish.
   点击 "保存" 完成添加。

### One-Click Configuration / 一键配置

For supported sites (like Lsky Pro, EasyImages), when you visit the site, GioPic may detect it and offer a "One-Click Add" button to automatically configure the extension.
对于支持的站点（如兰空图床、简单图床），当您访问该站点时，GioPic 可能会检测到并提供 "一键添加" 按钮，自动配置扩展。

## 🧑‍💻 Development / 开发指南

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

### Test / 测试

```bash
pnpm test
```

### Adding New Image Host / 添加新图床

To add support for a new image hosting service, you need to modify two files:
添加对新图床的支持需要修改以下两个文件：

1. **Define Configuration Schema / 定义配置表单**:
   Edit `src/constants/driveSchemas.ts` to add the configuration fields required for the new image host.
   编辑 `src/constants/driveSchemas.ts`，添加新图床所需的配置项定义。

   Example / 示例:
   ```typescript
   export const DRIVE_SCHEMAS: Record<string, FieldSchema[]> = {
     // ...
     new_host: [
       { key: 'apiUrl', label: 'API URL', type: 'text', required: true },
       { key: 'token', label: 'Token', type: 'password', required: true },
     ],
   }

   // Don't forget to add it to DRIVE_TYPE_OPTIONS
   // 别忘了添加到 DRIVE_TYPE_OPTIONS 选项列表中
   export const DRIVE_TYPE_OPTIONS = [
     // ...
     { label: 'New Host Name', value: 'new_host' },
   ]
   ```

2. **Implement Upload Logic / 实现上传逻辑**:
   Edit `src/services/uploader.ts` to implement the upload function and register it in the main `uploadImage` function.
   编辑 `src/services/uploader.ts`，实现上传函数并在主 `uploadImage` 函数中注册。

   Example / 示例:
   ```typescript
   // 1. Register in uploadImage / 在 uploadImage 中注册
   export async function uploadImage(...) {
     switch (config.type) {
       // ...
       case 'new_host':
         return uploadNewHost(file, config, onProgress)
     }
   }

   // 2. Implement function / 实现具体的上传函数
   async function uploadNewHost(file: File, config: any, onProgress: ProgressCallback): Promise<UploadResult> {
     // Implement upload logic using fetch or axios
     // 实现上传逻辑
     const formData = new FormData()
     formData.append('file', file)
     
     const res = await fetchUpload(config.apiUrl, formData, {
       'Authorization': config.token
     }, onProgress)

     return {
       url: res.data.url
     }
   }
   ```

## 🏗️ Tech Stack / 技术栈

- [Vue 3](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Naive UI](https://www.naiveui.com/)
- [Pinia](https://pinia.vuejs.org/)
- [UnoCSS](https://unocss.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [WebExtension Polyfill](https://github.com/mozilla/webextension-polyfill)
