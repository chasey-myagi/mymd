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
