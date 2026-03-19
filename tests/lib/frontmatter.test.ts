import { describe, it, expect } from 'vitest'
import { parseFrontmatter } from '../../src/lib/frontmatter'

describe('parseFrontmatter', () => {
  it('extracts YAML frontmatter correctly', () => {
    const md = '---\ntitle: Hello\ndate: 2024-01-01\n---\nBody content'
    const result = parseFrontmatter(md)
    expect(result.data).toEqual({ title: 'Hello', date: new Date('2024-01-01') })
    expect(result.content).toBe('Body content')
  })

  it('returns null data when no frontmatter', () => {
    const md = '# Just a heading\n\nSome content'
    const result = parseFrontmatter(md)
    expect(result.data).toBeNull()
    expect(result.content).toBe(md)
  })

  it('handles empty frontmatter ---\\n---', () => {
    const md = '---\n---\nContent here'
    const result = parseFrontmatter(md)
    expect(result.data).toEqual({})
    expect(result.content).toBe('Content here')
  })
})
