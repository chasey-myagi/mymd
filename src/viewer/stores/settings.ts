import { writable } from 'svelte/store'
import type { MymdSettings } from '../../types'
import { DEFAULT_SETTINGS } from '../../types'
import { loadSettings, saveSettings } from '../../lib/storage'

export const settings = writable<MymdSettings>(DEFAULT_SETTINGS)

// Auto-save on change (debounced), skip initial value during init
let saveTimeout: ReturnType<typeof setTimeout>
let initialized = false
settings.subscribe((value) => {
  if (!initialized) return
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => saveSettings(value), 500)
})

export async function initSettings(): Promise<void> {
  const loaded = await loadSettings()
  settings.set(loaded)
  initialized = true
}
