import { describe, it, expect } from 'vitest'
import {
  hasMdExtension,
  isAnchorOnly,
  isSafeExternal,
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

describe('isSafeExternal', () => {
  it('matches http(s) and ftp', () => {
    expect(isSafeExternal('http://x')).toBe(true)
    expect(isSafeExternal('https://x')).toBe(true)
    expect(isSafeExternal('HTTPS://X')).toBe(true)
    expect(isSafeExternal('ftp://x')).toBe(true)
  })

  it('rejects mailto/tel/javascript/file', () => {
    expect(isSafeExternal('mailto:a@b.c')).toBe(false)
    expect(isSafeExternal('tel:+1')).toBe(false)
    expect(isSafeExternal('javascript:alert(1)')).toBe(false)
    expect(isSafeExternal('file:///x')).toBe(false)
  })

  it('rejects relative paths and anchors', () => {
    expect(isSafeExternal('./foo.md')).toBe(false)
    expect(isSafeExternal('foo/bar.md')).toBe(false)
    expect(isSafeExternal('#anchor')).toBe(false)
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

  it('keeps wikilinks that already have a markdown extension', () => {
    expect(resolveMarkdownHref('page.md', fileBase, true))
      .toBe('file:///home/user/notes/page.md')
    expect(resolveMarkdownHref('page.MARKDOWN', fileBase, true))
      .toBe('file:///home/user/notes/page.MARKDOWN')
  })

  it('still appends .md to wikilinks with non-markdown extensions', () => {
    // Names like `v1.2` or `2024.01.05 notes` look like extensions to a
    // naive regex but are still markdown page references.
    expect(resolveMarkdownHref('v1.2', fileBase, true))
      .toBe('file:///home/user/notes/v1.2.md')
    expect(resolveMarkdownHref('2024.01.05 notes', fileBase, true))
      .toBe('file:///home/user/notes/2024.01.05%20notes.md')
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
