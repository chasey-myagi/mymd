import { describe, it, expect, beforeEach } from 'vitest'
import { applyTheme, resolveColorMode, exportTheme, importTheme } from '@/lib/theme/engine'
import { getTheme } from '@/lib/theme/themes'

describe('theme engine', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
  })

  it('resolveColorMode returns light/dark for explicit modes', () => {
    expect(resolveColorMode('light')).toBe('light')
    expect(resolveColorMode('dark')).toBe('dark')
  })

  it('applyTheme sets CSS variables on documentElement', () => {
    const theme = getTheme('github', 'light')
    applyTheme(theme, {})
    expect(document.documentElement.style.getPropertyValue('--mymd-bg')).toBe('#ffffff')
    expect(document.documentElement.style.getPropertyValue('--mymd-text')).toBe('#1f2328')
  })

  it('applyTheme merges user overrides', () => {
    const theme = getTheme('github', 'light')
    applyTheme(theme, { '--mymd-bg': '#f0f0f0' })
    expect(document.documentElement.style.getPropertyValue('--mymd-bg')).toBe('#f0f0f0')
  })

  it('exportTheme produces valid JSON', () => {
    const theme = getTheme('github', 'light')
    const json = exportTheme(theme)
    const parsed = JSON.parse(json)
    expect(parsed.name).toBe('GitHub Light')
    expect(parsed.version).toBe(1)
  })

  it('importTheme validates and returns theme', () => {
    const theme = getTheme('github', 'light')
    const json = exportTheme(theme)
    const imported = importTheme(json)
    expect(imported.name).toBe('GitHub Light')
  })

  it('importTheme throws on invalid JSON', () => {
    expect(() => importTheme('not json')).toThrow()
  })
})
