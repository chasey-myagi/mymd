import { describe, it, expect } from 'vitest'
import { parseDirectoryListing } from '../../src/lib/file-list'

describe('parseDirectoryListing', () => {
  it('extracts .md files from Chrome addRow() directory listing', () => {
    const html = `
      <script>
      start("/docs/");
      addRow("..","file:///docs/",1,0,"","");
      addRow("readme.md","file:///docs/readme.md",0,1234,"3/20/26","");
      addRow("notes.markdown","file:///docs/notes.markdown",0,567,"3/19/26","");
      addRow("images","file:///docs/images/",1,0,"","");
      addRow("doc.mdx","file:///docs/doc.mdx",0,89,"3/18/26","");
      addRow("index.html","file:///docs/index.html",0,200,"3/17/26","");
      </script>
    `
    const result = parseDirectoryListing(html)
    expect(result).toEqual(['doc.mdx', 'notes.markdown', 'readme.md'])
  })

  it('falls back to <a href> format', () => {
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
      addRow("index.html","file:///index.html",0,200,"","");
      addRow("style.css","file:///style.css",0,100,"","");
    `
    const result = parseDirectoryListing(html)
    expect(result).toEqual([])
  })

  it('handles empty HTML', () => {
    expect(parseDirectoryListing('')).toEqual([])
  })
})
