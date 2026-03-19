---
title: mymd Showcase
author: mymd Team
date: 2026-03-20
---

# mymd — Beautiful Markdown Preview

> A powerful, customizable Markdown reader for Chrome. Open any `.md` file and see it rendered beautifully.

## Typography & Text Formatting

Markdown supports **bold text**, *italic text*, ***bold italic***, ~~strikethrough~~, ==highlighted text==, and `inline code` formatting. You can also use ^superscript^ and ~subscript~ for scientific notation like H~2~O and E=mc^2^.

Here's a [link to GitHub](https://github.com) and an auto-detected URL: https://example.com

## Code Highlighting

Powered by **Shiki** with VS Code themes — supporting 20+ languages out of the box.

```javascript
// Fetch and render a markdown file
async function renderMarkdown(url) {
  const response = await fetch(url);
  const markdown = await response.text();

  return md.render(markdown, {
    highlight: (code, lang) => shiki.highlight(code, { lang }),
    math: true,
    mermaid: true,
  });
}
```

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class Theme:
    """A mymd theme definition."""
    name: str
    color_mode: str  # "light" | "dark"
    css_variables: dict[str, str]
    custom_css: Optional[str] = None

    def apply(self, element: HTMLElement) -> None:
        for key, value in self.css_variables.items():
            element.style.setProperty(key, value)
```

```bash
# Install mymd from source
git clone https://github.com/chasey-myagi/mymd.git
cd mymd && pnpm install && pnpm build

# Load in Chrome
# 1. Open chrome://extensions
# 2. Enable Developer Mode
# 3. Load unpacked → select dist/
```

## Mathematics

Inline math: $E = mc^2$, $\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$

Block equations:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}
$$

## Tables

| Feature | Free (md-reader) | mymd |
|---------|:-----------------:|:----:|
| Markdown Rendering | ✅ | ✅ |
| Auto Outline | ✅ | ✅ |
| Code Highlighting | highlight.js | **Shiki** (VS Code) |
| Math (LaTeX) | ✅ | ✅ (KaTeX) |
| Mermaid Diagrams | ✅ | ✅ |
| Themes | 2 (light/dark) | **16** (8×2) |
| Custom CSS | ❌ Pro | ✅ Free |
| CSS Variables | ❌ | ✅ 30+ |
| Theme Import/Export | ❌ | ✅ JSON |
| Folder Directory | ❌ Pro | ✅ Free |
| i18n (中/EN) | ❌ | ✅ |
| Open Source | ❌ | ✅ MIT |

## Task Lists

- [x] Markdown rendering with 14+ plugins
- [x] Shiki code highlighting
- [x] KaTeX math support
- [x] Mermaid diagrams
- [x] 8 theme pairs (light + dark)
- [x] Floating glass sidebar
- [x] Extension popup settings
- [x] Bilingual support (中文/English)
- [ ] Chrome Web Store publishing
- [ ] Community theme marketplace

## Alerts

> [!NOTE]
> mymd is completely free and open source. No premium tiers, no subscriptions.

> [!TIP]
> Use `Ctrl+Shift+S` to quickly toggle between rendered view and source code.

> [!WARNING]
> Remember to enable "Allow access to file URLs" in extension settings for local file preview.

## Blockquotes

> "The best Markdown reader is the one that gets out of your way and lets the content shine."
>
> — The mymd Philosophy

## Lists

### Supported Syntax Extensions

1. **GFM** — Tables, task lists, strikethrough, autolinks
2. **Math** — LaTeX via KaTeX ($inline$ and $$block$$)
3. **Diagrams** — Mermaid flowcharts, sequence, gantt
4. **Emoji** — :smile: :rocket: :heart:
5. **Typography** — Superscript, subscript, footnotes[^1], abbreviations
6. **Containers** — Alerts, custom blocks, definition lists

### Available Themes

- **Classic**: GitHub, Typora, Academic, Reader, Minimal
- **Creative**: Handwriting, Cyberpunk, Retro

## Definition Lists

mymd
: A beautiful, customizable Markdown preview extension for Chrome.

Liquid Glass
: A UI design pattern inspired by Apple Vision Pro, using backdrop-filter blur and multi-layer transparency.

## Footnotes

[^1]: Footnotes are rendered at the bottom of the document with back-references.

---

*Built with Svelte, Shiki, KaTeX, and Mermaid. Open source at [github.com/chasey-myagi/mymd](https://github.com/chasey-myagi/mymd).*
