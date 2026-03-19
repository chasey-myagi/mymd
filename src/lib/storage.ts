import { DEFAULT_SETTINGS, type MymdSettings } from '../types'

const LARGE_KEYS = ['customCSS'] as const

function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.sync
}

export async function loadSettings(): Promise<MymdSettings> {
  if (!hasChromeStorage()) return { ...DEFAULT_SETTINGS }

  const syncResult = await chrome.storage.sync.get(DEFAULT_SETTINGS)
  const localResult = await chrome.storage.local.get(
    Object.fromEntries(LARGE_KEYS.map(k => [k, DEFAULT_SETTINGS[k]]))
  )
  return { ...DEFAULT_SETTINGS, ...syncResult, ...localResult } as MymdSettings
}

export async function saveSettings(settings: MymdSettings): Promise<void> {
  if (!hasChromeStorage()) return

  const localData: Record<string, unknown> = {}
  const syncData: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(settings)) {
    if ((LARGE_KEYS as readonly string[]).includes(key)) {
      localData[key] = value
    } else {
      syncData[key] = value
    }
  }
  await Promise.all([
    Object.keys(syncData).length > 0 ? chrome.storage.sync.set(syncData) : Promise.resolve(),
    Object.keys(localData).length > 0 ? chrome.storage.local.set(localData) : Promise.resolve(),
  ])
}

export async function loadLocal<T>(key: string): Promise<T | undefined> {
  if (!hasChromeStorage()) return undefined
  const result = await chrome.storage.local.get(key)
  return result[key] as T | undefined
}

export async function saveLocal(key: string, value: unknown): Promise<void> {
  if (!hasChromeStorage()) return
  await chrome.storage.local.set({ [key]: value })
}
