# mymd — 浏览器 Markdown 预览扩展设计文档

## 定位

开源 Chrome Markdown 预览扩展。目标：美观优雅、高度可定制、所有功能免费。每个用户都能通过配置打造自己的 Markdown 渲染器。

- 仓库：`chasey.myagi/mymd`（public）
- 浏览器：仅 Chrome（Manifest V3）
- 协议支持：`file://`、`http://`、`https://`
- 文件类型：`.md`、`.mkd`、`.mdx`、`.markdown`

## 架构

### 方案：完整页面接管

检测到 Markdown 文件后，用扩展内置的 `viewer.html` 完全接管页面渲染。

```
┌─────────────────────────────────────────────────────┐
│                  Background Service Worker           │
│  - 监听 webNavigation / webRequest                   │
│  - 检测 .md URL（file/http/https）                    │
│  - 重定向到 viewer.html?url=<encoded_url>            │
│  - 对 file:// 通过 content script 获取原始文本        │
│  - 管理设置存储（chrome.storage.sync）                │
│  - 文件监听（自动刷新）                               │
└────────────┬────────────────────────┬───────────────┘
             │                        │
     ┌───────▼────────┐     ┌────────▼──────────┐
     │  Content Script │     │   Viewer Page      │
     │  (最小化)       │     │  (viewer.html)     │
     │  - 提取 file:// │     │  - Svelte 应用     │
     │    页面原始文本  │     │  - 完整 UI 渲染    │
     │  - 发消息给 BG  │     │  - 主题引擎        │
     └────────────────┘     │  - 设置面板         │
                            └────────────────────┘
```

### 技术栈

| 层 | 技术 | 理由 |
|---|------|------|
| 框架 | Svelte + TypeScript | 编译后体积小，适合扩展 |
| 构建 | Vite + @crxjs/vite-plugin | 现代化构建，HMR 开发体验 |
| 解析 | markdown-it + 插件生态 | 插件最丰富，竞品验证 |
| 代码高亮 | Shiki | 支持所有 VS Code 主题，渲染精细 |
| 数学 | KaTeX | 轻量快速，渲染美观 |
| 图表 | Mermaid | 事实标准 |
| 存储 | chrome.storage.sync | 跨设备同步设置 |
| Manifest | V3 | Chrome 强制要求 |

### 数据流

```
用户打开 .md URL
  → Background SW 检测到 .md 文件
  → 重定向到 chrome-extension://xxx/viewer.html?url=<encoded>
  → Viewer 页面加载
  → 通过 fetch (http/https) 或 message (file://) 获取原始 Markdown
  → markdown-it 解析为 HTML
  → Shiki 处理代码块
  → KaTeX 处理数学公式
  → Mermaid 处理图表
  → 注入当前主题 CSS
  → 渲染到页面
```

## 功能详细设计

### 1. Markdown 渲染核心

**基础语法**：CommonMark 完整规范

**GFM 扩展**：
- 表格（含多行表格 multimd-table）
- 任务列表（checkbox）
- 删除线
- 自动链接

**扩展语法插件**：

| 语法 | 插件 | 说明 |
|------|------|------|
| Emoji | markdown-it-emoji | `:smile:` → 😄 |
| 上标 | markdown-it-sup | `^text^` |
| 下标 | markdown-it-sub | `~text~` |
| 脚注 | markdown-it-footnote | `[^1]` |
| 缩写 | markdown-it-abbr | `*[abbr]: full` |
| 高亮 | markdown-it-mark | `==text==` |
| 插入 | markdown-it-ins | `++text++` |
| 定义列表 | markdown-it-deflist | `term\n: definition` |
| 容器 | markdown-it-container | `:::warning` |
| Alerts | @mdit/plugin-alert | `> [!NOTE]` |
| TOC | markdown-it-table-of-contents | `[[toc]]` |
| 数学公式 | @traptitech/markdown-it-katex | `$inline$` `$$block$$` |
| Mermaid | 自定义插件 | ` ```mermaid ` |
| Wiki 链接 | 自定义插件 | `[[page]]` |

**代码高亮**：Shiki
- 支持所有 VS Code 主题
- 代码块可独立选择高亮主题
- 行号显示（可选）
- 复制按钮
- 按需加载策略：打包常用语言（JS/TS/Python/Go/Rust/Java/C/C++/Shell/JSON/YAML/HTML/CSS/SQL/Markdown），其余语言首次遇到时 lazy load

**数学公式**：KaTeX
- 行内公式 `$...$`
- 块级公式 `$$...$$`
- 公式编号与引用

**图表**：Mermaid
- 流程图、序列图、甘特图、类图、状态图、ER 图等

### 2. 阅读体验

**侧边栏大纲导航**：
- 自动从 h1-h6 标题生成
- 点击跳转，滚动时高亮当前位置
- 可折叠/展开
- 可切换显示/隐藏

**内容布局**：
- 内容居中显示
- 自定义内容宽度（滑块调节，默认 800px）
- 响应式适配

**字体调整**：
- 字体族选择（衬线/无衬线/等宽）
- 字体大小调节
- 行高调节

**主题系统**：
- 亮色/暗色/跟随系统
- 多套内置精品主题：
  - GitHub 风格
  - Typora 风格
  - 学术论文风格
  - 阅读器风格（护眼暖色调）
  - 极简风格
- 50+ CSS Custom Properties 设计变量
- CSS 变量微调面板（在设置中逐项调节）
- 自定义 CSS 编辑器（CodeMirror 6，~200KB，体积可接受）
- 主题导入/导出（JSON 格式，schema 见下方「主题 JSON Schema」章节）

**阅读辅助**：
- 阅读进度条（页面顶部）
- 回到顶部按钮
- 平滑滚动

### 3. 实用工具

**文档自动刷新**：
- 定时轮询文件变化（file:// 和 http/https 均支持，适用于本地 dev server 场景）
- 检测到变化后自动重新渲染
- 保持滚动位置

**源码查看**：
- 一键切换渲染视图 / 原始 Markdown 源码
- 源码也有语法高亮

**同目录文件列表**：
- 左侧栏展示当前 .md 文件所在目录的其他 .md 文件
- 仅平铺同级，不递归子目录
- 点击切换文件
- 仅 file:// 协议下可用
- 实现方式：Chrome 访问 `file:///path/to/dir/` 会返回目录列表 HTML 页面，通过 content script 在该页面中解析 `<a>` 标签提取 `.md` 文件列表。这是 best-effort 功能，依赖 Chrome 的目录列表行为，若 Chrome 未来移除此行为则降级隐藏该功能

**打印/PDF 优化**：
- 专用 `@media print` 样式
- 隐藏 UI 元素（侧栏、工具栏）
- 保留代码高亮和公式渲染

**文档内搜索**：
- 使用浏览器原生 Ctrl+F 搜索即可（扩展页面接管后，原生搜索可正常工作于渲染后内容）
- 不做自定义搜索 UI，避免不必要的复杂度

**图片缩放预览**：
- 点击图片放大查看
- 支持缩放和拖拽

### 4. 高级特性

**快捷键**：
- `Ctrl+Shift+O`：切换大纲
- `Ctrl+Shift+S`：切换源码
- `Ctrl+Shift+D`：切换暗色模式
- 可自定义

**滚动位置记忆**：
- 基于 URL 记录滚动位置
- 下次打开同一文件恢复位置
- 使用 chrome.storage.local

**YAML Frontmatter**：
- 解析并展示元数据（标题、作者、日期等）
- 可选显示/隐藏

**统计信息**：
- 字数统计
- 预估阅读时间
- 显示在工具栏

**链接处理**：
- 自动检测 URL 并变为可点击
- 相对路径链接在 file:// 下正确解析

## 页面布局

```
┌──────────────────────────────────────────────────────────┐
│  ◀ ▶ 文件名.md    🔍搜索  📊统计  📄源码  🎨主题  ⚙设置  │
├─────────┬──────────────────────────────────┬──────────────┤
│         │                                  │              │
│ 📁 文件  │                                  │ 📑 大纲      │
│         │                                  │              │
│ doc1.md │      Markdown 渲染内容            │ # 标题1      │
│ doc2.md │         （居中，可调宽度）          │  ## 标题1.1  │
│ doc3.md │                                  │  ## 标题1.2  │
│ readme  │                                  │ # 标题2      │
│         │                                  │              │
│         │                                  │              │
├─────────┴──────────────────────────────────┴──────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░ 阅读进度 35%        │
└──────────────────────────────────────────────────────────┘
```

- 左侧栏（文件列表）：仅 file:// 下显示，可折叠
- 右侧栏（大纲导航）：始终可用，可折叠
- 中间主内容区：Markdown 渲染
- 顶部工具栏：常用操作
- 底部进度条

## 设置存储结构

```typescript
interface MymdSettings {
  // 主题
  theme: string           // 主题名称
  colorMode: 'light' | 'dark' | 'system'
  customCSS: string       // 用户自定义 CSS
  cssVariables: Record<string, string>  // CSS 变量覆盖

  // 排版
  fontFamily: 'sans-serif' | 'serif' | 'monospace' | string
  fontSize: number        // px
  lineHeight: number
  contentWidth: number    // px

  // 功能开关
  autoRefresh: boolean
  autoRefreshInterval: number  // ms
  showOutline: boolean
  showFileList: boolean
  showProgressBar: boolean
  showStats: boolean
  rememberScrollPosition: boolean
  showFrontmatter: boolean

  // 快捷键
  shortcuts: Record<string, string>
}
```

存储策略：
- 小数据（设置项、功能开关等）：`chrome.storage.sync`，跨设备同步（总量 100KB，单项 8KB 限制）
- 大数据（customCSS、滚动位置记录等）：`chrome.storage.local`，不受容量限制

## 主题 JSON Schema

导入/导出的主题 JSON 格式：

```typescript
interface MymdTheme {
  name: string                          // 主题名
  version: number                       // schema 版本，当前 1
  colorMode: 'light' | 'dark'          // 适用的颜色模式
  cssVariables: Record<string, string>  // CSS 变量键值对
  customCSS?: string                    // 可选的额外 CSS
  codeTheme?: string                    // Shiki 代码高亮主题名
  fonts?: {
    body?: string
    heading?: string
    code?: string
  }
}
```

## 扩展权限

```json
{
  "manifest_version": 3,
  "permissions": [
    "activeTab",
    "storage",
    "webNavigation"
  ],
  "optional_permissions": [],
  "host_permissions": [
    "file:///*",
    "http://*/*",
    "https://*/*"
  ]
}
```

## 错误处理

- 文件不存在：显示友好的 404 页面
- 文件过大（>5MB）：警告并提供仅渲染前 N 行的选项
- 渲染错误（Mermaid/KaTeX 语法错误）：显示错误提示，不阻塞其他内容
- 网络错误（http/https）：显示重试按钮
- file:// 权限未开启：引导用户到 chrome://extensions 开启

## 测试策略

- **单元测试**：Vitest，测试 markdown-it 插件配置、主题引擎、设置管理
- **组件测试**：@testing-library/svelte，测试 UI 组件
- **E2E 测试**：Playwright，测试扩展完整流程
- **手动测试**：准备一套覆盖所有语法的测试 .md 文件
