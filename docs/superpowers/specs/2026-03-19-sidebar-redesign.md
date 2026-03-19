# 悬浮胶囊侧边栏 + 设置分离 — 设计文档

## 目标

重构 mymd 的交互模式：将侧边栏（大纲 + 文件列表）整合为左侧悬浮液态玻璃胶囊面板，将设置功能完全移到 Extension Popup 中，Viewer 页面只保留阅读时需要的操作。

## 架构变化

### 当前
```
Viewer 页面:
  FloatingPill (右侧) — 所有操作+设置入口
  SettingsPanel (全屏 overlay) — 6个设置子组件
  Outline (右侧固定侧栏 260px)
  FileList (左侧条件侧栏 240px)
  Popup — 快捷设置副本
```

### 重构后
```
Viewer 页面:
  FloatingPill (左侧) — 液态玻璃胶囊
    ├─ Tab: 目录 (Outline)
    ├─ Tab: 文件 (FileList)
    ├─ Source 切换按钮
    └─ 文件名 + 字数/阅读时间
  内容区占满宽度（无固定侧栏）

Popup:
  全部设置功能
    ├─ 主题选择 + 颜色模式
    ├─ 字体族/大小/行高
    ├─ 内容宽度
    ├─ 功能开关 (Auto Refresh, Progress Bar, Stats, Frontmatter)
    ├─ CSS 变量微调
    ├─ CSS 编辑器
    └─ 主题导入/导出
```

## 悬浮胶囊详细设计

### 收起态

- 尺寸：36×80px 圆角胶囊
- 位置：左侧，top 20%（或居中，实现时 A/B 对比选择）
- 视觉：液态玻璃（Apple Vision Pro 风格）
- 内容：单个 ☰ 图标
- 交互：
  - 默认 opacity 0.5，hover 升至 0.9 + 轻微 scale(1.05)
  - 呼吸动画 opacity 0.45↔0.65，6s 周期
  - 点击展开面板
- 支持 `prefers-reduced-motion`：关闭呼吸和 hover 动画

### 展开态

- 宽度：280px
- 最大高度：70vh
- 圆角：16px
- 视觉：液态玻璃
- 动画：scale(0.95→1) + opacity fade，0.2s ease-out
- 收起动画：scale(1→0.95) + fade，0.15s ease-in
- 点击外部 / Escape 收起

### 展开面板内部布局

```
┌─────────────────────────────────┐
│  📄 design.md                   │
│  1397 words · 6 min        [✕]  │
├─────────────────────────────────┤
│  [ 目录 ]  [ 文件 ]              │  ← pill tab 切换器
├─────────────────────────────────┤
│                                 │
│  设计文档：流程图表格优化方案      │  ← tab 内容区（可滚动）
│    背景                         │
│    目标                         │
│    设计方案                      │
│      配置简化                   │
│      流程图表格处理流程           │
│      关键变更                   │
│        1. 统一检测点...          │
│        2. 流程图列整图处理...     │
│        3. 文本列渲染策略          │
│      输出格式示例               │
│      ...                        │
│                                 │
├─────────────────────────────────┤
│  </> Source                     │  ← 底部操作
└─────────────────────────────────┘
```

### Pill Tab 切换器

- 两个连体圆角按钮：`目录` | `文件`
- 激活态：accent 色 tinted 背景 + accent 文字
- 非激活态：透明背景 + muted 文字
- 圆角：左 tab 左圆角 8px，右 tab 右圆角 8px
- 切换时 tab 内容区平滑过渡

### 文件 Tab 说明

- 仅 `file://` 协议时可用
- 非 `file://` 时：文件 tab 变灰不可点击，或隐藏只显示目录 tab
- 列出同目录下 `.md` 文件，当前文件高亮
- 点击切换文件

### Source 切换按钮

- 底部固定，不随 tab 内容滚动
- 点击切换渲染视图 ↔ 原始 Markdown 源码
- 激活态（Source 模式中）有视觉区分（accent 背景）

## 液态玻璃视觉规范

### 亮色模式
```css
background: rgba(255, 255, 255, 0.72);
backdrop-filter: blur(40px) saturate(180%);
-webkit-backdrop-filter: blur(40px) saturate(180%);
border: 0.5px solid rgba(255, 255, 255, 0.5);
box-shadow:
  0 8px 32px rgba(0, 0, 0, 0.08),
  inset 0 0 0 0.5px rgba(255, 255, 255, 0.3);
```

### 暗色模式
```css
background: rgba(30, 30, 30, 0.72);
backdrop-filter: blur(40px) saturate(180%);
-webkit-backdrop-filter: blur(40px) saturate(180%);
border: 0.5px solid rgba(255, 255, 255, 0.1);
box-shadow:
  0 8px 32px rgba(0, 0, 0, 0.3),
  inset 0 0 0 0.5px rgba(255, 255, 255, 0.05);
```

### 颜色模式检测
通过 `data-color-mode` 属性（主题引擎已设置）或 CSS 变量来区分亮/暗模式。

## Popup 设置扩展

### 新增内容（从 Viewer SettingsPanel 迁移）

当前 Popup 已有：主题选择、颜色模式、4 个功能开关、字体大小、内容宽度。

需要新增：
1. **字体族选择** — dropdown（系统无衬线/衬线/等宽）
2. **行高调节** — stepper（1.2-2.0，步长 0.1）
3. **CSS 变量微调** — 简化版，只列出最常用的 8-10 个颜色变量（不是全部 30+）
4. **CSS 编辑器** — textarea 或简单的 `<code contenteditable>`（CodeMirror 在 popup 300px 内太重）
5. **主题导入/导出** — 两个按钮
6. **Frontmatter 开关** — checkbox
7. **记住滚动位置开关** — checkbox

### Popup 布局调整

Popup 高度可能需要增加（可滚动），或使用折叠分组：
```
┌─ 外观 ─────────────────────────┐
│  Theme / Mode / Font / Size... │
├─ 功能 ─────────────────────────┤
│  Outline / Refresh / Stats...  │
├─ 高级 ─────────────────────────┤
│  CSS Variables / Custom CSS... │
│  Import / Export               │
└────────────────────────────────┘
```

## 需要删除的文件

- `src/viewer/components/settings/SettingsPanel.svelte`
- `src/viewer/components/settings/ThemeSelector.svelte`
- `src/viewer/components/settings/FontSettings.svelte`
- `src/viewer/components/settings/LayoutSettings.svelte`
- `src/viewer/components/settings/CSSEditor.svelte`
- `src/viewer/components/settings/CSSVariables.svelte`
- `src/viewer/components/Toolbar.svelte`（已是死代码）

## 需要改造的文件

- `src/viewer/components/FloatingPill.svelte` — 完全重写，左侧，内嵌 Outline + FileList + Source
- `src/viewer/App.svelte` — 移除固定侧栏和 SettingsPanel，内容区全宽
- `src/viewer/components/Outline.svelte` — 从独立侧栏改为嵌入胶囊面板的组件
- `src/viewer/components/FileList.svelte` — 同上，移除 aside 包裹
- `src/popup/Popup.svelte` — 扩展设置功能

## 同时修复的 Code Review 问题

利用此次重构一并修复：
- **C1**: DOMPurify `style` 白名单 → 移除
- **C2**: Shiki `$` 字符替换 → 用函数形式 replace
- **C3**: LIST_DIRECTORY SSRF → 限制只允许 `file://`
- **I1**: Font/Layout 设置不生效 → 在 reactive 块中写入 CSS 变量
- **I2**: applyCustomCSS 未调用 → 在 reactive 块中调用
- **I6**: 缺失的 CSS 变量 → 在 base.css 或主题中补全
- **I7**: print.css 漏掉 floating-pill → 补上
