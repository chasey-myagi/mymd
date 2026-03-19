import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import { mermaidPlugin } from '../../../src/lib/markdown/plugins/mermaid'

function createMd() {
  const md = new MarkdownIt()
  md.use(mermaidPlugin)
  return md
}

describe('mermaidPlugin', () => {
  it('wraps mermaid code block in div.mermaid', () => {
    const md = createMd()
    const input = '```mermaid\ngraph TD\n  A --> B\n```'
    const html = md.render(input)
    expect(html).toContain('<div class="mermaid">')
    expect(html).toContain('graph TD')
    expect(html).not.toContain('<code')
  })

  it('does not affect normal code fences', () => {
    const md = createMd()
    const input = '```javascript\nconsole.log("hi")\n```'
    const html = md.render(input)
    expect(html).toContain('<code')
    expect(html).not.toContain('class="mermaid"')
  })

  it('does not affect code fences without language', () => {
    const md = createMd()
    const input = '```\nsome code\n```'
    const html = md.render(input)
    expect(html).toContain('<code')
    expect(html).not.toContain('class="mermaid"')
  })

  it('escapes HTML in mermaid content', () => {
    const md = createMd()
    const input = '```mermaid\ngraph TD\n  A["<script>"] --> B\n```'
    const html = md.render(input)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
