import { describe, it, expect } from 'vitest'
import { parseDirectoryListing } from '../../src/lib/file-list'

describe('parseDirectoryListing', () => {
  it('extracts .md files from HTML directory listing', () => {
    const html = `
      <a href="readme.md">readme.md</a>
      <a href="notes.markdown">notes.markdown</a>
      <a href="index.html">index.html</a>
      <a href="doc.mdx">doc.mdx</a>
    `
    const result = parseDirectoryListing(html)
    expect(result).toEqual(['doc.mdx', 'notes.markdown', 'readme.md'])
  })

  it('returns empty array for no .md files', () => {
    const html = `
      <a href="index.html">index.html</a>
      <a href="style.css">style.css</a>
    `
    const result = parseDirectoryListing(html)
    expect(result).toEqual([])
  })

  it('handles empty HTML', () => {
    expect(parseDirectoryListing('')).toEqual([])
  })
})
