import { writable } from 'svelte/store'

export const showOutline = writable(true)
export const showFileList = writable(true)
export const showSettings = writable(false)
export const showSource = writable(false)
export const scrollProgress = writable(0)
export const previewImageSrc = writable<string | null>(null)
