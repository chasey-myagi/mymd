import { writable } from 'svelte/store'
import type { MymdSettings } from '../../types'
import { DEFAULT_SETTINGS } from '../../types'
import { loadSettings, saveSettings } from '../../lib/storage'

export const settings = writable<MymdSettings>(DEFAULT_SETTINGS)

export async function initSettings(): Promise<void> {
  const loaded = await loadSettings()
  settings.set(loaded)
}

// Auto-save on change (debounced)
let saveTimeout: ReturnType<typeof setTimeout>
settings.subscribe((value) => {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => saveSettings(value), 500)
})
