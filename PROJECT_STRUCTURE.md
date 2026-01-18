# 项目结构规范 (Project Structure Standard)

以下是基于企业级标准和当前项目需求梳理的**推荐项目结构树**。此结构旨在统一命名规范，消除冗余文件，并清晰划分模块职责。

## 目录树 (Directory Tree)

```text
GIOPIC/
├── .vscode/                 # VSCode 编辑器配置
├── manifest/                # Manifest 生成脚本
│   ├── manifest.ts
│   ├── prepare.ts
│   └── utils.ts
├── src/                     # 源码主目录
│   ├── assets/              # 静态资源
│   │   ├── icons/           # 图标资源
│   │   │   ├── logo16.png
│   │   │   ├── logo32.png
│   │   │   ├── logo64.png
│   │   │   ├── logo128.png
│   │   │   └── logo256.png
│   │   └── main.css         # 全局样式
│   ├── background/          # Background Service Worker (后台服务)
│   │   ├── services/        # 后台专用服务
│   │   │   ├── actionManager.ts
│   │   │   ├── contextMenu.ts
│   │   │   ├── desktopLink.ts
│   │   │   ├── imageService.ts
│   │   │   ├── messageService.ts
│   │   │   └── notificationService.ts
│   │   ├── index.ts         # Background 入口
│   │   └── polyfill.ts
│   ├── components/          # Vue 组件库 (通用/业务组件)
│   │   ├── common/          # 通用基础组件 (Button, Input, Modal等，预留)
│   │   ├── config/          # 配置相关组件
│   │   │   ├── AclConfig.vue
│   │   │   ├── ConfigModal.vue
│   │   │   ├── CorsConfig.vue
│   │   │   └── DynamicConfigForm.vue
│   │   ├── history/         # 历史记录组件 (Grid, Toolbar)
│   │   │   ├── HistoryGrid.vue
│   │   │   ├── HistoryHeader.vue
│   │   │   └── HistoryToolbar.vue
│   │   ├── home/            # 主页业务组件
│   │   │   ├── node/        # 节点列表相关
│   │   │   │   └── NodeList.vue
│   │   │   ├── queue/       # 上传队列相关
│   │   │   │   └── UploadQueue.vue
│   │   │   ├── sidebar/     # 侧边栏及相关弹窗
│   │   │   │   ├── ClassicSidebar.vue
│   │   │   │   ├── ConsoleSidebar.vue
│   │   │   │   ├── ImportConfigModal.vue
│   │   │   │   └── ...      # 其它侧边栏组件
│   │   │   └── upload/      # 上传区域
│   │   │       └── UploadZone.vue
│   │   └── settings/        # 设置页组件
│   │       ├── SettingsModal.vue
│   │       └── SidebarSettings.vue
│   ├── composables/         # 组合式函数 (Hooks)
│   │   ├── useBatchSelection.ts
│   │   ├── useHistoryDisplay.ts
│   │   ├── useSidebar.ts    # (原 composables/home/useSidebar.ts)
│   │   ├── useUploadInput.ts
│   │   └── useUploadQueue.ts
│   ├── constants/           # 常量定义
│   │   └── driveSchemas.ts  # (统一命名，合并 drive-schemas.ts)
│   ├── content/             # Content Scripts (页面注入脚本)
│   │   ├── components/      # 注入页面的 Vue 组件
│   │   │   ├── NotificationView.vue
│   │   │   ├── TokenDetector.vue
│   │   │   ├── UploadList.vue
│   │   │   └── WebSidebar.vue
│   │   ├── composables/     # Content 专用 Hooks
│   │   │   ├── useDraggable.ts
│   │   │   └── useSidebarDrag.ts
│   │   ├── page/            # 页面上下文脚本 (Page Script)
│   │   │   ├── editorInjector/
│   │   │   │   ├── detectors.ts
│   │   │   │   ├── handlers.ts
│   │   │   │   └── types.ts
│   │   │   ├── App.vue
│   │   │   ├── index.ts
│   │   │   └── style.css
│   │   ├── services/        # Content 专用服务
│   │   │   └── driveDetector.ts
│   │   ├── utils/           # Content 专用工具
│   │   │   └── mount.ts
│   │   ├── index.ts         # Content 入口
│   │   └── style.css
│   ├── layouts/             # 页面布局
│   │   └── AppLayout.vue
│   ├── locales/             # 国际化语言包
│   │   ├── en-US.ts
│   │   └── zh-CN.ts
│   ├── router/              # 路由配置
│   │   └── index.ts
│   ├── services/            # 前端核心业务服务 (与 UI 耦合度低)
│   │   ├── bucket.ts
│   │   └── uploader.ts
│   ├── stores/              # Pinia 状态管理
│   │   ├── config.ts
│   │   ├── history.ts
│   │   ├── node.ts
│   │   └── theme.ts
│   ├── types/               # TypeScript 类型定义
│   │   ├── auto-imports.d.ts
│   │   ├── components.d.ts
│   │   └── index.ts
│   ├── utils/               # 通用工具函数
│   │   ├── common.ts
│   │   ├── icon.ts
│   │   ├── storage.ts
│   │   └── taskQueue.ts     # (统一命名，合并 task-queue.ts)
│   ├── views/               # 页面视图
│   │   ├── home/
│   │   │   ├── CenterHome.vue
│   │   │   ├── ClassicHome.vue
│   │   │   ├── ConsoleHome.vue
│   │   │   └── SimpleHome.vue
│   │   ├── HistoryView.vue
│   │   └── HomeView.vue
│   ├── App.vue              # 根组件
│   ├── i18n.ts              # i18n 配置
│   └── main.ts              # 应用入口
├── types/                   # 全局类型声明 (非 src 下)
├── package.json
├── pnpm-lock.yaml
├── tailwind.config.ts
├── tsconfig.json
├── uno.config.ts
└── vite.config.ts           # 各环境 Vite 配置
```

## 关键规范说明 (Key Standards)

1.  **文件命名统一**：
    *   **TypeScript 文件**：使用 `camelCase` (如 `taskQueue.ts`, `driveSchemas.ts`)。
    *   **Vue 组件**：使用 `PascalCase` (如 `NodeList.vue`, `AppLayout.vue`)。
    *   **文件夹**：使用 `kebab-case` 或 `camelCase` 保持统一 (推荐 `camelCase` 与 TS 文件保持一致，或 `kebab-case` 语义清晰)。

2.  **模块划分**：
    *   **Background** 与 **Content** 保持独立目录，因为它们运行在不同的上下文环境。
    *   **Services** 目录存放纯逻辑服务，不包含 Vue 组件代码。
    *   **Composables** 存放 Vue 相关的逻辑复用代码。
