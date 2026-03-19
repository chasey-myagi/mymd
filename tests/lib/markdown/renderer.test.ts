import { describe, it, expect, beforeAll } from 'vitest'
import MarkdownIt from 'markdown-it'
import { createRenderer } from '../../../src/lib/markdown/renderer'

let md: MarkdownIt

beforeAll(() => {
  md = createRenderer()
})

describe('createRenderer', () => {
  it('renders basic headings', () => {
    const html = md.render('# Hello')
    expect(html).toContain('<h1')
    expect(html).toContain('Hello')
  })

  it('adds id to headings', () => {
    const html = md.render('# My Heading')
    expect(html).toContain('id="my-heading"')
  })

  it('renders bold text', () => {
    const html = md.render('**bold**')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('renders GFM tables', () => {
    const input = `| a | b |\n|---|---|\n| 1 | 2 |`
    const html = md.render(input)
    expect(html).toContain('<table>')
    expect(html).toContain('<td>')
  })

  it('renders task lists', () => {
    const input = '- [x] done\n- [ ] todo'
    const html = md.render(input)
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('checked')
  })

  it('renders emoji :smile:', () => {
    const html = md.render(':smile:')
    expect(html).toContain('😄')
  })

  it('renders superscript', () => {
    const html = md.render('x^2^')
    expect(html).toContain('<sup>2</sup>')
  })

  it('renders subscript', () => {
    const html = md.render('H~2~O')
    expect(html).toContain('<sub>2</sub>')
  })

  it('renders footnotes', () => {
    const input = 'text[^1]\n\n[^1]: footnote'
    const html = md.render(input)
    expect(html).toContain('footnote')
  })

  it('renders mark (highlight)', () => {
    const html = md.render('==highlighted==')
    expect(html).toContain('<mark>highlighted</mark>')
  })

  it('renders ins (insertion)', () => {
    const html = md.render('++inserted++')
    expect(html).toContain('<ins>inserted</ins>')
  })

  it('renders math (katex) inline', () => {
    const html = md.render('$E=mc^2$')
    expect(html).toContain('katex')
  })

  it('renders math (katex) block', () => {
    const html = md.render('$$\nE=mc^2\n$$')
    expect(html).toContain('katex')
  })

  it('renders alerts', () => {
    const input = '> [!NOTE]\n> This is a note'
    const html = md.render(input)
    expect(html.toLowerCase()).toContain('note')
  })

  it('renders mermaid via mermaid plugin', () => {
    const input = '```mermaid\ngraph TD\n  A --> B\n```'
    const html = md.render(input)
    expect(html).toContain('class="mermaid"')
    expect(html).toContain('graph TD')
  })

  it('renders wikilinks [[page]]', () => {
    const html = md.render('[[my-page]]')
    expect(html).toContain('href="my-page"')
    expect(html).toContain('class="wikilink"')
    expect(html).toContain('my-page')
  })

  it('renders wikilinks with display text [[page|text]]', () => {
    const html = md.render('[[my-page|Display Text]]')
    expect(html).toContain('href="my-page"')
    expect(html).toContain('Display Text')
  })
})
