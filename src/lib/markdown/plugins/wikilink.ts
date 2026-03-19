import type MarkdownIt from 'markdown-it'

export function wikilinkPlugin(md: MarkdownIt): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  md.inline.ruler.push('wikilink', (state: any, silent: boolean) => {
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
