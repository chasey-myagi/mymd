# 悬浮胶囊侧边栏重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将侧边栏整合为左侧悬浮液态玻璃胶囊面板，设置移到 Popup，修复 code review 发现的安全和功能问题。

**Architecture:** 两条并行线——Line A（主线 UI 重构：胶囊面板 → App 清理 → Popup 扩展）和 Line B（独立 bugfix：安全修复 + 功能修复）。Line A 触碰 FloatingPill/App/Outline/FileList/Popup，Line B 触碰 renderer/background/engine/base.css/print.css。文件不重叠，可并行。

**Tech Stack:** Svelte 4, CSS backdrop-filter, chrome.storage API

---

## File Structure Changes

```
修改:
  src/viewer/components/FloatingPill.svelte  — 完全重写（左侧液态玻璃胶囊+Tab面板）
  src/viewer/components/Outline.svelte       — 简化为纯列表组件（移除 aside 包裹）
  src/viewer/components/FileList.svelte      — 简化为纯列表组件（移除 aside 包裹）
  src/viewer/App.svelte                      — 移除固定侧栏/SettingsPanel，内容全宽
  src/popup/Popup.svelte                     — 扩展为完整设置面板（折叠分组）
  src/lib/markdown/renderer.ts               — bugfix: DOMPurify style, Shiki $ replace
  src/lib/theme/engine.ts                    — bugfix: applyCustomCSS 调用
  src/background/index.ts                    — bugfix: LIST_DIRECTORY URL 验证
  src/viewer/styles/base.css                 — bugfix: 补全缺失 CSS 变量默认值
  src/viewer/styles/print.css                — bugfix: 隐藏 floating-pill
  src/viewer/styles/content.css              — 移除固定侧栏相关样式

删除:
  src/viewer/components/settings/SettingsPanel.svelte
  src/viewer/components/settings/ThemeSelector.svelte
  src/viewer/components/settings/FontSettings.svelte
  src/viewer/components/settings/LayoutSettings.svelte
  src/viewer/components/settings/CSSEditor.svelte
  src/viewer/components/settings/CSSVariables.svelte
  src/viewer/components/Toolbar.svelte
```

---

## Line B: 独立 Bugfix（可与 Line A 并行）

### Task B1: Security + Renderer Fixes

**Files:**
- Modify: `src/lib/markdown/renderer.ts`
- Modify: `src/background/index.ts`

- [ ] **Step 1: Fix DOMPurify style whitelist (C1)**

在 `src/lib/markdown/renderer.ts` 中，从 `ADD_ATTR` 移除 `'style'`。Shiki 输出的 inline style 需要保留——解决方案：DOMPurify 在 Shiki 替换之后执行（当前已是此顺序），但 sanitize 会清除 Shiki 的 `<span style="color:...">`。需要用 DOMPurify hook 只允许 `<span>` 上的 `color`/`background-color` style：

```typescript
import DOMPurify from 'dompurify'

// 在 renderMarkdown 函数中，sanitize 前添加 hook:
DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  if (data.attrName === 'style' && node.tagName === 'SPAN') {
    // Only allow color and background-color for Shiki spans
    const clean = data.attrValue
      .split(';')
      .filter(s => /^\s*(color|background-color)\s*:/.test(s))
      .join(';')
    data.attrValue = clean
    data.forceKeepAttr = true
  }
})

const sanitized = DOMPurify.sanitize(html, {
  ADD_TAGS: ['math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'msqrt', 'mover', 'munder', 'munderover', 'mtable', 'mtr', 'mtd', 'annotation'],
  ADD_ATTR: ['xmlns', 'encoding', 'class', 'id', 'href', 'target', 'rel'],
})

DOMPurify.removeHook('uponSanitizeAttribute')
return sanitized
```

- [ ] **Step 2: Fix Shiki $ character replacement (C2)**

在 `src/lib/markdown/renderer.ts` 的 `renderMarkdown` 函数中：

```typescript
// 改：
html = html.replace(match[0], highlighted)
// 为：
html = html.replace(match[0], () => highlighted)
```

- [ ] **Step 3: Fix LIST_DIRECTORY SSRF (C3)**

在 `src/background/index.ts` 的 `LIST_DIRECTORY` handler 中添加验证：

```typescript
if (message.type === 'LIST_DIRECTORY') {
  try {
    const url = new URL(message.url)
    if (url.protocol !== 'file:') {
      sendResponse({ success: false, error: 'Only file:// URLs allowed for directory listing' })
      return true
    }
  } catch {
    sendResponse({ success: false, error: 'Invalid URL' })
    return true
  }
  fetch(message.url)
    .then(res => res.text())
    .then(html => sendResponse({ success: true, html }))
    .catch(err => sendResponse({ success: false, error: err.message }))
  return true
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test:run
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/markdown/renderer.ts src/background/index.ts
git commit -m "security: fix DOMPurify style bypass, Shiki $ replacement, LIST_DIRECTORY SSRF"
```

### Task B2: CSS Variable Defaults + Print Fix

**Files:**
- Modify: `src/viewer/styles/base.css`
- Modify: `src/viewer/styles/print.css`

- [ ] **Step 1: Add missing CSS variable defaults in base.css**

在 `html, body` 或 `:root` 选择器中添加缺失的变量默认值：

```css
:root {
  --mymd-text-muted: #656d76;
  --mymd-surface: #f6f8fa;
  --mymd-hover: rgba(0, 0, 0, 0.04);
  --mymd-font-mono: ui-monospace, 'SF Mono', 'Cascadia Code', monospace;
  --mymd-font-heading: inherit;
  --mymd-font-code: var(--mymd-font-mono);
  --mymd-code-block-bg: var(--mymd-code-bg, #f6f8fa);
  --mymd-radius: 6px;
  --mymd-mark-text: inherit;
}
```

- [ ] **Step 2: Add floating-pill to print.css hide list**

```css
.toolbar, .sidebar, .sidebar-left, .sidebar-right,
.progress-bar, .scroll-top, .settings-overlay, .image-overlay,
.floating-pill {
  display: none !important;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/viewer/styles/base.css src/viewer/styles/print.css
git commit -m "fix: add missing CSS variable defaults and hide floating pill in print"
```

---

## Line A: 主线 UI 重构

### Task A1: 简化 Outline 和 FileList 为纯列表组件

**Files:**
- Modify: `src/viewer/components/Outline.svelte`
- Modify: `src/viewer/components/FileList.svelte`

- [ ] **Step 1: Simplify Outline.svelte**

移除独立侧栏的包裹，变为纯列表组件（由 FloatingPill 嵌入）。移除 scoped CSS 中的 sidebar 相关样式，保留列表和 IntersectionObserver 逻辑。

关键变化：
- 移除外层 `<nav class="outline">` 和 `<h3 class="outline-title">` — FloatingPill 提供标题
- 导出组件为纯 `<ul>` 列表
- 保留 IntersectionObserver 和 scrollTo 逻辑
- 保留缩进和 active 高亮样式（用 scoped CSS）

- [ ] **Step 2: Simplify FileList.svelte**

移除 `<aside>` 包裹和 `<nav>` / `<h3>` 标题。变为纯列表组件。

关键变化：
- 移除 `export let show` prop（FloatingPill 控制 tab 可见性）
- 移除 `<aside class="sidebar sidebar-left">` 包裹
- 保留 `files` 加载逻辑和 `openFile` 函数
- 导出 `files` 数组长度供 FloatingPill 判断 tab 是否可用

FileList 内部加载文件列表，通过 Svelte dispatch 通知外部文件数量：

```svelte
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import { documentState } from '../stores/document'
  import { parseDirectoryListing } from '../../lib/file-list'

  const dispatch = createEventDispatcher()
  let files: string[] = []

  $: currentFile = decodeURIComponent($documentState.url.split('/').pop() ?? '')
  $: isFileProtocol = $documentState.url.startsWith('file://')

  onMount(async () => {
    if (!isFileProtocol) return
    const dirUrl = $documentState.url.substring(0, $documentState.url.lastIndexOf('/') + 1)
    try {
      const response = await new Promise<{ success: boolean; html?: string }>((resolve) => {
        chrome.runtime.sendMessage({ type: 'LIST_DIRECTORY', url: dirUrl }, resolve)
      })
      if (response.success && response.html) {
        files = parseDirectoryListing(response.html)
      }
    } catch { files = [] }
    dispatch('loaded', { count: files.length })
  })

  function openFile(filename: string) {
    const dirUrl = $documentState.url.substring(0, $documentState.url.lastIndexOf('/') + 1)
    const viewerUrl = chrome.runtime.getURL('src/viewer/index.html')
    window.location.href = `${viewerUrl}?url=${encodeURIComponent(dirUrl + filename)}`
  }
</script>

{#if files.length > 0}
  <ul class="file-items">
    {#each files as file}
      <li class:active={file === currentFile}>
        <button on:click={() => openFile(file)}>{file}</button>
      </li>
    {/each}
  </ul>
{:else}
  <div class="empty-state">No markdown files in this directory</div>
{/if}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add src/viewer/components/Outline.svelte src/viewer/components/FileList.svelte
git commit -m "refactor: simplify Outline and FileList into pure list components"
```

### Task A2: 重写 FloatingPill 为左侧液态玻璃胶囊

**Files:**
- Modify: `src/viewer/components/FloatingPill.svelte` (完全重写)

- [ ] **Step 1: Rewrite FloatingPill.svelte**

完全重写组件。核心结构：

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { documentState } from '../stores/document'
  import { showSource } from '../stores/ui'
  import Outline from './Outline.svelte'
  import FileList from './FileList.svelte'

  let expanded = false
  let activeTab: 'outline' | 'files' = 'outline'
  let isClosing = false
  let pillEl: HTMLElement
  let fileCount = 0

  $: fileName = decodeURIComponent($documentState.url.split('/').pop() ?? '')
  $: stats = `${$documentState.wordCount} words · ${$documentState.readingTime} min`
  $: isFileProtocol = $documentState.url.startsWith('file://')
  $: canShowFiles = isFileProtocol && fileCount > 0

  function toggle() {
    if (expanded) close()
    else expanded = true
  }

  function close() {
    isClosing = true
    setTimeout(() => { expanded = false; isClosing = false }, 160)
  }

  function handleClickOutside(e: MouseEvent) {
    if (expanded && pillEl && !pillEl.contains(e.target as Node)) close()
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && expanded) close()
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleKeydown)
  })

  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleKeydown)
  })
</script>

<div class="glass-pill" class:expanded class:closing={isClosing} bind:this={pillEl}>
  {#if !expanded && !isClosing}
    <button class="pill-handle" on:click={toggle} title="Open sidebar" aria-label="Open sidebar">
      <span class="pill-icon">☰</span>
    </button>
  {/if}

  {#if expanded || isClosing}
    <div class="pill-panel">
      <!-- Header: file info -->
      <div class="panel-header">
        <div class="file-info">
          <span class="file-name">{fileName}</span>
          <span class="file-stats">{stats}</span>
        </div>
        <button class="close-btn" on:click={close}>✕</button>
      </div>

      <!-- Tab switcher -->
      <div class="tab-bar">
        <button
          class="tab-btn"
          class:active={activeTab === 'outline'}
          on:click={() => activeTab = 'outline'}
        >目录</button>
        <button
          class="tab-btn"
          class:active={activeTab === 'files'}
          disabled={!isFileProtocol}
          on:click={() => { if (isFileProtocol) activeTab = 'files' }}
        >文件</button>
      </div>

      <!-- Tab content -->
      <div class="tab-content">
        {#if activeTab === 'outline'}
          <Outline />
        {:else}
          <FileList on:loaded={(e) => fileCount = e.detail.count} />
        {/if}
      </div>

      <!-- Bottom: Source toggle -->
      <div class="panel-footer">
        <button
          class="source-btn"
          class:active={$showSource}
          on:click={() => showSource.update(v => !v)}
        >
          &lt;/&gt; Source
        </button>
      </div>
    </div>
  {/if}
</div>
```

- [ ] **Step 2: Add liquid glass CSS**

All scoped in `<style>`:

```css
.glass-pill {
  position: fixed;
  left: 16px;
  top: 20%;
  z-index: 100;
}

/* === Collapsed handle === */
.pill-handle {
  width: 36px;
  height: 80px;
  border-radius: 18px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Liquid glass - light mode default */
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 0.5px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), inset 0 0 0 0.5px rgba(255, 255, 255, 0.3);
  opacity: 0.5;
  transition: opacity 0.2s, transform 0.2s;
  animation: breathe 6s ease-in-out infinite;
}

.pill-handle:hover {
  opacity: 0.95;
  transform: scale(1.05);
  animation-play-state: paused;
}

.pill-icon {
  font-size: 16px;
  color: var(--mymd-text, #333);
}

@keyframes breathe {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 0.65; }
}

/* === Expanded panel === */
.pill-panel {
  width: 280px;
  max-height: 70vh;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* Liquid glass */
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 0.5px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), inset 0 0 0 0.5px rgba(255, 255, 255, 0.3);
  animation: panel-in 0.2s ease-out;
}

.closing .pill-panel {
  animation: panel-out 0.15s ease-in forwards;
}

@keyframes panel-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes panel-out {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.95); }
}

/* Dark mode overrides */
:global([data-color-mode="dark"]) .pill-handle,
:global([data-color-mode="dark"]) .pill-panel {
  background: rgba(30, 30, 30, 0.72);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 0 0.5px rgba(255, 255, 255, 0.05);
}

/* === Panel sections === */
.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.06);
}

.file-info { display: flex; flex-direction: column; gap: 2px; }
.file-name { font-size: 13px; font-weight: 600; color: var(--mymd-text); }
.file-stats { font-size: 11px; color: var(--mymd-text-muted, #888); }
.close-btn {
  background: none; border: none; cursor: pointer;
  color: var(--mymd-text-muted, #888); font-size: 14px; padding: 2px 4px;
}

/* Tab bar */
.tab-bar {
  display: flex;
  padding: 8px 16px;
  gap: 0;
}

.tab-btn {
  flex: 1;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--mymd-border, #ddd);
  background: transparent;
  color: var(--mymd-text-muted, #888);
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn:first-child { border-radius: 8px 0 0 8px; }
.tab-btn:last-child { border-radius: 0 8px 8px 0; margin-left: -1px; }

.tab-btn.active {
  background: color-mix(in srgb, var(--mymd-link, #0969da) 12%, transparent);
  color: var(--mymd-link, #0969da);
  border-color: var(--mymd-link, #0969da);
  z-index: 1;
}

.tab-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Tab content */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px;
}

/* Footer */
.panel-footer {
  padding: 8px 16px;
  border-top: 0.5px solid rgba(0, 0, 0, 0.06);
}

.source-btn {
  width: 100%;
  padding: 6px;
  border: 1px solid var(--mymd-border, #ddd);
  border-radius: 8px;
  background: transparent;
  color: var(--mymd-text-muted, #888);
  font-size: 12px;
  cursor: pointer;
  font-family: var(--mymd-font-mono, monospace);
  transition: all 0.15s;
}

.source-btn.active {
  background: color-mix(in srgb, var(--mymd-link) 12%, transparent);
  color: var(--mymd-link);
  border-color: var(--mymd-link);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .pill-handle { animation: none; }
  .pill-panel { animation: none; }
  .closing .pill-panel { animation: none; opacity: 0; }
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add src/viewer/components/FloatingPill.svelte
git commit -m "feat: rewrite FloatingPill as left-side liquid glass capsule with tab panel"
```

### Task A3: 清理 App.svelte — 移除固定侧栏和 SettingsPanel

**Files:**
- Modify: `src/viewer/App.svelte`
- Delete: `src/viewer/components/settings/` (entire directory)
- Delete: `src/viewer/components/Toolbar.svelte`
- Modify: `src/viewer/styles/content.css`

- [ ] **Step 1: Update App.svelte**

关键变化：
- 移除 `import SettingsPanel`、`import Outline`、`import FileList` (FloatingPill 内嵌它们)
- 移除 `showOutline`、`showFileList`、`showSettings` store 引用
- 移除固定侧栏 `<aside>` 元素
- 移除 `<SettingsPanel />`
- 内容区 `.layout` 简化为只有 `<main>` 全宽
- 更新 `handleKeydown`：移除 `Ctrl+Shift+O`（大纲现在在胶囊内，不需要独立开关），保留 `Ctrl+Shift+S`（Source）和 `Ctrl+Shift+D`（暗色模式）
- 添加 font/layout/customCSS 的 CSS 变量应用（I1、I2 修复）
- 添加 `applyCustomCSS` 调用（从 `'../lib/theme/engine'` 导入）
- 添加 `loadSettings`（从 `'../lib/storage'` 导入）用于 storage change 监听
- 添加 `chrome.storage.onChanged` 监听实时同步 Popup 设置变更

```svelte
<!-- 新的 layout 结构 -->
<div class="layout">
  <main class="main-content" bind:this={mainContent} on:scroll={handleScroll}>
    {#if $showSource}
      <SourceView />
    {:else}
      <FrontmatterBanner />
      <MarkdownContent />
    {/if}
  </main>
</div>
<FloatingPill />
<ImagePreview />
```

在 reactive 块中补上 I1 和 I2 修复：

```typescript
$: {
  const mode = resolveColorMode($settings.colorMode)
  const theme = getTheme($settings.theme, mode)
  applyTheme(theme, $settings.cssVariables)
  applyCustomCSS($settings.customCSS)
  // Apply user typography/layout settings
  const el = document.documentElement
  el.style.setProperty('--mymd-font-family', $settings.fontFamily)
  el.style.setProperty('--mymd-font-size', $settings.fontSize + 'px')
  el.style.setProperty('--mymd-line-height', String($settings.lineHeight))
  el.style.setProperty('--mymd-content-width', $settings.contentWidth + 'px')
}
```

在 onMount 中添加 storage change 监听：

```typescript
// Sync settings from Popup in real-time
const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
  loadSettings().then(s => settings.set(s))
}
if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener(storageListener)
}
```

- [ ] **Step 2: Delete settings components + Toolbar**

```bash
rm -rf src/viewer/components/settings/
rm src/viewer/components/Toolbar.svelte
```

- [ ] **Step 3: Clean up content.css**

移除 `.sidebar`、`.sidebar-left`、`.sidebar-right`、`.settings-overlay`、`.settings-panel` 相关 CSS 规则。`.layout` 简化为不再是 flex 三栏。

- [ ] **Step 4: Verify build**

```bash
pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove fixed sidebars and settings panel, wire font/css settings"
```

### Task A4: 扩展 Popup 为完整设置面板

**Files:**
- Modify: `src/popup/Popup.svelte`

- [ ] **Step 1: Rewrite Popup with collapsible sections**

扩展现有 Popup，新增：
- 字体族选择 dropdown
- 行高 stepper
- Frontmatter 开关、记住滚动位置开关
- 折叠分组（外观 / 功能 / 高级）
- CSS 变量微调（top 8 颜色变量 with `<input type="color">`）
- Custom CSS textarea
- 主题导入/导出按钮

布局：
```
┌──────────────────────────────────┐
│ M  mymd · Markdown Preview       │
├─ 外观 ──────────────────── [▼] ──┤
│  Theme:    [Github         ▼]    │
│  Mode:     [Light][Dark][Auto]   │
│  Font:     [System Sans    ▼]    │
│  Size:     [- 16px +]            │
│  Height:   [- 1.6  +]           │
│  Width:    [- 800px +]           │
├─ 功能 ──────────────────── [▼] ──┤
│  ☑ Auto Outline                  │
│  ☑ Auto Refresh                  │
│  ☑ Progress Bar                  │
│  ☑ Stats                         │
│  ☑ Frontmatter                   │
│  ☑ Remember Scroll Position      │
├─ 高级 ──────────────────── [▶] ──┤
│  (collapsed by default)          │
│  CSS Variables (8 color pickers) │
│  Custom CSS (textarea)           │
│  [⬆ Import] [⬇ Export]          │
├──────────────────────────────────┤
│  [Full Settings]  [Test Page]    │
└──────────────────────────────────┘
```

每个 section header 可点击折叠/展开，用 CSS transition `max-height`。

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/popup/Popup.svelte
git commit -m "feat: expand popup to full settings panel with collapsible sections"
```

### Task A5: 最终验证 + Agent-Browser 测试

- [ ] **Step 1: Run all tests**

```bash
pnpm test:run
```

- [ ] **Step 2: Build and test with agent-browser**

```bash
pnpm build
kill $(lsof -ti:8765) 2>/dev/null
cp tests/fixtures/test-full.md dist/
cd dist && python3 -m http.server 8765 &
sleep 1
# 测试正常渲染
agent-browser open "http://localhost:8765/src/viewer/index.html?url=http://localhost:8765/test-full.md"
agent-browser wait 5000
agent-browser screenshot /tmp/mymd-final-render.png
# 测试胶囊展开
agent-browser click "☰"
agent-browser wait 500
agent-browser screenshot /tmp/mymd-final-pill.png
# 测试 source 视图
agent-browser find text "Source" click
agent-browser wait 1000
agent-browser screenshot /tmp/mymd-final-source.png
# 清理
agent-browser close
kill $(lsof -ti:8765) 2>/dev/null
```

- [ ] **Step 3: Final commit + push**

```bash
git push
```
