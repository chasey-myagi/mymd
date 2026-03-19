import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import { wikilinkPlugin } from '../../../src/lib/markdown/plugins/wikilink'

function createMd() {
  const md = new MarkdownIt()
  md.use(wikilinkPlugin)
  return md
}

describe('wikilinkPlugin', () => {
  it('renders [[page]] as wikilink anchor', () => {
    const md = createMd()
    const html = md.render('[[my-page]]')
    expect(html).toContain('<a href="my-page"')
    expect(html).toContain('class="wikilink"')
    expect(html).toContain('my-page</a>')
  })

  it('renders [[page|display]] with custom display text', () => {
    const md = createMd()
    const html = md.render('[[my-page|Display Text]]')
    expect(html).toContain('href="my-page"')
    expect(html).toContain('Display Text</a>')
    expect(html).not.toContain('my-page</a>')
  })

  it('handles spaces in page name', () => {
    const md = createMd()
    const html = md.render('[[My Page]]')
    expect(html).toContain('href="My Page"')
    expect(html).toContain('My Page</a>')
  })

  it('handles display text with pipe characters', () => {
    const md = createMd()
    const html = md.render('[[page|text|more]]')
    expect(html).toContain('href="page"')
    expect(html).toContain('text|more</a>')
  })

  it('does not affect regular markdown links', () => {
    const md = createMd()
    const html = md.render('[regular](http://example.com)')
    expect(html).toContain('href="http://example.com"')
    expect(html).not.toContain('class="wikilink"')
  })

  it('inline wikilink within a paragraph', () => {
    const md = createMd()
    const html = md.render('See [[docs]] for more info')
    expect(html).toContain('href="docs"')
    expect(html).toContain('class="wikilink"')
  })
})
