import type { MymdTheme } from '../../types'

export function resolveColorMode(mode: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode
}

export function applyTheme(theme: MymdTheme, overrides: Record<string, string>): void {
  const el = document.documentElement
  const reducedMotion = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  if (!reducedMotion) {
    el.style.transition = 'background-color 0.3s ease, color 0.3s ease'
  }

  const merged = { ...theme.cssVariables, ...overrides }
  for (const [key, value] of Object.entries(merged)) {
    el.style.setProperty(key, value)
  }

  el.setAttribute('data-theme', theme.name)
  el.setAttribute('data-color-mode', theme.colorMode)

  if (!reducedMotion) {
    setTimeout(() => { el.style.transition = '' }, 350)
  }
}

export function applyCustomCSS(css: string): void {
  let styleEl = document.getElementById('mymd-custom-css') as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'mymd-custom-css'
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = css
}

export function exportTheme(theme: MymdTheme): string {
  return JSON.stringify(theme, null, 2)
}

export function importTheme(json: string): MymdTheme {
  const parsed = JSON.parse(json)
  if (!parsed.name || !parsed.version || !parsed.colorMode || !parsed.cssVariables) {
    throw new Error('Invalid theme: missing required fields (name, version, colorMode, cssVariables)')
  }
  return parsed as MymdTheme
}
