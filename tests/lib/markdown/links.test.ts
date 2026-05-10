import { describe, it, expect } from 'vitest'
import {
  hasExplicitProtocol,
  hasMdExtension,
  isAnchorOnly,
  resolveMarkdownHref,
} from '../../../src/lib/markdown/links'

describe('hasMdExtension', () => {
  it('matches common markdown extensions', () => {
    expect(hasMdExtension('foo.md')).toBe(true)
    expect(hasMdExtension('foo.MD')).toBe(true)
    expect(hasMdExtension('a/b/c.markdown')).toBe(true)
    expect(hasMdExtension('notes.mkd')).toBe(true)
    expect(hasMdExtension('post.mdx')).toBe(true)
  })

  it('matches with query and fragment', () => {
    expect(hasMdExtension('foo.md?v=2')).toBe(true)
    expect(hasMdExtension('foo.md#section')).toBe(true)
    expect(hasMdExtension('foo.md?v=2#section')).toBe(true)
  })

  it('rejects non-markdown extensions', () => {
    expect(hasMdExtension('foo.html')).toBe(false)
    expect(hasMdExtension('foo.txt')).toBe(false)
    expect(hasMdExtension('foo')).toBe(false)
    expect(hasMdExtension('https://example.com/')).toBe(false)
  })
})

describe('isAnchorOnly', () => {
  it('detects pure fragments', () => {
    expect(isAnchorOnly('#section')).toBe(true)
    expect(isAnchorOnly('#')).toBe(true)
  })

  it('rejects non-fragments', () => {
    expect(isAnchorOnly('foo.md#section')).toBe(false)
    expect(isAnchorOnly('https://example.com/#x')).toBe(false)
    expect(isAnchorOnly('')).toBe(false)
  })
})

describe('hasExplicitProtocol', () => {
  it('detects common protocols', () => {
    expect(hasExplicitProtocol('http://x')).toBe(true)
    expect(hasExplicitProtocol('https://x')).toBe(true)
    expect(hasExplicitProtocol('mailto:a@b.c')).toBe(true)
    expect(hasExplicitProtocol('tel:+1')).toBe(true)
    expect(hasExplicitProtocol('file:///x')).toBe(true)
  })

  it('rejects relative paths and anchors', () => {
    expect(hasExplicitProtocol('./foo.md')).toBe(false)
    expect(hasExplicitProtocol('foo/bar.md')).toBe(false)
    expect(hasExplicitProtocol('#anchor')).toBe(false)
    expect(hasExplicitProtocol('//example.com')).toBe(false) // protocol-relative — caller's choice
  })
})

describe('resolveMarkdownHref', () => {
  const fileBase = 'file:///home/user/notes/index.md'
  const httpBase = 'https://example.com/docs/index.md'

  it('returns null on empty inputs', () => {
    expect(resolveMarkdownHref('', fileBase, false)).toBeNull()
    expect(resolveMarkdownHref('foo.md', '', false)).toBeNull()
    expect(resolveMarkdownHref('   ', fileBase, false)).toBeNull()
  })

  it('resolves relative .md against file:// base', () => {
    expect(resolveMarkdownHref('./other.md', fileBase, false))
      .toBe('file:///home/user/notes/other.md')
    expect(resolveMarkdownHref('../sibling/x.md', fileBase, false))
      .toBe('file:///home/user/sibling/x.md')
  })

  it('resolves relative .md against https base', () => {
    expect(resolveMarkdownHref('other.md', httpBase, false))
      .toBe('https://example.com/docs/other.md')
  })

  it('passes through absolute URLs', () => {
    expect(resolveMarkdownHref('https://x.com/a.md', fileBase, false))
      .toBe('https://x.com/a.md')
    expect(resolveMarkdownHref('file:///abs/path/a.md', httpBase, false))
      .toBe('file:///abs/path/a.md')
  })

  it('appends .md for wikilinks without an extension', () => {
    expect(resolveMarkdownHref('My Page', fileBase, true))
      .toBe('file:///home/user/notes/My%20Page.md')
    expect(resolveMarkdownHref('subdir/page', fileBase, true))
      .toBe('file:///home/user/notes/subdir/page.md')
  })

  it('keeps wikilinks that already have an extension', () => {
    expect(resolveMarkdownHref('page.md', fileBase, true))
      .toBe('file:///home/user/notes/page.md')
    expect(resolveMarkdownHref('image.png', fileBase, true))
      .toBe('file:///home/user/notes/image.png')
  })

  it('preserves fragment when appending .md to wikilink', () => {
    expect(resolveMarkdownHref('Page#section', fileBase, true))
      .toBe('file:///home/user/notes/Page.md#section')
  })

  it('treats anchor-only wikilinks as in-page', () => {
    expect(resolveMarkdownHref('#section', fileBase, true))
      .toBe('file:///home/user/notes/index.md#section')
  })

  it('returns null when base URL is invalid', () => {
    expect(resolveMarkdownHref('a.md', 'not a url', false)).toBeNull()
  })
})
