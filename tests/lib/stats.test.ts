import { describe, it, expect } from 'vitest'
import { calculateStats } from '../../src/lib/stats'

describe('calculateStats', () => {
  it('counts English words', () => {
    const result = calculateStats('hello world foo bar')
    expect(result.wordCount).toBe(4)
  })

  it('counts CJK characters individually', () => {
    const result = calculateStats('你好世界')
    expect(result.wordCount).toBe(4)
  })

  it('calculates reading time (~250 wpm)', () => {
    const words = Array(500).fill('word').join(' ')
    const result = calculateStats(words)
    expect(result.readingTime).toBe(2)
  })

  it('handles mixed content', () => {
    const result = calculateStats('hello 你好 world')
    expect(result.wordCount).toBe(4) // 2 CJK + 2 English
  })

  it('handles empty string', () => {
    const result = calculateStats('')
    expect(result.wordCount).toBe(0)
    expect(result.readingTime).toBe(0)
  })
})
