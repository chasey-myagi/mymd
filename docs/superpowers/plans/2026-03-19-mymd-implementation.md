# mymd Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an open-source Chrome Markdown preview extension with rich syntax support, premium themes, and high customizability.

**Architecture:** Chrome MV3 extension using full page takeover — Background Service Worker detects .md URLs and redirects to an internal viewer.html page. The viewer is a Svelte app that renders Markdown via markdown-it with Shiki/KaTeX/Mermaid, wrapped in a customizable theme engine.

**Tech Stack:** Svelte 4 + TypeScript, Vite + CRXJS, markdown-it + plugins, Shiki, KaTeX, Mermaid, CodeMirror 6

> **Svelte 版本决策：使用 Svelte 4**。CRXJS 对 Svelte 5 的支持尚不成熟，且 Svelte 4 的 `$:` / `export let` 语法在浏览器扩展场景下更稳定。所有组件使用 Svelte 4 API。

---

## File Structure

```
mymd/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── svelte.config.js
├── manifest.json
├── src/
│   ├── types.ts                          # Shared TypeScript types
│   ├── background/
│   │   └── index.ts                      # Service Worker: URL detection, redirection
│   ├── content/
│   │   └── index.ts                      # Content script: extract file:// raw text
│   ├── viewer/
│   │   ├── index.html                    # Viewer page HTML entry
│   │   ├── main.ts                       # Svelte app bootstrap
│   │   ├── App.svelte                    # Root layout: toolbar + sidebars + content
│   │   ├── components/
│   │   │   ├── Toolbar.svelte            # Top bar: file name, actions, theme toggle
│   │   │   ├── Outline.svelte            # Right sidebar: TOC navigation
│   │   │   ├── FileList.svelte           # Left sidebar: same-dir .md files
│   │   │   ├── MarkdownContent.svelte    # Main rendered markdown display
│   │   │   ├── SourceView.svelte         # Raw markdown source with highlighting
│   │   │   ├── ProgressBar.svelte        # Reading progress bar
│   │   │   ├── ScrollTop.svelte          # Back to top button
│   │   │   ├── ImagePreview.svelte       # Click-to-zoom image overlay
│   │   │   ├── FrontmatterBanner.svelte  # YAML metadata display
│   │   │   ├── ErrorPage.svelte          # Error states (404, network, permission)
│   │   │   └── settings/
│   │   │       ├── SettingsPanel.svelte   # Settings drawer/modal
│   │   │       ├── ThemeSelector.svelte   # Theme picker grid
│   │   │       ├── FontSettings.svelte    # Font family/size/line-height controls
│   │   │       ├── LayoutSettings.svelte  # Content width, sidebar toggles
│   │   │       ├── CSSEditor.svelte       # Custom CSS with CodeMirror 6
│   │   │       └── CSSVariables.svelte    # Variable tuning sliders
│   │   ├── stores/
│   │   │   ├── settings.ts               # Reactive settings (synced to chrome.storage)
│   │   │   ├── document.ts               # Current doc state (url, raw, html, headings)
│   │   │   └── ui.ts                     # UI state (panels open/closed, view mode)
│   │   └── styles/
│   │       ├── base.css                  # Reset + base markdown styles
│   │       ├── content.css               # Rendered content typography
│   │       └── print.css                 # @media print overrides
│   ├── lib/
│   │   ├── markdown/
│   │   │   ├── renderer.ts              # markdown-it instance with all plugins
│   │   │   ├── plugins/
│   │   │   │   ├── mermaid.ts           # Custom fence → <div class="mermaid">
│   │   │   │   └── wikilink.ts          # [[page]] → <a> link
│   │   │   └── highlighter.ts           # Shiki setup with lazy-load strategy
│   │   ├── theme/
│   │   │   ├── engine.ts                # Apply theme, manage CSS variables
│   │   │   ├── variables.ts             # CSS variable definitions + defaults
│   │   │   └── themes/
│   │   │       ├── index.ts             # Theme registry
│   │   │       ├── github.ts            # GitHub style
│   │   │       ├── typora.ts            # Typora style
│   │   │       ├── academic.ts          # Academic paper style
│   │   │       ├── reader.ts            # Warm reading style
│   │   │       └── minimal.ts           # Minimal clean style
│   │   ├── storage.ts                   # Chrome storage wrapper (sync + local)
│   │   ├── frontmatter.ts              # YAML frontmatter parser
│   │   ├── stats.ts                    # Word count + reading time
│   │   └── file-list.ts               # Parse Chrome directory listing
│   └── assets/
│       └── icons/
│           ├── icon16.png
│           ├── icon48.png
│           └── icon128.png
├── tests/
│   ├── lib/
│   │   ├── markdown/
│   │   │   ├── renderer.test.ts
│   │   │   ├── mermaid-plugin.test.ts
│   │   │   └── wikilink-plugin.test.ts
│   │   ├── theme/
│   │   │   └── engine.test.ts
│   │   ├── storage.test.ts
│   │   ├── frontmatter.test.ts
│   │   ├── stats.test.ts
│   │   └── file-list.test.ts
│   └── fixtures/
│       ├── test-full.md                # Comprehensive markdown test file
│       └── dir-listing.html            # Mock Chrome directory listing
└── docs/
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `svelte.config.js`
- Create: `manifest.json`
- Create: `src/viewer/index.html`
- Create: `src/viewer/main.ts`
- Create: `src/viewer/App.svelte`
- Create: `src/background/index.ts`
- Create: `src/content/index.ts`
- Create: `.gitignore`

- [ ] **Step 1: Initialize package.json**

```json
{
  "name": "mymd",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 2: Install core dependencies**

```bash
cd /Users/chasey/Dev/browser-extensions/mymd
pnpm init # if package.json needs reset
pnpm add svelte markdown-it katex mermaid
pnpm add -D vite @sveltejs/vite-plugin-svelte typescript svelte-check vitest @crxjs/vite-plugin@beta
pnpm add -D @types/markdown-it @types/katex
```

Note: `@crxjs/vite-plugin@beta` supports MV3. If it has issues, fall back to `vite-plugin-web-extension`.

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [
    svelte(),
    crx({ manifest }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "types": ["svelte", "chrome", "vitest/globals"],
    "paths": {
      "@/*": ["./src/*"]
    },
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 5: Create svelte.config.js**

```javascript
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  preprocess: vitePreprocess(),
}
```

- [ ] **Step 6: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "mymd",
  "description": "Beautiful, customizable Markdown preview for your browser",
  "version": "0.1.0",
  "icons": {
    "16": "src/assets/icons/icon16.png",
    "48": "src/assets/icons/icon48.png",
    "128": "src/assets/icons/icon128.png"
  },
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["file:///*"],
      "include_globs": ["*.md", "*.mkd", "*.mdx", "*.markdown"],
      "js": ["src/content/index.ts"],
      "run_at": "document_end"
    }
  ],
  "permissions": [
    "activeTab",
    "storage",
    "webNavigation"
  ],
  "host_permissions": [
    "file:///*",
    "http://*/*",
    "https://*/*"
  ]
}
```

- [ ] **Step 7: Create minimal stub files**

`src/background/index.ts`:
```typescript
console.log('[mymd] Background service worker loaded')
```

`src/content/index.ts`:
```typescript
console.log('[mymd] Content script loaded')
```

`src/viewer/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>mymd</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

`src/viewer/main.ts`:
```typescript
import App from './App.svelte'

const app = new App({
  target: document.getElementById('app')!,
})

export default app
```

`src/viewer/App.svelte`:
```svelte
<script lang="ts">
  let message = 'mymd — Markdown Preview'
</script>

<main>
  <h1>{message}</h1>
</main>
```

- [ ] **Step 8: Create .gitignore**

```
node_modules/
dist/
.superpowers/
*.local
```

- [ ] **Step 9: Verify build works**

Run: `cd /Users/chasey/Dev/browser-extensions/mymd && pnpm build`
Expected: Build succeeds, `dist/` directory created with extension files.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold mymd Chrome extension project"
```

---

## Task 2: Shared Types & Storage Layer

**Files:**
- Create: `src/types.ts`
- Create: `src/lib/storage.ts`
- Create: `tests/lib/storage.test.ts`

- [ ] **Step 1: Write types**

`src/types.ts`:
```typescript
export interface MymdSettings {
  theme: string
  colorMode: 'light' | 'dark' | 'system'
  customCSS: string
  cssVariables: Record<string, string>

  fontFamily: string
  fontSize: number
  lineHeight: number
  contentWidth: number

  autoRefresh: boolean
  autoRefreshInterval: number
  showOutline: boolean
  showFileList: boolean
  showProgressBar: boolean
  showStats: boolean
  rememberScrollPosition: boolean
  showFrontmatter: boolean

  shortcuts: Record<string, string>
}

export interface MymdTheme {
  name: string
  version: number
  colorMode: 'light' | 'dark'
  cssVariables: Record<string, string>
  customCSS?: string
  codeTheme?: string
  fonts?: {
    body?: string
    heading?: string
    code?: string
  }
}

export interface DocumentState {
  url: string
  rawMarkdown: string
  renderedHTML: string
  headings: Heading[]
  frontmatter: Record<string, unknown> | null
  wordCount: number
  readingTime: number
}

export interface Heading {
  level: number
  text: string
  id: string
}

export const DEFAULT_SETTINGS: MymdSettings = {
  theme: 'github',
  colorMode: 'system',
  customCSS: '',
  cssVariables: {},
  fontFamily: 'system-ui, sans-serif',
  fontSize: 16,
  lineHeight: 1.6,
  contentWidth: 800,
  autoRefresh: true,
  autoRefreshInterval: 2000,
  showOutline: true,
  showFileList: true,
  showProgressBar: true,
  showStats: true,
  rememberScrollPosition: true,
  showFrontmatter: false,
  shortcuts: {
    toggleOutline: 'Ctrl+Shift+O',
    toggleSource: 'Ctrl+Shift+S',
    toggleDark: 'Ctrl+Shift+D',
  },
}
```

- [ ] **Step 2: Write storage test**

`tests/lib/storage.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadSettings, saveSettings, loadLocal, saveLocal } from '@/lib/storage'
import { DEFAULT_SETTINGS } from '@/types'

// Mock chrome.storage
const mockSyncStorage: Record<string, unknown> = {}
const mockLocalStorage: Record<string, unknown> = {}

vi.stubGlobal('chrome', {
  storage: {
    sync: {
      get: vi.fn((keys) => Promise.resolve(
        typeof keys === 'string' ? { [keys]: mockSyncStorage[keys] } :
        Object.fromEntries(Object.keys(keys).map(k => [k, mockSyncStorage[k] ?? keys[k]]))
      )),
      set: vi.fn((items) => {
        Object.assign(mockSyncStorage, items)
        return Promise.resolve()
      }),
    },
    local: {
      get: vi.fn((keys) => Promise.resolve(
        typeof keys === 'string' ? { [keys]: mockLocalStorage[keys] } :
        Object.fromEntries(Object.keys(keys).map(k => [k, mockLocalStorage[k] ?? keys[k]]))
      )),
      set: vi.fn((items) => {
        Object.assign(mockLocalStorage, items)
        return Promise.resolve()
      }),
    },
  },
})

beforeEach(() => {
  Object.keys(mockSyncStorage).forEach(k => delete mockSyncStorage[k])
  Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k])
})

describe('storage', () => {
  it('loadSettings returns defaults when empty', async () => {
    const settings = await loadSettings()
    expect(settings).toEqual(DEFAULT_SETTINGS)
  })

  it('saveSettings persists to sync, customCSS to local', async () => {
    const settings = { ...DEFAULT_SETTINGS, customCSS: 'body { color: red; }' }
    await saveSettings(settings)
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ customCSS: 'body { color: red; }' })
    )
  })

  it('loadLocal / saveLocal work for scroll positions', async () => {
    await saveLocal('scrollPositions', { 'file:///test.md': 500 })
    const result = await loadLocal('scrollPositions')
    expect(result).toEqual({ 'file:///test.md': 500 })
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd /Users/chasey/Dev/browser-extensions/mymd && pnpm test:run tests/lib/storage.test.ts`
Expected: FAIL — module `@/lib/storage` not found.

- [ ] **Step 4: Implement storage**

`src/lib/storage.ts`:
```typescript
import { DEFAULT_SETTINGS, type MymdSettings } from '../types'

const LARGE_KEYS = ['customCSS'] as const

export async function loadSettings(): Promise<MymdSettings> {
  const syncResult = await chrome.storage.sync.get(DEFAULT_SETTINGS)
  const localResult = await chrome.storage.local.get(
    Object.fromEntries(LARGE_KEYS.map(k => [k, DEFAULT_SETTINGS[k]]))
  )
  return { ...DEFAULT_SETTINGS, ...syncResult, ...localResult } as MymdSettings
}

export async function saveSettings(settings: MymdSettings): Promise<void> {
  const localData: Record<string, unknown> = {}
  const syncData: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(settings)) {
    if ((LARGE_KEYS as readonly string[]).includes(key)) {
      localData[key] = value
    } else {
      syncData[key] = value
    }
  }

  await Promise.all([
    Object.keys(syncData).length > 0 ? chrome.storage.sync.set(syncData) : Promise.resolve(),
    Object.keys(localData).length > 0 ? chrome.storage.local.set(localData) : Promise.resolve(),
  ])
}

export async function loadLocal<T>(key: string): Promise<T | undefined> {
  const result = await chrome.storage.local.get(key)
  return result[key] as T | undefined
}

export async function saveLocal(key: string, value: unknown): Promise<void> {
  await chrome.storage.local.set({ [key]: value })
}
```

- [ ] **Step 5: Configure path aliases for Vitest**

In `vite.config.ts`, add resolve alias:
```typescript
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // ... rest of config
})
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd /Users/chasey/Dev/browser-extensions/mymd && pnpm test:run tests/lib/storage.test.ts`
Expected: All 3 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/types.ts src/lib/storage.ts tests/lib/storage.test.ts vite.config.ts
git commit -m "feat: add shared types and chrome storage wrapper"
```

---

## Task 3: Markdown Renderer Core

**Files:**
- Create: `src/lib/markdown/renderer.ts`
- Create: `src/lib/markdown/plugins/mermaid.ts`
- Create: `src/lib/markdown/plugins/wikilink.ts`
- Create: `tests/lib/markdown/renderer.test.ts`
- Create: `tests/lib/markdown/mermaid-plugin.test.ts`
- Create: `tests/lib/markdown/wikilink-plugin.test.ts`

- [ ] **Step 1: Install markdown-it plugins**

```bash
cd /Users/chasey/Dev/browser-extensions/mymd
pnpm add markdown-it-emoji markdown-it-sup markdown-it-sub markdown-it-footnote \
  markdown-it-abbr markdown-it-mark markdown-it-ins markdown-it-deflist \
  markdown-it-container markdown-it-multimd-table markdown-it-task-lists \
  markdown-it-table-of-contents @mdit/plugin-alert @traptitech/markdown-it-katex
```

- [ ] **Step 2: Write mermaid plugin test**

`tests/lib/markdown/mermaid-plugin.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import { mermaidPlugin } from '@/lib/markdown/plugins/mermaid'

describe('mermaid plugin', () => {
  const md = new MarkdownIt().use(mermaidPlugin)

  it('renders mermaid fence as div with class', () => {
    const input = '```mermaid\ngraph TD\n  A-->B\n```'
    const result = md.render(input)
    expect(result).toContain('class="mermaid"')
    expect(result).toContain('graph TD')
    expect(result).toContain('A-->B')
  })

  it('does not affect normal code fences', () => {
    const input = '```javascript\nconst x = 1\n```'
    const result = md.render(input)
    expect(result).not.toContain('class="mermaid"')
    expect(result).toContain('const x = 1')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test:run tests/lib/markdown/mermaid-plugin.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement mermaid plugin**

`src/lib/markdown/plugins/mermaid.ts`:
```typescript
import type MarkdownIt from 'markdown-it'

export function mermaidPlugin(md: MarkdownIt): void {
  const defaultFence = md.renderer.rules.fence!.bind(md.renderer.rules)

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    if (token.info.trim() === 'mermaid') {
      const content = token.content.trim()
      return `<div class="mermaid">${md.utils.escapeHtml(content)}</div>\n`
    }
    return defaultFence(tokens, idx, options, env, self)
  }
}
```

- [ ] **Step 5: Run mermaid test to verify it passes**

Run: `pnpm test:run tests/lib/markdown/mermaid-plugin.test.ts`
Expected: PASS.

- [ ] **Step 6: Write wikilink plugin test**

`tests/lib/markdown/wikilink-plugin.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import { wikilinkPlugin } from '@/lib/markdown/plugins/wikilink'

describe('wikilink plugin', () => {
  const md = new MarkdownIt().use(wikilinkPlugin)

  it('converts [[page]] to link', () => {
    const result = md.renderInline('see [[my-page]]')
    expect(result).toContain('<a')
    expect(result).toContain('href="my-page"')
    expect(result).toContain('my-page</a>')
  })

  it('supports display text [[page|text]]', () => {
    const result = md.renderInline('[[page|display text]]')
    expect(result).toContain('href="page"')
    expect(result).toContain('display text</a>')
  })

  it('ignores non-wikilink brackets', () => {
    const result = md.renderInline('array[0]')
    expect(result).not.toContain('<a')
  })
})
```

- [ ] **Step 7: Run test to verify it fails**

Run: `pnpm test:run tests/lib/markdown/wikilink-plugin.test.ts`
Expected: FAIL.

- [ ] **Step 8: Implement wikilink plugin**

`src/lib/markdown/plugins/wikilink.ts`:
```typescript
import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'

export function wikilinkPlugin(md: MarkdownIt): void {
  md.inline.ruler.push('wikilink', (state: StateInline, silent: boolean) => {
    const src = state.src.slice(state.pos)
    const match = src.match(/^\[\[([^\]]+)\]\]/)
    if (!match) return false
    if (silent) return true

    const inner = match[1]
    const [href, display] = inner.includes('|')
      ? [inner.split('|')[0].trim(), inner.split('|').slice(1).join('|').trim()]
      : [inner.trim(), inner.trim()]

    const tokenOpen = state.push('link_open', 'a', 1)
    tokenOpen.attrSet('href', href)
    tokenOpen.attrSet('class', 'wikilink')

    const tokenText = state.push('text', '', 0)
    tokenText.content = display

    state.push('link_close', 'a', -1)
    state.pos += match[0].length
    return true
  })
}
```

- [ ] **Step 9: Run wikilink test to verify it passes**

Run: `pnpm test:run tests/lib/markdown/wikilink-plugin.test.ts`
Expected: PASS.

- [ ] **Step 10: Write renderer integration test**

`tests/lib/markdown/renderer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { createRenderer } from '@/lib/markdown/renderer'

describe('markdown renderer', () => {
  const md = createRenderer()

  it('renders basic markdown', () => {
    expect(md.render('# Hello')).toContain('<h1')
    expect(md.render('**bold**')).toContain('<strong>')
  })

  it('renders GFM tables', () => {
    const table = '| A | B |\n|---|---|\n| 1 | 2 |'
    expect(md.render(table)).toContain('<table')
  })

  it('renders task lists', () => {
    const input = '- [x] done\n- [ ] todo'
    const result = md.render(input)
    expect(result).toContain('type="checkbox"')
  })

  it('renders emoji', () => {
    expect(md.render(':smile:')).toContain('😄')
  })

  it('renders superscript and subscript', () => {
    expect(md.render('^super^')).toContain('<sup>')
    expect(md.render('~sub~')).toContain('<sub>')
  })

  it('renders footnotes', () => {
    const input = 'text[^1]\n\n[^1]: footnote'
    expect(md.render(input)).toContain('footnote')
  })

  it('renders math (katex)', () => {
    expect(md.render('$E=mc^2$')).toContain('katex')
  })

  it('renders mermaid blocks', () => {
    const input = '```mermaid\ngraph TD\n  A-->B\n```'
    expect(md.render(input)).toContain('class="mermaid"')
  })

  it('renders wikilinks', () => {
    expect(md.render('[[page]]')).toContain('href="page"')
  })

  it('renders alerts', () => {
    const input = '> [!NOTE]\n> This is a note'
    expect(md.render(input)).toContain('note')
  })

  it('renders mark/ins', () => {
    expect(md.render('==highlighted==')).toContain('<mark>')
    expect(md.render('++inserted++')).toContain('<ins>')
  })
})
```

- [ ] **Step 11: Run test to verify it fails**

Run: `pnpm test:run tests/lib/markdown/renderer.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 12: Implement renderer**

`src/lib/markdown/renderer.ts`:
```typescript
import MarkdownIt from 'markdown-it'
import emoji from 'markdown-it-emoji'
import sup from 'markdown-it-sup'
import sub from 'markdown-it-sub'
import footnote from 'markdown-it-footnote'
import abbr from 'markdown-it-abbr'
import mark from 'markdown-it-mark'
import ins from 'markdown-it-ins'
import deflist from 'markdown-it-deflist'
import container from 'markdown-it-container'
import multimdTable from 'markdown-it-multimd-table'
import taskLists from 'markdown-it-task-lists'
import toc from 'markdown-it-table-of-contents'
import { alert } from '@mdit/plugin-alert'
import katex from '@traptitech/markdown-it-katex'
import { mermaidPlugin } from './plugins/mermaid'
import { wikilinkPlugin } from './plugins/wikilink'

export function createRenderer(): MarkdownIt {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  })

  md.use(emoji)
    .use(sup)
    .use(sub)
    .use(footnote)
    .use(abbr)
    .use(mark)
    .use(ins)
    .use(deflist)
    .use(container, 'warning')
    .use(container, 'info')
    .use(container, 'tip')
    .use(multimdTable, { multiline: true, rowspan: true, headerless: true })
    .use(taskLists, { enabled: true })
    .use(toc, { includeLevel: [1, 2, 3, 4, 5, 6] })
    .use(alert)
    .use(katex, { throwOnError: false })
    .use(mermaidPlugin)
    .use(wikilinkPlugin)

  // Add heading IDs for anchor links
  const defaultHeadingOpen = md.renderer.rules.heading_open
  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const contentToken = tokens[idx + 1]
    const text = contentToken.children
      ?.filter(t => t.type === 'text' || t.type === 'code_inline')
      .map(t => t.content)
      .join('') ?? ''
    const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '')
    token.attrSet('id', id)

    if (defaultHeadingOpen) {
      return defaultHeadingOpen(tokens, idx, options, env, self)
    }
    return self.renderToken(tokens, idx, options)
  }

  return md
}
```

- [ ] **Step 13: Run all renderer tests**

Run: `pnpm test:run tests/lib/markdown/`
Expected: All tests PASS. Some plugin imports may need adjustment based on actual module exports (default vs named). Fix any import issues.

- [ ] **Step 14: Commit**

```bash
git add src/lib/markdown/ tests/lib/markdown/
git commit -m "feat: add markdown-it renderer with all plugins"
```

---

## Task 4: Shiki Code Highlighter

**Files:**
- Create: `src/lib/markdown/highlighter.ts`

- [ ] **Step 1: Install Shiki**

```bash
pnpm add shiki
```

- [ ] **Step 2: Implement highlighter with lazy loading**

`src/lib/markdown/highlighter.ts`:
```typescript
import { createHighlighter, type Highlighter, type BundledLanguage } from 'shiki'

const BUNDLED_LANGS: BundledLanguage[] = [
  'javascript', 'typescript', 'python', 'go', 'rust', 'java',
  'c', 'cpp', 'shellscript', 'json', 'yaml', 'html', 'css',
  'sql', 'markdown', 'jsx', 'tsx', 'bash', 'diff', 'xml',
]

let highlighter: Highlighter | null = null

export async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['github-dark', 'github-light', 'one-dark-pro', 'vitesse-light', 'nord'],
      langs: BUNDLED_LANGS,
    })
  }
  return highlighter
}

export async function highlightCode(code: string, lang: string, theme: string): Promise<string> {
  const hl = await getHighlighter()
  const loadedLangs = hl.getLoadedLanguages()

  if (!loadedLangs.includes(lang as BundledLanguage)) {
    try {
      await hl.loadLanguage(lang as BundledLanguage)
    } catch {
      lang = 'text'
    }
  }

  return hl.codeToHtml(code, { lang, theme })
}
```

- [ ] **Step 3: Integrate Shiki into renderer**

Update `src/lib/markdown/renderer.ts` — add an async post-processing step. The renderer produces HTML synchronously, then `renderMarkdown()` does async Shiki highlighting:

```typescript
// Add to renderer.ts:
import { highlightCode } from './highlighter'

export async function renderMarkdown(markdown: string, codeTheme: string = 'github-dark'): Promise<string> {
  const md = createRenderer()
  let html = md.render(markdown)

  // Post-process: replace <pre><code class="language-xxx"> with Shiki output
  const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g
  const matches = [...html.matchAll(codeBlockRegex)]

  for (const match of matches) {
    const lang = match[1]
    const code = match[2]
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    const highlighted = await highlightCode(code, lang, codeTheme)
    html = html.replace(match[0], highlighted)
  }

  return html
}
```

- [ ] **Step 4: Verify build still works**

Run: `pnpm build`
Expected: Build succeeds. Shiki WASM/themes are bundled.

- [ ] **Step 5: Commit**

```bash
git add src/lib/markdown/highlighter.ts src/lib/markdown/renderer.ts
git commit -m "feat: add Shiki code highlighting with lazy language loading"
```

---

## Task 5: Utility Libraries (Frontmatter, Stats, File List)

**Files:**
- Create: `src/lib/frontmatter.ts`
- Create: `src/lib/stats.ts`
- Create: `src/lib/file-list.ts`
- Create: `tests/lib/frontmatter.test.ts`
- Create: `tests/lib/stats.test.ts`
- Create: `tests/lib/file-list.test.ts`

- [ ] **Step 1: Install js-yaml for frontmatter**

> **注意：不使用 gray-matter**，因为它依赖 Node.js 的 `Buffer` 和 `fs`，在浏览器扩展中无法运行。改用 `js-yaml` + 手写正则提取。

```bash
pnpm add js-yaml
pnpm add -D @types/js-yaml
```

- [ ] **Step 2: Write frontmatter test**

`tests/lib/frontmatter.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { parseFrontmatter } from '@/lib/frontmatter'

describe('frontmatter', () => {
  it('extracts YAML frontmatter', () => {
    const input = '---\ntitle: Hello\nauthor: Test\n---\n# Content'
    const result = parseFrontmatter(input)
    expect(result.data).toEqual({ title: 'Hello', author: 'Test' })
    expect(result.content).toBe('# Content')
  })

  it('returns null data when no frontmatter', () => {
    const result = parseFrontmatter('# Just markdown')
    expect(result.data).toBeNull()
    expect(result.content).toBe('# Just markdown')
  })

  it('handles empty frontmatter', () => {
    const result = parseFrontmatter('---\n---\n# Content')
    expect(result.data).toEqual({})
    expect(result.content).toBe('# Content')
  })
})
```

- [ ] **Step 3: Implement frontmatter**

`src/lib/frontmatter.ts`:
```typescript
import yaml from 'js-yaml'

interface FrontmatterResult {
  data: Record<string, unknown> | null
  content: string
}

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/

export function parseFrontmatter(markdown: string): FrontmatterResult {
  if (!markdown.startsWith('---')) {
    return { data: null, content: markdown }
  }

  const match = markdown.match(FRONTMATTER_RE)
  if (!match) {
    return { data: null, content: markdown }
  }

  try {
    const raw = match[1].trim()
    const data = raw ? (yaml.load(raw) as Record<string, unknown>) : {}
    return { data, content: match[2].trim() }
  } catch {
    return { data: null, content: markdown }
  }
}
```

- [ ] **Step 4: Write stats test**

`tests/lib/stats.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { calculateStats } from '@/lib/stats'

describe('stats', () => {
  it('counts words in English text', () => {
    const stats = calculateStats('Hello world, this is a test')
    expect(stats.wordCount).toBe(6)
  })

  it('counts characters in Chinese text', () => {
    const stats = calculateStats('你好世界')
    expect(stats.wordCount).toBe(4)
  })

  it('calculates reading time', () => {
    const longText = 'word '.repeat(500)
    const stats = calculateStats(longText)
    expect(stats.readingTime).toBe(2) // ~250 wpm = 2 min
  })

  it('handles mixed content', () => {
    const stats = calculateStats('Hello 你好 world 世界')
    expect(stats.wordCount).toBeGreaterThan(2)
  })

  it('handles empty string', () => {
    const stats = calculateStats('')
    expect(stats.wordCount).toBe(0)
    expect(stats.readingTime).toBe(0)
  })
})
```

- [ ] **Step 5: Implement stats**

`src/lib/stats.ts`:
```typescript
interface Stats {
  wordCount: number
  readingTime: number // minutes
}

export function calculateStats(text: string): Stats {
  if (!text.trim()) return { wordCount: 0, readingTime: 0 }

  // Count CJK characters individually
  const cjkChars = (text.match(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g) ?? []).length
  // Count English words
  const stripped = text.replace(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g, ' ')
  const englishWords = stripped.split(/\s+/).filter(w => w.length > 0).length

  const wordCount = cjkChars + englishWords
  const readingTime = Math.max(0, Math.ceil(wordCount / 250))

  return { wordCount, readingTime }
}
```

- [ ] **Step 6: Write file-list test**

`tests/lib/file-list.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { parseDirectoryListing } from '@/lib/file-list'

describe('file-list', () => {
  it('extracts .md files from Chrome directory listing HTML', () => {
    const html = `
      <html><body>
        <a href="readme.md">readme.md</a>
        <a href="notes.md">notes.md</a>
        <a href="image.png">image.png</a>
        <a href="doc.markdown">doc.markdown</a>
        <a href="subfolder/">subfolder/</a>
      </body></html>
    `
    const files = parseDirectoryListing(html)
    expect(files).toEqual(['doc.markdown', 'notes.md', 'readme.md'])
  })

  it('returns empty array for no .md files', () => {
    const html = '<html><body><a href="image.png">image.png</a></body></html>'
    expect(parseDirectoryListing(html)).toEqual([])
  })

  it('handles empty HTML', () => {
    expect(parseDirectoryListing('')).toEqual([])
  })
})
```

- [ ] **Step 7: Implement file-list**

`src/lib/file-list.ts`:
```typescript
const MD_EXTENSIONS = ['.md', '.mkd', '.mdx', '.markdown']

export function parseDirectoryListing(html: string): string[] {
  if (!html) return []

  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>/gi
  const files: string[] = []

  let match: RegExpExecArray | null
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]
    if (MD_EXTENSIONS.some(ext => href.toLowerCase().endsWith(ext))) {
      files.push(href)
    }
  }

  return files.sort()
}
```

- [ ] **Step 8: Run all tests**

Run: `pnpm test:run tests/lib/frontmatter.test.ts tests/lib/stats.test.ts tests/lib/file-list.test.ts`
Expected: All PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/frontmatter.ts src/lib/stats.ts src/lib/file-list.ts \
  tests/lib/frontmatter.test.ts tests/lib/stats.test.ts tests/lib/file-list.test.ts
git commit -m "feat: add frontmatter parser, stats calculator, and file list parser"
```

---

## Task 6: Background Service Worker

**Files:**
- Modify: `src/background/index.ts`

- [ ] **Step 1: Implement URL detection and redirection**

`src/background/index.ts`:
```typescript
const MD_EXTENSIONS = /\.(md|mkd|mdx|markdown)(\?.*)?$/i

function isMarkdownUrl(url: string): boolean {
  try {
    const { pathname } = new URL(url)
    return MD_EXTENSIONS.test(pathname)
  } catch {
    return false
  }
}

function getViewerUrl(originalUrl: string): string {
  const viewerUrl = chrome.runtime.getURL('src/viewer/index.html')
  return `${viewerUrl}?url=${encodeURIComponent(originalUrl)}`
}

// Redirect HTTP/HTTPS .md URLs to viewer
chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    if (details.frameId !== 0) return
    if (!isMarkdownUrl(details.url)) return
    if (details.url.startsWith('chrome-extension://')) return

    chrome.tabs.update(details.tabId, {
      url: getViewerUrl(details.url),
    })
  },
  { url: [{ schemes: ['http', 'https', 'file'] }] }
)

// Handle content script messages (file:// raw text)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_FILE_CONTENT') {
    // Content script sends the raw text from file:// page
    sendResponse({ success: true })
    return true
  }

  if (message.type === 'FETCH_URL') {
    // Viewer requests content fetch for http/https
    fetch(message.url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then(text => sendResponse({ success: true, content: text }))
      .catch(err => sendResponse({ success: false, error: err.message }))
    return true // async response
  }

  if (message.type === 'LIST_DIRECTORY') {
    // Fetch directory listing for file:// sidebar
    fetch(message.url)
      .then(res => res.text())
      .then(html => sendResponse({ success: true, html }))
      .catch(err => sendResponse({ success: false, error: err.message }))
    return true
  }
})

console.log('[mymd] Background service worker loaded')
```

- [ ] **Step 2: Update content script for file:// extraction**

`src/content/index.ts`:
```typescript
const MD_EXTENSIONS = /\.(md|mkd|mdx|markdown)$/i

function isMarkdownFile(): boolean {
  return MD_EXTENSIONS.test(window.location.pathname)
}

function getViewerUrl(originalUrl: string): string {
  const viewerUrl = chrome.runtime.getURL('src/viewer/index.html')
  return `${viewerUrl}?url=${encodeURIComponent(originalUrl)}`
}

if (isMarkdownFile()) {
  // Grab raw text before redirecting
  const rawText = document.body.innerText || document.body.textContent || ''

  // Store in session for viewer to pick up
  chrome.storage.session.set({
    [`file_content_${window.location.href}`]: rawText,
  }).then(() => {
    // Redirect to viewer
    window.location.href = getViewerUrl(window.location.href)
  })
}
```

- [ ] **Step 3: Update manifest — add session storage permission**

Add `"storage"` already exists. Add the viewer page to `web_accessible_resources`:

```json
"web_accessible_resources": [
  {
    "resources": ["src/viewer/index.html"],
    "matches": ["<all_urls>"]
  }
]
```

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/background/index.ts src/content/index.ts manifest.json
git commit -m "feat: add background service worker and content script for URL detection"
```

---

## Task 7: Theme Engine & Built-in Themes

**Files:**
- Create: `src/lib/theme/variables.ts`
- Create: `src/lib/theme/engine.ts`
- Create: `src/lib/theme/themes/index.ts`
- Create: `src/lib/theme/themes/github.ts`
- Create: `src/lib/theme/themes/typora.ts`
- Create: `src/lib/theme/themes/academic.ts`
- Create: `src/lib/theme/themes/reader.ts`
- Create: `src/lib/theme/themes/minimal.ts`
- Create: `tests/lib/theme/engine.test.ts`

- [ ] **Step 1: Define CSS variables**

`src/lib/theme/variables.ts`:
```typescript
export interface ThemeVariables {
  // Colors
  '--mymd-bg': string
  '--mymd-text': string
  '--mymd-text-secondary': string
  '--mymd-heading': string
  '--mymd-link': string
  '--mymd-link-hover': string
  '--mymd-border': string
  '--mymd-code-bg': string
  '--mymd-code-text': string
  '--mymd-blockquote-bg': string
  '--mymd-blockquote-border': string
  '--mymd-table-border': string
  '--mymd-table-stripe': string
  '--mymd-mark-bg': string
  '--mymd-selection-bg': string

  // Sidebar
  '--mymd-sidebar-bg': string
  '--mymd-sidebar-text': string
  '--mymd-sidebar-active': string
  '--mymd-sidebar-hover': string

  // Toolbar
  '--mymd-toolbar-bg': string
  '--mymd-toolbar-text': string
  '--mymd-toolbar-border': string

  // Shadows
  '--mymd-shadow-sm': string
  '--mymd-shadow-md': string

  // Radius
  '--mymd-radius-sm': string
  '--mymd-radius-md': string

  // Spacing
  '--mymd-content-padding': string

  // Alert variants
  '--mymd-alert-note-bg': string
  '--mymd-alert-note-border': string
  '--mymd-alert-tip-bg': string
  '--mymd-alert-tip-border': string
  '--mymd-alert-warning-bg': string
  '--mymd-alert-warning-border': string
  '--mymd-alert-danger-bg': string
  '--mymd-alert-danger-border': string
}

export const VARIABLE_METADATA: Record<keyof ThemeVariables, { label: string; type: 'color' | 'size' | 'shadow' }> = {
  '--mymd-bg': { label: 'Background', type: 'color' },
  '--mymd-text': { label: 'Text Color', type: 'color' },
  '--mymd-text-secondary': { label: 'Secondary Text', type: 'color' },
  '--mymd-heading': { label: 'Heading Color', type: 'color' },
  '--mymd-link': { label: 'Link Color', type: 'color' },
  '--mymd-link-hover': { label: 'Link Hover', type: 'color' },
  '--mymd-border': { label: 'Border Color', type: 'color' },
  '--mymd-code-bg': { label: 'Code Background', type: 'color' },
  '--mymd-code-text': { label: 'Code Text', type: 'color' },
  '--mymd-blockquote-bg': { label: 'Blockquote Background', type: 'color' },
  '--mymd-blockquote-border': { label: 'Blockquote Border', type: 'color' },
  '--mymd-table-border': { label: 'Table Border', type: 'color' },
  '--mymd-table-stripe': { label: 'Table Stripe', type: 'color' },
  '--mymd-mark-bg': { label: 'Highlight Background', type: 'color' },
  '--mymd-selection-bg': { label: 'Selection Background', type: 'color' },
  '--mymd-sidebar-bg': { label: 'Sidebar Background', type: 'color' },
  '--mymd-sidebar-text': { label: 'Sidebar Text', type: 'color' },
  '--mymd-sidebar-active': { label: 'Sidebar Active', type: 'color' },
  '--mymd-sidebar-hover': { label: 'Sidebar Hover', type: 'color' },
  '--mymd-toolbar-bg': { label: 'Toolbar Background', type: 'color' },
  '--mymd-toolbar-text': { label: 'Toolbar Text', type: 'color' },
  '--mymd-toolbar-border': { label: 'Toolbar Border', type: 'color' },
  '--mymd-shadow-sm': { label: 'Small Shadow', type: 'shadow' },
  '--mymd-shadow-md': { label: 'Medium Shadow', type: 'shadow' },
  '--mymd-radius-sm': { label: 'Small Radius', type: 'size' },
  '--mymd-radius-md': { label: 'Medium Radius', type: 'size' },
  '--mymd-content-padding': { label: 'Content Padding', type: 'size' },
  '--mymd-alert-note-bg': { label: 'Alert Note Background', type: 'color' },
  '--mymd-alert-note-border': { label: 'Alert Note Border', type: 'color' },
  '--mymd-alert-tip-bg': { label: 'Alert Tip Background', type: 'color' },
  '--mymd-alert-tip-border': { label: 'Alert Tip Border', type: 'color' },
  '--mymd-alert-warning-bg': { label: 'Alert Warning Background', type: 'color' },
  '--mymd-alert-warning-border': { label: 'Alert Warning Border', type: 'color' },
  '--mymd-alert-danger-bg': { label: 'Alert Danger Background', type: 'color' },
  '--mymd-alert-danger-border': { label: 'Alert Danger Border', type: 'color' },
}
```

- [ ] **Step 2: Implement theme files**

Each theme exports a `MymdTheme` object. Example for `src/lib/theme/themes/github.ts`:
```typescript
import type { MymdTheme } from '../../../types'

export const githubLight: MymdTheme = {
  name: 'GitHub Light',
  version: 1,
  colorMode: 'light',
  codeTheme: 'github-light',
  cssVariables: {
    '--mymd-bg': '#ffffff',
    '--mymd-text': '#1f2328',
    '--mymd-text-secondary': '#656d76',
    '--mymd-heading': '#1f2328',
    '--mymd-link': '#0969da',
    '--mymd-link-hover': '#0550ae',
    '--mymd-border': '#d0d7de',
    '--mymd-code-bg': '#f6f8fa',
    '--mymd-code-text': '#1f2328',
    '--mymd-blockquote-bg': 'transparent',
    '--mymd-blockquote-border': '#d0d7de',
    '--mymd-table-border': '#d0d7de',
    '--mymd-table-stripe': '#f6f8fa',
    '--mymd-mark-bg': '#fff8c5',
    '--mymd-selection-bg': '#b6e3ff',
    '--mymd-sidebar-bg': '#f6f8fa',
    '--mymd-sidebar-text': '#1f2328',
    '--mymd-sidebar-active': '#0969da',
    '--mymd-sidebar-hover': '#eaeef2',
    '--mymd-toolbar-bg': '#f6f8fa',
    '--mymd-toolbar-text': '#1f2328',
    '--mymd-toolbar-border': '#d0d7de',
    '--mymd-shadow-sm': '0 1px 2px rgba(0,0,0,0.06)',
    '--mymd-shadow-md': '0 4px 12px rgba(0,0,0,0.08)',
    '--mymd-radius-sm': '4px',
    '--mymd-radius-md': '8px',
    '--mymd-content-padding': '2rem',
    '--mymd-alert-note-bg': '#ddf4ff',
    '--mymd-alert-note-border': '#54aeff',
    '--mymd-alert-tip-bg': '#dafbe1',
    '--mymd-alert-tip-border': '#4ac26b',
    '--mymd-alert-warning-bg': '#fff8c5',
    '--mymd-alert-warning-border': '#d4a72c',
    '--mymd-alert-danger-bg': '#ffebe9',
    '--mymd-alert-danger-border': '#ff8182',
  },
}

export const githubDark: MymdTheme = {
  name: 'GitHub Dark',
  version: 1,
  colorMode: 'dark',
  codeTheme: 'github-dark',
  cssVariables: {
    '--mymd-bg': '#0d1117',
    '--mymd-text': '#e6edf3',
    '--mymd-text-secondary': '#8b949e',
    '--mymd-heading': '#e6edf3',
    '--mymd-link': '#58a6ff',
    '--mymd-link-hover': '#79c0ff',
    '--mymd-border': '#30363d',
    '--mymd-code-bg': '#161b22',
    '--mymd-code-text': '#e6edf3',
    '--mymd-blockquote-bg': 'transparent',
    '--mymd-blockquote-border': '#30363d',
    '--mymd-table-border': '#30363d',
    '--mymd-table-stripe': '#161b22',
    '--mymd-mark-bg': '#bb800926',
    '--mymd-selection-bg': '#264f78',
    '--mymd-sidebar-bg': '#010409',
    '--mymd-sidebar-text': '#e6edf3',
    '--mymd-sidebar-active': '#58a6ff',
    '--mymd-sidebar-hover': '#161b22',
    '--mymd-toolbar-bg': '#010409',
    '--mymd-toolbar-text': '#e6edf3',
    '--mymd-toolbar-border': '#30363d',
    '--mymd-shadow-sm': '0 1px 2px rgba(0,0,0,0.3)',
    '--mymd-shadow-md': '0 4px 12px rgba(0,0,0,0.4)',
    '--mymd-radius-sm': '4px',
    '--mymd-radius-md': '8px',
    '--mymd-content-padding': '2rem',
    '--mymd-alert-note-bg': '#0d1d30',
    '--mymd-alert-note-border': '#1f6feb',
    '--mymd-alert-tip-bg': '#0d2818',
    '--mymd-alert-tip-border': '#238636',
    '--mymd-alert-warning-bg': '#2a1f04',
    '--mymd-alert-warning-border': '#9e6a03',
    '--mymd-alert-danger-bg': '#2d0e0e',
    '--mymd-alert-danger-border': '#da3633',
  },
}
```

Create similar files for `typora.ts`, `academic.ts`, `reader.ts`, `minimal.ts` — each with light and dark variants following the same pattern with appropriate color palettes.

`src/lib/theme/themes/index.ts`:
```typescript
import type { MymdTheme } from '../../../types'
import { githubLight, githubDark } from './github'
import { typoraLight, typoraDark } from './typora'
import { academicLight, academicDark } from './academic'
import { readerLight, readerDark } from './reader'
import { minimalLight, minimalDark } from './minimal'

export interface ThemePair {
  light: MymdTheme
  dark: MymdTheme
}

export const THEMES: Record<string, ThemePair> = {
  github: { light: githubLight, dark: githubDark },
  typora: { light: typoraLight, dark: typoraDark },
  academic: { light: academicLight, dark: academicDark },
  reader: { light: readerLight, dark: readerDark },
  minimal: { light: minimalLight, dark: minimalDark },
}

export function getTheme(name: string, mode: 'light' | 'dark'): MymdTheme {
  const pair = THEMES[name] ?? THEMES.github
  return pair[mode]
}

export function getThemeNames(): string[] {
  return Object.keys(THEMES)
}
```

- [ ] **Step 3: Write engine test**

`tests/lib/theme/engine.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { applyTheme, resolveColorMode, exportTheme, importTheme } from '@/lib/theme/engine'
import { getTheme } from '@/lib/theme/themes'

describe('theme engine', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
  })

  it('resolveColorMode returns light/dark for explicit modes', () => {
    expect(resolveColorMode('light')).toBe('light')
    expect(resolveColorMode('dark')).toBe('dark')
  })

  it('applyTheme sets CSS variables on documentElement', () => {
    const theme = getTheme('github', 'light')
    applyTheme(theme, {})
    expect(document.documentElement.style.getPropertyValue('--mymd-bg')).toBe('#ffffff')
    expect(document.documentElement.style.getPropertyValue('--mymd-text')).toBe('#1f2328')
  })

  it('applyTheme merges user overrides', () => {
    const theme = getTheme('github', 'light')
    applyTheme(theme, { '--mymd-bg': '#f0f0f0' })
    expect(document.documentElement.style.getPropertyValue('--mymd-bg')).toBe('#f0f0f0')
  })

  it('exportTheme produces valid JSON', () => {
    const theme = getTheme('github', 'light')
    const json = exportTheme(theme)
    const parsed = JSON.parse(json)
    expect(parsed.name).toBe('GitHub Light')
    expect(parsed.version).toBe(1)
  })

  it('importTheme validates and returns theme', () => {
    const theme = getTheme('github', 'light')
    const json = exportTheme(theme)
    const imported = importTheme(json)
    expect(imported.name).toBe('GitHub Light')
  })

  it('importTheme throws on invalid JSON', () => {
    expect(() => importTheme('not json')).toThrow()
  })
})
```

- [ ] **Step 4: Implement engine**

`src/lib/theme/engine.ts`:
```typescript
import type { MymdTheme } from '../../types'

export function resolveColorMode(mode: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode
}

export function applyTheme(theme: MymdTheme, overrides: Record<string, string>): void {
  const el = document.documentElement
  const merged = { ...theme.cssVariables, ...overrides }

  for (const [key, value] of Object.entries(merged)) {
    el.style.setProperty(key, value)
  }

  el.setAttribute('data-theme', theme.name)
  el.setAttribute('data-color-mode', theme.colorMode)
}

export function applyCustomCSS(css: string): void {
  let styleEl = document.getElementById('mymd-custom-css') as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'mymd-custom-css'
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = css
}

export function exportTheme(theme: MymdTheme): string {
  return JSON.stringify(theme, null, 2)
}

export function importTheme(json: string): MymdTheme {
  const parsed = JSON.parse(json)
  if (!parsed.name || !parsed.version || !parsed.colorMode || !parsed.cssVariables) {
    throw new Error('Invalid theme: missing required fields (name, version, colorMode, cssVariables)')
  }
  return parsed as MymdTheme
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm test:run tests/lib/theme/`
Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/theme/ tests/lib/theme/
git commit -m "feat: add theme engine with 5 built-in theme pairs"
```

---

## Task 8: Viewer Page — Core Layout & Rendering

**Files:**
- Modify: `src/viewer/App.svelte`
- Create: `src/viewer/components/MarkdownContent.svelte`
- Create: `src/viewer/components/Toolbar.svelte`
- Create: `src/viewer/components/ProgressBar.svelte`
- Create: `src/viewer/components/ScrollTop.svelte`
- Create: `src/viewer/components/ErrorPage.svelte`
- Create: `src/viewer/stores/settings.ts`
- Create: `src/viewer/stores/document.ts`
- Create: `src/viewer/stores/ui.ts`
- Create: `src/viewer/styles/base.css`
- Create: `src/viewer/styles/content.css`
- Modify: `src/viewer/main.ts`

- [ ] **Step 1: Create Svelte stores**

`src/viewer/stores/settings.ts`:
```typescript
import { writable } from 'svelte/store'
import type { MymdSettings } from '../../types'
import { DEFAULT_SETTINGS } from '../../types'
import { loadSettings, saveSettings } from '../../lib/storage'

export const settings = writable<MymdSettings>(DEFAULT_SETTINGS)

export async function initSettings(): Promise<void> {
  const loaded = await loadSettings()
  settings.set(loaded)
}

// Auto-save on change (debounced)
let saveTimeout: ReturnType<typeof setTimeout>
settings.subscribe((value) => {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => saveSettings(value), 500)
})
```

`src/viewer/stores/document.ts`:
```typescript
import { writable, derived } from 'svelte/store'
import type { DocumentState, Heading } from '../../types'

export const documentState = writable<DocumentState>({
  url: '',
  rawMarkdown: '',
  renderedHTML: '',
  headings: [],
  frontmatter: null,
  wordCount: 0,
  readingTime: 0,
})

export const headings = derived(documentState, $doc => $doc.headings)
export const frontmatter = derived(documentState, $doc => $doc.frontmatter)
```

`src/viewer/stores/ui.ts`:
```typescript
import { writable } from 'svelte/store'

export const showOutline = writable(true)
export const showFileList = writable(true)
export const showSettings = writable(false)
export const showSource = writable(false)
export const scrollProgress = writable(0)
```

- [ ] **Step 2: Create base CSS**

`src/viewer/styles/base.css`:
```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  font-family: var(--mymd-font-family, system-ui, sans-serif);
  font-size: var(--mymd-font-size, 16px);
  line-height: var(--mymd-line-height, 1.6);
  color: var(--mymd-text);
  background: var(--mymd-bg);
  -webkit-font-smoothing: antialiased;
}

#app {
  height: 100%;
  display: flex;
  flex-direction: column;
}
```

`src/viewer/styles/content.css` — comprehensive markdown typography styles referencing CSS variables (headings, paragraphs, lists, tables, code blocks, blockquotes, alerts, etc.). This file will be ~300 lines covering all rendered markdown elements using the `--mymd-*` variables.

- [ ] **Step 3: Create core components**

`src/viewer/components/MarkdownContent.svelte`:
```svelte
<script lang="ts">
  import { documentState } from '../stores/document'
  import { onMount, afterUpdate } from 'svelte'
  import mermaid from 'mermaid'

  let contentEl: HTMLElement

  afterUpdate(() => {
    // Initialize Mermaid diagrams
    const mermaidEls = contentEl?.querySelectorAll('.mermaid')
    if (mermaidEls?.length) {
      mermaid.initialize({ startOnLoad: false, theme: 'default' })
      mermaid.run({ nodes: mermaidEls as unknown as ArrayLike<HTMLElement> })
    }
  })
</script>

<article class="mymd-content" bind:this={contentEl}>
  {@html $documentState.renderedHTML}
</article>
```

`src/viewer/components/Toolbar.svelte`:
```svelte
<script lang="ts">
  import { documentState } from '../stores/document'
  import { showOutline, showSource, showSettings, showFileList } from '../stores/ui'
  import { settings } from '../stores/settings'

  $: fileName = decodeURIComponent($documentState.url.split('/').pop() ?? 'Untitled')
  $: stats = `${$documentState.wordCount} words · ${$documentState.readingTime} min`

  function toggleColorMode() {
    settings.update(s => ({
      ...s,
      colorMode: s.colorMode === 'light' ? 'dark' : s.colorMode === 'dark' ? 'system' : 'light',
    }))
  }
</script>

<header class="toolbar">
  <div class="toolbar-left">
    <button class="toolbar-btn" on:click={() => $showFileList = !$showFileList} title="Toggle file list">
      &#x1F4C1;
    </button>
    <span class="toolbar-title">{fileName}</span>
  </div>
  <div class="toolbar-right">
    {#if $settings.showStats}
      <span class="toolbar-stats">{stats}</span>
    {/if}
    <button class="toolbar-btn" on:click={() => $showSource = !$showSource} title="Toggle source">
      &lt;/&gt;
    </button>
    <button class="toolbar-btn" on:click={toggleColorMode} title="Toggle color mode">
      {$settings.colorMode === 'dark' ? '☀' : $settings.colorMode === 'light' ? '🌙' : '⚙'}
    </button>
    <button class="toolbar-btn" on:click={() => $showOutline = !$showOutline} title="Toggle outline">
      ☰
    </button>
    <button class="toolbar-btn" on:click={() => $showSettings = !$showSettings} title="Settings">
      ⚙
    </button>
  </div>
</header>
```

`src/viewer/components/ProgressBar.svelte`:
```svelte
<script lang="ts">
  import { scrollProgress } from '../stores/ui'
</script>

<div class="progress-bar">
  <div class="progress-fill" style="width: {$scrollProgress}%"></div>
</div>
```

`src/viewer/components/ScrollTop.svelte`:
```svelte
<script lang="ts">
  import { scrollProgress } from '../stores/ui'

  function scrollToTop() {
    document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' })
  }
</script>

{#if $scrollProgress > 10}
  <button class="scroll-top" on:click={scrollToTop} title="Back to top">↑</button>
{/if}
```

`src/viewer/components/ErrorPage.svelte`:
```svelte
<script lang="ts">
  export let error: string
  export let type: 'network' | 'notfound' | 'permission' | 'toolarge' = 'network'

  function retry() {
    window.location.reload()
  }
</script>

<div class="error-page">
  <h1>{type === 'notfound' ? '404' : type === 'permission' ? 'Permission Denied' : 'Error'}</h1>
  <p>{error}</p>
  {#if type === 'permission'}
    <p>Please enable "Allow access to file URLs" in chrome://extensions for mymd.</p>
  {/if}
  {#if type === 'network'}
    <button on:click={retry}>Retry</button>
  {/if}
</div>
```

- [ ] **Step 4: Wire up App.svelte**

`src/viewer/App.svelte`:
```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import Toolbar from './components/Toolbar.svelte'
  import MarkdownContent from './components/MarkdownContent.svelte'
  import ProgressBar from './components/ProgressBar.svelte'
  import ScrollTop from './components/ScrollTop.svelte'
  import ErrorPage from './components/ErrorPage.svelte'
  import { documentState } from './stores/document'
  import { settings, initSettings } from './stores/settings'
  import { showOutline, showFileList, showSource, scrollProgress } from './stores/ui'
  import { renderMarkdown } from '../lib/markdown/renderer'
  import { parseFrontmatter } from '../lib/frontmatter'
  import { calculateStats } from '../lib/stats'
  import { applyTheme, resolveColorMode } from '../lib/theme/engine'
  import { getTheme } from '../lib/theme/themes'
  import type { Heading } from '../types'
  import '../viewer/styles/base.css'
  import '../viewer/styles/content.css'

  let error = ''
  let errorType: 'network' | 'notfound' | 'permission' | 'toolarge' = 'network'
  let mainContent: HTMLElement

  function extractHeadings(html: string): Heading[] {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const headings: Heading[] = []
    doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
      headings.push({
        level: parseInt(el.tagName[1]),
        text: el.textContent ?? '',
        id: el.id,
      })
    })
    return headings
  }

  async function fetchContent(url: string): Promise<string> {
    if (url.startsWith('file://')) {
      const result = await chrome.storage.session.get(`file_content_${url}`)
      return result[`file_content_${url}`] ?? ''
    }
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'FETCH_URL', url }, (response) => {
        if (response?.success) resolve(response.content)
        else reject(new Error(response?.error ?? 'Failed to fetch'))
      })
    })
  }

  async function loadDocument(): Promise<void> {
    const params = new URLSearchParams(window.location.search)
    const url = params.get('url')
    if (!url) { error = 'No URL provided'; return }

    try {
      const raw = await fetchContent(url)
      if (!raw) { error = 'Empty document'; errorType = 'notfound'; return }

      const { data: fm, content } = parseFrontmatter(raw)
      const html = await renderMarkdown(content, getTheme($settings.theme, resolveColorMode($settings.colorMode)).codeTheme)
      const headings = extractHeadings(html)
      const stats = calculateStats(content)

      documentState.set({
        url,
        rawMarkdown: raw,
        renderedHTML: html,
        headings,
        frontmatter: fm,
        wordCount: stats.wordCount,
        readingTime: stats.readingTime,
      })
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  function handleScroll() {
    if (!mainContent) return
    const { scrollTop, scrollHeight, clientHeight } = mainContent
    $scrollProgress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
  }

  // Apply theme reactively
  $: {
    const mode = resolveColorMode($settings.colorMode)
    const theme = getTheme($settings.theme, mode)
    applyTheme(theme, $settings.cssVariables)
  }

  onMount(async () => {
    await initSettings()
    await loadDocument()
  })
</script>

{#if error}
  <ErrorPage {error} type={errorType} />
{:else}
  <Toolbar />
  {#if $settings.showProgressBar}
    <ProgressBar />
  {/if}
  <div class="layout">
    {#if $showFileList}
      <aside class="sidebar sidebar-left">
        <!-- FileList component goes here in Task 9 -->
      </aside>
    {/if}
    <main class="main-content" bind:this={mainContent} on:scroll={handleScroll}>
      {#if $showSource}
        <pre class="source-view">{$documentState.rawMarkdown}</pre>
      {:else}
        <MarkdownContent />
      {/if}
    </main>
    {#if $showOutline}
      <aside class="sidebar sidebar-right">
        <!-- Outline component goes here in Task 9 -->
      </aside>
    {/if}
  </div>
  <ScrollTop />
{/if}
```

- [ ] **Step 5: Update main.ts with CSS imports**

`src/viewer/main.ts`:
```typescript
import App from './App.svelte'

const app = new App({
  target: document.getElementById('app')!,
})

export default app
```

- [ ] **Step 6: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/viewer/ src/viewer/styles/ src/viewer/stores/ src/viewer/components/
git commit -m "feat: add viewer page with core layout, rendering, and theme integration"
```

---

## Task 9: Sidebar Components (Outline + File List)

**Files:**
- Create: `src/viewer/components/Outline.svelte`
- Create: `src/viewer/components/FileList.svelte`
- Modify: `src/viewer/App.svelte` (plug in components)

- [ ] **Step 1: Create Outline component**

`src/viewer/components/Outline.svelte`:
```svelte
<script lang="ts">
  import { headings } from '../stores/document'
  import { onMount, onDestroy } from 'svelte'

  let activeId = ''
  let observer: IntersectionObserver

  onMount(() => {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeId = entry.target.id
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    $headings.forEach(h => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })
  })

  onDestroy(() => observer?.disconnect())

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
</script>

<nav class="outline">
  <h3 class="outline-title">Outline</h3>
  <ul class="outline-list">
    {#each $headings as heading}
      <li
        class="outline-item"
        class:active={heading.id === activeId}
        style="padding-left: {(heading.level - 1) * 12 + 8}px"
      >
        <button on:click={() => scrollTo(heading.id)}>
          {heading.text}
        </button>
      </li>
    {/each}
  </ul>
</nav>
```

- [ ] **Step 2: Create FileList component**

`src/viewer/components/FileList.svelte`:
```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { documentState } from '../stores/document'
  import { parseDirectoryListing } from '../../lib/file-list'

  let files: string[] = []
  let isFileProtocol = false

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
    } catch {
      files = []
    }
  })

  function openFile(filename: string) {
    const dirUrl = $documentState.url.substring(0, $documentState.url.lastIndexOf('/') + 1)
    const viewerUrl = chrome.runtime.getURL('src/viewer/index.html')
    window.location.href = `${viewerUrl}?url=${encodeURIComponent(dirUrl + filename)}`
  }
</script>

{#if isFileProtocol && files.length > 0}
  <nav class="file-list">
    <h3 class="file-list-title">Files</h3>
    <ul>
      {#each files as file}
        <li class:active={file === currentFile}>
          <button on:click={() => openFile(file)}>{file}</button>
        </li>
      {/each}
    </ul>
  </nav>
{/if}
```

- [ ] **Step 3: Plug components into App.svelte**

Replace the placeholder comments in `App.svelte`:
- `<!-- FileList component goes here in Task 9 -->` → `<FileList />`
- `<!-- Outline component goes here in Task 9 -->` → `<Outline />`

Add imports at the top.

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/viewer/components/Outline.svelte src/viewer/components/FileList.svelte src/viewer/App.svelte
git commit -m "feat: add outline navigation and file list sidebars"
```

---

## Task 10: Settings Panel

**Files:**
- Create: `src/viewer/components/settings/SettingsPanel.svelte`
- Create: `src/viewer/components/settings/ThemeSelector.svelte`
- Create: `src/viewer/components/settings/FontSettings.svelte`
- Create: `src/viewer/components/settings/LayoutSettings.svelte`
- Create: `src/viewer/components/settings/CSSEditor.svelte`
- Create: `src/viewer/components/settings/CSSVariables.svelte`
- Modify: `src/viewer/App.svelte`

- [ ] **Step 1: Install CodeMirror 6**

```bash
pnpm add @codemirror/view @codemirror/state @codemirror/lang-css @codemirror/theme-one-dark
```

- [ ] **Step 2: Create ThemeSelector**

`src/viewer/components/settings/ThemeSelector.svelte`:
```svelte
<script lang="ts">
  import { settings } from '../../stores/settings'
  import { getThemeNames, THEMES } from '../../../lib/theme/themes'
  import { importTheme, exportTheme } from '../../../lib/theme/engine'
  import { getTheme } from '../../../lib/theme/themes'
  import { resolveColorMode } from '../../../lib/theme/engine'

  const themeNames = getThemeNames()

  function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const text = await file.text()
      try {
        const theme = importTheme(text)
        settings.update(s => ({ ...s, cssVariables: theme.cssVariables, customCSS: theme.customCSS ?? s.customCSS }))
      } catch (e) {
        alert('Invalid theme file')
      }
    }
    input.click()
  }

  function handleExport() {
    const mode = resolveColorMode($settings.colorMode)
    const theme = { ...getTheme($settings.theme, mode), cssVariables: { ...getTheme($settings.theme, mode).cssVariables, ...$settings.cssVariables } }
    const blob = new Blob([exportTheme(theme)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mymd-theme-${$settings.theme}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
</script>

<section class="settings-section">
  <h4>Theme</h4>
  <div class="theme-grid">
    {#each themeNames as name}
      <button
        class="theme-card"
        class:active={$settings.theme === name}
        on:click={() => settings.update(s => ({ ...s, theme: name }))}
      >
        {name}
      </button>
    {/each}
  </div>

  <div class="settings-row">
    <label>Color Mode</label>
    <select bind:value={$settings.colorMode} on:change={() => settings.update(s => ({ ...s, colorMode: $settings.colorMode }))}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  </div>

  <div class="settings-row">
    <button on:click={handleImport}>Import Theme</button>
    <button on:click={handleExport}>Export Theme</button>
  </div>
</section>
```

- [ ] **Step 3: Create FontSettings**

`src/viewer/components/settings/FontSettings.svelte`:
```svelte
<script lang="ts">
  import { settings } from '../../stores/settings'
</script>

<section class="settings-section">
  <h4>Typography</h4>

  <div class="settings-row">
    <label>Font Family</label>
    <select bind:value={$settings.fontFamily}>
      <option value="system-ui, sans-serif">System Sans</option>
      <option value="Georgia, serif">Serif</option>
      <option value="ui-monospace, monospace">Monospace</option>
    </select>
  </div>

  <div class="settings-row">
    <label>Font Size: {$settings.fontSize}px</label>
    <input type="range" min="12" max="24" step="1" bind:value={$settings.fontSize} />
  </div>

  <div class="settings-row">
    <label>Line Height: {$settings.lineHeight}</label>
    <input type="range" min="1.2" max="2.0" step="0.1" bind:value={$settings.lineHeight} />
  </div>
</section>
```

- [ ] **Step 4: Create LayoutSettings**

`src/viewer/components/settings/LayoutSettings.svelte`:
```svelte
<script lang="ts">
  import { settings } from '../../stores/settings'
</script>

<section class="settings-section">
  <h4>Layout</h4>

  <div class="settings-row">
    <label>Content Width: {$settings.contentWidth}px</label>
    <input type="range" min="600" max="1400" step="50" bind:value={$settings.contentWidth} />
  </div>

  <div class="settings-row">
    <label><input type="checkbox" bind:checked={$settings.showOutline} /> Show Outline</label>
  </div>
  <div class="settings-row">
    <label><input type="checkbox" bind:checked={$settings.showFileList} /> Show File List</label>
  </div>
  <div class="settings-row">
    <label><input type="checkbox" bind:checked={$settings.showProgressBar} /> Show Progress Bar</label>
  </div>
  <div class="settings-row">
    <label><input type="checkbox" bind:checked={$settings.showStats} /> Show Stats</label>
  </div>
  <div class="settings-row">
    <label><input type="checkbox" bind:checked={$settings.showFrontmatter} /> Show Frontmatter</label>
  </div>
  <div class="settings-row">
    <label><input type="checkbox" bind:checked={$settings.autoRefresh} /> Auto Refresh</label>
  </div>
</section>
```

- [ ] **Step 5: Create CSSEditor**

`src/viewer/components/settings/CSSEditor.svelte`:
```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { settings } from '../../stores/settings'
  import { EditorView, basicSetup } from '@codemirror/view'
  import { EditorState } from '@codemirror/state'
  import { css } from '@codemirror/lang-css'
  import { oneDark } from '@codemirror/theme-one-dark'

  let editorEl: HTMLElement
  let view: EditorView

  onMount(() => {
    const state = EditorState.create({
      doc: $settings.customCSS,
      extensions: [
        basicSetup,
        css(),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            settings.update(s => ({ ...s, customCSS: update.state.doc.toString() }))
          }
        }),
      ],
    })
    view = new EditorView({ state, parent: editorEl })
    return () => view.destroy()
  })
</script>

<section class="settings-section">
  <h4>Custom CSS</h4>
  <div class="css-editor" bind:this={editorEl}></div>
</section>
```

- [ ] **Step 6: Create CSSVariables panel**

`src/viewer/components/settings/CSSVariables.svelte`:
```svelte
<script lang="ts">
  import { settings } from '../../stores/settings'
  import { VARIABLE_METADATA } from '../../../lib/theme/variables'
  import { getTheme } from '../../../lib/theme/themes'
  import { resolveColorMode } from '../../../lib/theme/engine'

  $: currentTheme = getTheme($settings.theme, resolveColorMode($settings.colorMode))

  function getEffectiveValue(varName: string): string {
    return $settings.cssVariables[varName] ?? currentTheme.cssVariables[varName] ?? ''
  }

  function setVariable(varName: string, value: string) {
    settings.update(s => ({
      ...s,
      cssVariables: { ...s.cssVariables, [varName]: value },
    }))
  }

  function resetVariable(varName: string) {
    settings.update(s => {
      const vars = { ...s.cssVariables }
      delete vars[varName]
      return { ...s, cssVariables: vars }
    })
  }

  const colorVars = Object.entries(VARIABLE_METADATA).filter(([, m]) => m.type === 'color')
</script>

<section class="settings-section">
  <h4>CSS Variables</h4>
  <div class="variables-grid">
    {#each colorVars as [varName, meta]}
      <div class="variable-row">
        <label>{meta.label}</label>
        <input
          type="color"
          value={getEffectiveValue(varName)}
          on:input={(e) => setVariable(varName, e.currentTarget.value)}
        />
        {#if $settings.cssVariables[varName]}
          <button class="reset-btn" on:click={() => resetVariable(varName)}>↺</button>
        {/if}
      </div>
    {/each}
  </div>
</section>
```

- [ ] **Step 7: Create SettingsPanel**

`src/viewer/components/settings/SettingsPanel.svelte`:
```svelte
<script lang="ts">
  import { showSettings } from '../../stores/ui'
  import ThemeSelector from './ThemeSelector.svelte'
  import FontSettings from './FontSettings.svelte'
  import LayoutSettings from './LayoutSettings.svelte'
  import CSSEditor from './CSSEditor.svelte'
  import CSSVariables from './CSSVariables.svelte'

  function close() {
    $showSettings = false
  }
</script>

{#if $showSettings}
  <div class="settings-overlay" on:click={close} on:keydown={(e) => e.key === 'Escape' && close()}>
    <div class="settings-panel" on:click|stopPropagation role="dialog">
      <div class="settings-header">
        <h2>Settings</h2>
        <button class="close-btn" on:click={close}>✕</button>
      </div>
      <div class="settings-body">
        <ThemeSelector />
        <FontSettings />
        <LayoutSettings />
        <CSSVariables />
        <CSSEditor />
      </div>
    </div>
  </div>
{/if}
```

- [ ] **Step 8: Plug into App.svelte**

Add `<SettingsPanel />` import and usage in App.svelte, after the layout div.

- [ ] **Step 9: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 10: Commit**

```bash
git add src/viewer/components/settings/
git commit -m "feat: add settings panel with theme, font, layout, CSS editor, and variable tuning"
```

---

## Task 11: Advanced Features (Frontmatter, Source View, Image Preview, Shortcuts, Auto-refresh, Scroll Memory)

**Files:**
- Create: `src/viewer/components/FrontmatterBanner.svelte`
- Create: `src/viewer/components/SourceView.svelte`
- Create: `src/viewer/components/ImagePreview.svelte`
- Modify: `src/viewer/App.svelte`

- [ ] **Step 1: Create FrontmatterBanner**

`src/viewer/components/FrontmatterBanner.svelte`:
```svelte
<script lang="ts">
  import { frontmatter } from '../stores/document'
  import { settings } from '../stores/settings'
</script>

{#if $settings.showFrontmatter && $frontmatter}
  <div class="frontmatter-banner">
    <table>
      {#each Object.entries($frontmatter) as [key, value]}
        <tr>
          <td class="fm-key">{key}</td>
          <td class="fm-value">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</td>
        </tr>
      {/each}
    </table>
  </div>
{/if}
```

- [ ] **Step 2: Create SourceView with Shiki**

`src/viewer/components/SourceView.svelte`:
```svelte
<script lang="ts">
  import { documentState } from '../stores/document'
  import { highlightCode } from '../../lib/markdown/highlighter'
  import { onMount } from 'svelte'

  let highlightedHTML = ''

  $: {
    highlightCode($documentState.rawMarkdown, 'markdown', 'github-dark').then(html => {
      highlightedHTML = html
    })
  }
</script>

<div class="source-view">
  {@html highlightedHTML}
</div>
```

- [ ] **Step 3: Create ImagePreview**

`src/viewer/components/ImagePreview.svelte`:
```svelte
<script lang="ts">
  let visible = false
  let imgSrc = ''
  let scale = 1

  export function show(src: string) {
    imgSrc = src
    scale = 1
    visible = true
  }

  function close() {
    visible = false
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault()
    scale = Math.max(0.1, Math.min(5, scale - e.deltaY * 0.001))
  }
</script>

{#if visible}
  <div class="image-overlay" on:click={close} on:wheel={handleWheel} role="dialog">
    <img src={imgSrc} alt="" style="transform: scale({scale})" on:click|stopPropagation />
  </div>
{/if}
```

- [ ] **Step 4: Add keyboard shortcuts to App.svelte**

Add in `onMount`:
```typescript
function handleKeydown(e: KeyboardEvent) {
  const { ctrlKey, shiftKey, key } = e
  if (ctrlKey && shiftKey) {
    if (key === 'O') { e.preventDefault(); showOutline.update(v => !v) }
    if (key === 'S') { e.preventDefault(); showSource.update(v => !v) }
    if (key === 'D') { e.preventDefault(); settings.update(s => ({
      ...s, colorMode: s.colorMode === 'dark' ? 'light' : 'dark'
    })) }
  }
}
document.addEventListener('keydown', handleKeydown)
```

- [ ] **Step 5: Add auto-refresh logic to App.svelte**

Add in `onMount` after `loadDocument()`:
```typescript
let refreshInterval: ReturnType<typeof setInterval>

function startAutoRefresh() {
  if (refreshInterval) clearInterval(refreshInterval)
  if (!$settings.autoRefresh) return

  refreshInterval = setInterval(async () => {
    try {
      const raw = await fetchContent($documentState.url)
      if (raw !== $documentState.rawMarkdown) {
        const scrollPos = mainContent?.scrollTop ?? 0
        await loadDocument()
        if (mainContent) mainContent.scrollTop = scrollPos
      }
    } catch { /* ignore refresh errors */ }
  }, $settings.autoRefreshInterval)
}

startAutoRefresh()
// Re-start when settings change
settings.subscribe(() => startAutoRefresh())
```

- [ ] **Step 6: Add scroll position memory**

Add to App.svelte:
```typescript
import { loadLocal, saveLocal } from '../lib/storage'

// Restore scroll position
onMount(async () => {
  if ($settings.rememberScrollPosition) {
    const positions = await loadLocal<Record<string, number>>('scrollPositions') ?? {}
    const saved = positions[$documentState.url]
    if (saved && mainContent) {
      setTimeout(() => mainContent.scrollTop = saved, 100)
    }
  }
})

// Save scroll position periodically (beforeunload + async is unreliable)
let scrollSaveTimeout: ReturnType<typeof setTimeout>
function debouncedSaveScroll() {
  clearTimeout(scrollSaveTimeout)
  scrollSaveTimeout = setTimeout(async () => {
    if ($settings.rememberScrollPosition && $documentState.url) {
      const positions = await loadLocal<Record<string, number>>('scrollPositions') ?? {}
      positions[$documentState.url] = mainContent?.scrollTop ?? 0
      await saveLocal('scrollPositions', positions)
    }
  }, 1000)
}
// Call debouncedSaveScroll() from the handleScroll function
```

- [ ] **Step 7: Wire image click handler in MarkdownContent**

Add to `MarkdownContent.svelte` `afterUpdate`:
```typescript
contentEl?.querySelectorAll('img').forEach(img => {
  img.style.cursor = 'zoom-in'
  img.addEventListener('click', () => imagePreview?.show(img.src))
})
```

- [ ] **Step 8: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/viewer/components/ src/viewer/App.svelte
git commit -m "feat: add frontmatter, source view, image preview, shortcuts, auto-refresh, scroll memory"
```

---

## Task 12: Print/PDF Styles & Content CSS Polish

**Files:**
- Create: `src/viewer/styles/print.css`
- Finalize: `src/viewer/styles/content.css`

- [ ] **Step 1: Write comprehensive content.css**

`src/viewer/styles/content.css` — complete typography for all markdown elements (~300 lines using `--mymd-*` variables). Covers: headings, paragraphs, lists, tables, code blocks (inline/block), blockquotes, alerts, task lists, footnotes, abbreviations, mark, ins, definition lists, images, horizontal rules, links.

- [ ] **Step 2: Write print.css**

`src/viewer/styles/print.css`:
```css
@media print {
  .toolbar, .sidebar, .progress-bar, .scroll-top,
  .settings-overlay, .image-overlay {
    display: none !important;
  }

  .main-content {
    overflow: visible !important;
    height: auto !important;
  }

  .mymd-content {
    max-width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .layout {
    display: block !important;
  }

  a[href]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: #666;
  }

  pre, code {
    white-space: pre-wrap !important;
    word-break: break-all !important;
  }

  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
  }

  pre, table, figure {
    page-break-inside: avoid;
  }
}
```

- [ ] **Step 3: Import print.css in main.ts**

```typescript
import './styles/print.css'
```

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/viewer/styles/
git commit -m "feat: add comprehensive content typography and print/PDF styles"
```

---

## Task 13: Extension Icons & Manifest Polish

**Files:**
- Create: `src/assets/icons/icon16.png`
- Create: `src/assets/icons/icon48.png`
- Create: `src/assets/icons/icon128.png`
- Finalize: `manifest.json`

- [ ] **Step 1: Generate placeholder icons**

Use a simple canvas script or create SVG-based icons. For now, generate colored placeholder PNGs:

```bash
# Using ImageMagick if available, or create simple SVG icons
# Fallback: create minimal SVG files and convert later
```

Create simple SVG icons at `src/assets/icons/` — a stylized "M" or markdown symbol.

- [ ] **Step 2: Finalize manifest.json**

Ensure all entries are correct:
- Verify `content_scripts` matches and globs
- Verify `web_accessible_resources`
- Add `"action": {}` for toolbar icon
- Verify all permission entries

- [ ] **Step 3: Verify full build and load in Chrome**

Run: `pnpm build`
Then load `dist/` as unpacked extension in `chrome://extensions`.

Expected: Extension loads without errors, icon visible in toolbar.

- [ ] **Step 4: Commit**

```bash
git add src/assets/ manifest.json
git commit -m "feat: add extension icons and finalize manifest"
```

---

## Task 14: Test Fixture & Manual Testing

**Files:**
- Create: `tests/fixtures/test-full.md`

- [ ] **Step 1: Create comprehensive test markdown file**

`tests/fixtures/test-full.md` — a markdown file that exercises every supported syntax feature:
- All heading levels
- Paragraphs, bold, italic, strikethrough
- GFM table, multi-line table
- Task list, ordered list, nested list
- Code blocks (JS, Python, Bash, unknown language)
- Mermaid diagram
- LaTeX math (inline and block)
- Emoji, superscript, subscript
- Footnotes, abbreviations
- Mark, ins, definition list
- Alert blocks (NOTE, TIP, WARNING, DANGER)
- Wiki links
- Images, links
- Blockquotes
- Horizontal rule
- YAML frontmatter

- [ ] **Step 2: Manual test in Chrome**

Load extension, open `test-full.md` via `file://`. Verify:
- All syntax renders correctly
- Outline sidebar shows all headings
- Theme switching works
- Settings panel opens and controls work
- Source view toggles
- Print preview looks clean

- [ ] **Step 3: Fix any issues found during manual testing**

- [ ] **Step 4: Commit**

```bash
git add tests/fixtures/test-full.md
git commit -m "test: add comprehensive markdown test fixture"
```

---

## Task 15: Create GitHub Repository & Push

- [ ] **Step 1: Create remote repository**

```bash
gh repo create chasey-myagi/mymd --public --description "Beautiful, customizable Markdown preview for Chrome" --source /Users/chasey/Dev/browser-extensions/mymd
```

Note: Verify the exact account name. If `chasey-myagi` doesn't work, try `chasey.myagi` or check with `gh auth status`.

- [ ] **Step 2: Push all commits**

```bash
cd /Users/chasey/Dev/browser-extensions/mymd
git remote add origin https://github.com/chasey-myagi/mymd.git  # if not already set
git push -u origin main
```

- [ ] **Step 3: Verify on GitHub**

Run: `gh repo view chasey-myagi/mymd --web`
Expected: Repository visible with all commits.
