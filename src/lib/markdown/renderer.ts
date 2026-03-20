import MarkdownIt from 'markdown-it'
import { full as emoji } from 'markdown-it-emoji'
import { highlightCode } from './highlighter'
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
import DOMPurify from 'dompurify'

// Register DOMPurify hook once at module level to allow Shiki's color styles on <span> and <pre>
DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  if (data.attrName === 'style' && (node.tagName === 'SPAN' || node.tagName === 'PRE')) {
    const clean = data.attrValue
      .split(';')
      .filter(s => /^\s*(color|background-color)\s*:/.test(s))
      .join(';')
    data.attrValue = clean
    data.forceKeepAttr = true
  }
})

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

  // Add heading IDs for anchor links (with per-render deduplication via env)
  const defaultHeadingOpen = md.renderer.rules.heading_open
  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    if (!env.usedIds) env.usedIds = new Map<string, number>()
    const token = tokens[idx]
    const contentToken = tokens[idx + 1]
    const text = contentToken.children
      ?.filter(t => t.type === 'text' || t.type === 'code_inline')
      .map(t => t.content)
      .join('') ?? ''
    let id = text.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '')
    const count = env.usedIds.get(id) ?? 0
    env.usedIds.set(id, count + 1)
    if (count > 0) id = `${id}-${count}`
    token.attrSet('id', id)
    if (defaultHeadingOpen) {
      return defaultHeadingOpen(tokens, idx, options, env, self)
    }
    return self.renderToken(tokens, idx, options)
  }

  return md
}

let cachedMd: MarkdownIt | null = null

export async function renderMarkdown(markdown: string, codeTheme: string = 'github-dark'): Promise<string> {
  if (!cachedMd) cachedMd = createRenderer()
  let html = cachedMd.render(markdown)

  // Post-process: replace <pre><code class="language-xxx"> with Shiki output
  const codeBlockRegex = /<pre><code class="language-([\w+#.-]+)">([\s\S]*?)<\/code><\/pre>/g
  const matches = [...html.matchAll(codeBlockRegex)]

  for (const match of matches) {
    const lang = match[1]
    const code = match[2]
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    const highlighted = await highlightCode(code, lang, codeTheme)
    html = html.replace(match[0], () => highlighted)
  }

  html = DOMPurify.sanitize(html, {
    ADD_TAGS: ['math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'msqrt', 'mover', 'munder', 'munderover', 'mtable', 'mtr', 'mtd', 'annotation'],
    ADD_ATTR: ['xmlns', 'encoding', 'class', 'id', 'href', 'target', 'rel'],
  })

  return html
}
