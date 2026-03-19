import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEFAULT_SETTINGS } from '../../src/types'
import { loadSettings, saveSettings, loadLocal, saveLocal } from '../../src/lib/storage'

// Mock chrome.storage
const syncStore: Record<string, unknown> = {}
const localStore: Record<string, unknown> = {}

const chromeMock = {
  storage: {
    sync: {
      get: vi.fn(async (defaults: Record<string, unknown>) => {
        const result: Record<string, unknown> = {}
        for (const key of Object.keys(defaults)) {
          result[key] = key in syncStore ? syncStore[key] : defaults[key]
        }
        return result
      }),
      set: vi.fn(async (data: Record<string, unknown>) => {
        Object.assign(syncStore, data)
      }),
    },
    local: {
      get: vi.fn(async (keysOrDefaults: string | Record<string, unknown>) => {
        const result: Record<string, unknown> = {}
        if (typeof keysOrDefaults === 'string') {
          result[keysOrDefaults] = localStore[keysOrDefaults]
        } else {
          for (const key of Object.keys(keysOrDefaults)) {
            result[key] = key in localStore ? localStore[key] : (keysOrDefaults as Record<string, unknown>)[key]
          }
        }
        return result
      }),
      set: vi.fn(async (data: Record<string, unknown>) => {
        Object.assign(localStore, data)
      }),
    },
  },
}

vi.stubGlobal('chrome', chromeMock)

beforeEach(() => {
  // Clear stores before each test
  for (const key of Object.keys(syncStore)) delete syncStore[key]
  for (const key of Object.keys(localStore)) delete localStore[key]
  vi.clearAllMocks()
})

describe('loadSettings', () => {
  it('returns defaults when storage is empty', async () => {
    const settings = await loadSettings()
    expect(settings).toEqual(DEFAULT_SETTINGS)
  })

  it('merges sync and local storage over defaults', async () => {
    syncStore['theme'] = 'dark-github'
    localStore['customCSS'] = 'body { color: red; }'

    const settings = await loadSettings()
    expect(settings.theme).toBe('dark-github')
    expect(settings.customCSS).toBe('body { color: red; }')
    expect(settings.fontSize).toBe(DEFAULT_SETTINGS.fontSize)
  })
})

describe('saveSettings', () => {
  it('persists customCSS to local storage, not sync', async () => {
    const settings = { ...DEFAULT_SETTINGS, customCSS: 'h1 { color: blue; }' }
    await saveSettings(settings)

    expect(chromeMock.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ customCSS: 'h1 { color: blue; }' })
    )
    // sync.set should not include customCSS
    const syncCall = chromeMock.storage.sync.set.mock.calls[0]?.[0] as Record<string, unknown> | undefined
    expect(syncCall).not.toHaveProperty('customCSS')
  })

  it('persists non-large settings to sync storage', async () => {
    const settings = { ...DEFAULT_SETTINGS, theme: 'minimal', fontSize: 18 }
    await saveSettings(settings)

    expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({ theme: 'minimal', fontSize: 18 })
    )
  })
})

describe('loadLocal / saveLocal', () => {
  it('saveLocal stores a value and loadLocal retrieves it', async () => {
    await saveLocal('scroll:file:///test.md', 420)
    const value = await loadLocal<number>('scroll:file:///test.md')
    expect(value).toBe(420)
  })

  it('loadLocal returns undefined for missing keys', async () => {
    const value = await loadLocal<number>('nonexistent-key')
    expect(value).toBeUndefined()
  })
})
