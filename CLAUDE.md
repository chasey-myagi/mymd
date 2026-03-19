# mymd

Open-source Chrome Markdown preview extension. Svelte 4 + TypeScript + Vite + CRXJS.

## Design Context

### Users
开发者、技术写作者、笔记爱好者。他们在浏览器中打开 .md 文件时，期望看到美观、可定制的渲染效果，而非原始文本。使用场景：阅读本地文档、预览 GitHub raw 文件、浏览技术笔记。

### Brand Personality
**现代 · 灵活 · 开放**

mymd 不是一个固执己见的渲染器，而是一个高度可定制的画布。默认优雅克制，但通过主题和自定义 CSS，用户可以做出任何风格——从极简到赛博朋克。开源精神贯穿始终。

### Aesthetic Direction

**默认风格：精致优雅（Notion/Typora 级别）**
- 大量留白，内容为王
- 细腻的阴影、圆角、微妙的 hover 过渡
- 专业但不无聊，精致但不花哨

**主题矩阵（全部通过主题切换）：**

| 主题类别 | 参考 | 特点 |
|---------|------|------|
| 极简克制 | iA Writer, Bear | 大留白，极少装饰 |
| 精致优雅 | Notion, Typora | 细腻阴影，高级感（默认） |
| 专业技术 | GitHub, VS Code | 紧凑信息密度，开发者友好 |
| 温暖亲和 | Obsidian 暖色主题 | 柔和配色，护眼，长时间阅读 |
| 创意趣味（扩展）| 复古风、像素风、手写风、赛博朋克 | 通过自定义 CSS 或社区主题实现 |

**参考应用：**
- Notion: 干净排版、优雅交互细节、流畅动效
- Typora: 沉浸感、丰富主题生态
- Obsidian: 强大自定义、社区主题、暗色模式出色

**反面参考（绝对不要）：**
- 不要死板：不能像 Word/PDF 那样无趣白底黑字
- 不要拥挤：信息密度适中，工具栏按钮精简
- 不要廉价感：不要粗糙边框、不协调颜色、低质量图标
- 默认不花哨：动画和装饰保持克制，花哨效果留给用户自定义

### Design Principles

1. **内容优先（Content First）**：所有 UI 元素为内容服务，阅读区是绝对主角。工具栏、侧栏都是配角，可隐藏。
2. **优雅默认，无限可能（Elegant Default, Infinite Possibility）**：开箱即用就要好看，但通过 CSS 变量、主题、自定义 CSS，可以变成任何样子。
3. **减法设计（Less is More）**：每个视觉元素都必须有存在的理由。宁可少一个装饰，不可多一个噪音。
4. **一致性（Consistency）**：间距、圆角、阴影、颜色在同一主题内保持数学一致性。使用 CSS 变量确保全局协调。
5. **尊重用户（Respect the User）**：不要强迫审美，提供选择。暗色/亮色/跟随系统，宽/窄内容，显示/隐藏一切 UI 元素。

### Design Tokens (CSS Variables)

项目使用 `--mymd-*` 前缀的 CSS 变量体系，覆盖颜色、间距、圆角、阴影等 30+ 变量。所有视觉样式必须通过变量引用，不使用硬编码值。详见 `src/lib/theme/variables.ts`。

### Typography Scale

- Base: 16px, line-height 1.6
- h1: 2em, h2: 1.5em, h3: 1.25em, h4: 1.05em
- Code: 0.875em, monospace
- Small text (sidebar, stats): 0.75-0.8rem

### Spacing System

基于 rem 和 em，与字体大小成比例。内容区 padding 2rem，组件间距 0.5-1rem。

### Transition Defaults

- 快速交互（hover, focus）: 0.15s ease
- 面板展开/折叠: 0.2s ease
- 避免不必要的动画，尊重 prefers-reduced-motion
