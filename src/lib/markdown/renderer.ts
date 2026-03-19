import MarkdownIt from 'markdown-it'
import { full as emoji } from 'markdown-it-emoji'
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
