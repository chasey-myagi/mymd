# mymd

Beautiful, customizable Markdown preview for Chrome.

Open any `.md` file in your browser — locally or on the web — and see it rendered with professional typography, syntax highlighting, and your choice of theme.

## Features

**Rich Markdown Rendering**
- CommonMark + GitHub Flavored Markdown
- LaTeX math via KaTeX (`$inline$` and `$$block$$`)
- Mermaid diagrams (flowcharts, sequence, gantt, and more)
- Shiki code highlighting with VS Code themes
- 14+ syntax extensions: emoji, footnotes, task lists, alerts, wiki links, sup/sub, mark, abbreviations, definition lists, and more

**Themes & Customization**
- 8 built-in theme pairs (light + dark): GitHub, Typora, Academic, Reader, Minimal, Handwriting, Cyberpunk, Retro
- Light / Dark / System auto-detection
- 30+ CSS variables for fine-grained control
- Custom CSS editor with CodeMirror 6
- Theme import/export (JSON)

**Reading Experience**
- Auto-generated outline navigation (TOC sidebar)
- Same-directory file list for `file://` browsing
- Reading progress bar
- Adjustable content width, font family, font size, line height
- YAML frontmatter display
- Word count & reading time

**Productivity**
- Auto-refresh on file changes
- Scroll position memory per document
- Keyboard shortcuts (`Ctrl+Shift+O/S/D`)
- Click-to-zoom images
- Print/PDF optimized styles
- Raw source view with syntax highlighting

## Install

### From Source

```bash
git clone https://github.com/chasey-myagi/mymd.git
cd mymd
pnpm install
pnpm build
```

Then load in Chrome:
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → select the `dist/` folder
4. For local files: enable "Allow access to file URLs" in the extension details

### Usage

Open any `.md`, `.mkd`, `.mdx`, or `.markdown` file — mymd takes over automatically.

## Themes

| Theme | Light | Dark | Personality |
|-------|-------|------|-------------|
| **GitHub** | Classic GitHub rendering | GitHub dark mode | Developer standard |
| **Typora** | Elegant, refined | Warm dark | Writing app feel |
| **Academic** | Scholarly, serif-friendly | Dignified dark | LaTeX/journal style |
| **Reader** | Warm sepia/cream | Gentle dark | Long reading sessions |
| **Minimal** | Maximum whitespace | Clean dark | Content breathes |
| **Handwriting** | Paper & ink | Chalkboard | Organic, warm |
| **Cyberpunk** | Electric accents | Neon on black | Futuristic |
| **Retro** | Amber warmth | Terminal green | 80s nostalgia |

Every theme supports light and dark modes. Switch instantly from the toolbar or use `Ctrl+Shift+D`.

## Customization

### Quick Adjustments
Open Settings (toolbar gear icon) to adjust:
- Theme selection
- Font family, size, and line height
- Content width
- Toggle UI elements (outline, file list, progress bar, stats)

### CSS Variables
Fine-tune any theme via the CSS Variables panel — 30+ design tokens covering colors, spacing, shadows, and border radius.

### Custom CSS
Write arbitrary CSS in the built-in editor (powered by CodeMirror 6) for complete control.

### Theme Sharing
Export your customized theme as JSON and share it with others. Import community themes with one click.

## Tech Stack

- **Svelte 4** + TypeScript
- **Vite** + CRXJS (Chrome Extension build)
- **markdown-it** with 14+ plugins
- **Shiki** for code highlighting
- **KaTeX** for math rendering
- **Mermaid** for diagrams
- **CodeMirror 6** for CSS editing

## Development

```bash
pnpm install
pnpm dev          # Development with HMR
pnpm build        # Production build
pnpm test         # Run tests (watch mode)
pnpm test:run     # Run tests once
```

## License

MIT
