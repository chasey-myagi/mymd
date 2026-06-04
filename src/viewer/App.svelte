<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import FloatingPill from './components/FloatingPill.svelte'
  import MarkdownContent from './components/MarkdownContent.svelte'
  import ProgressBar from './components/ProgressBar.svelte'
  import ScrollTop from './components/ScrollTop.svelte'
  import ErrorPage from './components/ErrorPage.svelte'
  import FrontmatterBanner from './components/FrontmatterBanner.svelte'
  import SourceView from './components/SourceView.svelte'
  import ImagePreview from './components/ImagePreview.svelte'
  import { documentState } from './stores/document'
  import { settings, initSettings } from './stores/settings'
  import { showSource, scrollProgress } from './stores/ui'
  import { renderMarkdown } from '../lib/markdown/renderer'
  import { parseFrontmatter } from '../lib/frontmatter'
  import { calculateStats } from '../lib/stats'
  import { applyTheme, applyCustomCSS, resolveColorMode } from '../lib/theme/engine'
  import { getTheme } from '../lib/theme/themes'
  import { loadLocal, saveLocal, loadSettings } from '../lib/storage'
  import { normalizeFetchUrl } from '../lib/url'
  import type { Heading } from '../types'
  import './styles/base.css'
  import './styles/content.css'
  import './styles/print.css'

  // Set URL immediately (before children mount) so FileList can access it in onMount
  const initialUrl = new URLSearchParams(window.location.search).get('url') ?? ''
  if (initialUrl) {
    documentState.update(d => ({ ...d, url: initialUrl }))
  }

  let error = ''
  let errorType: 'network' | 'notfound' | 'permission' | 'toolarge' = 'network'
  let permissionOrigin = ''
  let permissionHost = ''
  let mainContent: HTMLElement
  let refreshInterval: ReturnType<typeof setInterval>
  let scrollSaveTimeout: ReturnType<typeof setTimeout>
  let unsubSettings: () => void

  function extractHeadings(html: string): Heading[] {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const headings: Heading[] = []
    doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
      headings.push({
        level: parseInt(el.tagName[1]),
        text: el.textContent ?? '',
        id: el.id,
      })
    })
    return headings
  }

  async function fetchContent(url: string): Promise<string> {
    const hasChromeApi = typeof chrome !== 'undefined' && chrome.runtime?.sendMessage

    if (url.startsWith('file://') && hasChromeApi) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'FETCH_FILE', url }, (response) => {
          if (response?.success) resolve(response.content)
          else reject(new Error(response?.error ?? 'Failed to load file'))
        })
      })
    }

    if (hasChromeApi) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'FETCH_URL', url }, (response) => {
          if (response?.success) {
            resolve(response.content)
          } else if (response?.code === 'PERMISSION_REQUIRED') {
            const e = new Error(response.error ?? 'Permission required') as PermissionError
            e.code = 'PERMISSION_REQUIRED'
            e.origin = response.origin
            e.host = response.host
            reject(e)
          } else {
            reject(new Error(response?.error ?? 'Failed to fetch'))
          }
        })
      })
    }

    // Fallback: direct fetch (works outside extension context)
    const res = await fetch(normalizeFetchUrl(url))
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.text()
  }

  type PermissionError = Error & { code?: string; origin?: string; host?: string }

  async function grantPermission(): Promise<void> {
    if (!permissionOrigin || !chrome?.permissions?.request) return
    try {
      const granted = await chrome.permissions.request({ origins: [permissionOrigin] })
      if (!granted) return
      error = ''
      permissionOrigin = ''
      permissionHost = ''
      await loadDocument()
      startAutoRefresh()
    } catch {
      /* user dismissed the prompt — leave the error state in place */
    }
  }

  async function loadDocument(): Promise<void> {
    const params = new URLSearchParams(window.location.search)
    const url = params.get('url')
    if (!url) { error = 'No URL provided'; return }

    try {
      const raw = await fetchContent(url)
      if (!raw) { error = 'Empty document'; errorType = 'notfound'; return }

      const { data: fm, content } = parseFrontmatter(raw)
      const html = await renderMarkdown(content, getTheme($settings.theme, resolveColorMode($settings.colorMode)).codeTheme)
      const headings = extractHeadings(html)
      const stats = calculateStats(content)

      documentState.set({
        url,
        rawMarkdown: raw,
        renderedHTML: html,
        headings,
        frontmatter: fm,
        wordCount: stats.wordCount,
        readingTime: stats.readingTime,
      })
    } catch (e) {
      const pe = e as PermissionError
      if (pe?.code === 'PERMISSION_REQUIRED') {
        errorType = 'permission'
        permissionOrigin = pe.origin ?? ''
        permissionHost = pe.host ?? ''
        error = pe.message
      } else {
        errorType = 'network'
        error = e instanceof Error ? e.message : 'Unknown error'
      }
    }
  }

  function handleScroll() {
    if (!mainContent) return
    const { scrollTop, scrollHeight, clientHeight } = mainContent
    const max = scrollHeight - clientHeight
    $scrollProgress = max > 0 ? Math.round((scrollTop / max) * 100) : 0
    debouncedSaveScroll()
  }

  function debouncedSaveScroll() {
    clearTimeout(scrollSaveTimeout)
    scrollSaveTimeout = setTimeout(async () => {
      if ($settings.rememberScrollPosition && $documentState.url) {
        const positions = await loadLocal<Record<string, number>>('scrollPositions') ?? {}
        positions[$documentState.url] = mainContent?.scrollTop ?? 0
        await saveLocal('scrollPositions', positions)
      }
    }, 1000)
  }

  function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval)
    if (!$settings.autoRefresh) return
    refreshInterval = setInterval(async () => {
      try {
        const raw = await fetchContent($documentState.url)
        if (raw && raw !== $documentState.rawMarkdown) {
          const scrollPos = mainContent?.scrollTop ?? 0
          await loadDocument()
          if (mainContent) mainContent.scrollTop = scrollPos
        }
      } catch { /* ignore refresh errors */ }
    }, $settings.autoRefreshInterval)
  }

  function handleKeydown(e: KeyboardEvent) {
    const { ctrlKey, shiftKey, key } = e
    if (ctrlKey && shiftKey) {
      if (key === 'S') { e.preventDefault(); showSource.update(v => !v) }
      if (key === 'D') {
        e.preventDefault()
        settings.update(s => ({ ...s, colorMode: s.colorMode === 'dark' ? 'light' : 'dark' }))
      }
    }
  }

  // Apply theme + font/layout/customCSS reactively
  $: {
    const mode = resolveColorMode($settings.colorMode)
    const theme = getTheme($settings.theme, mode)
    applyTheme(theme, $settings.cssVariables)
    applyCustomCSS($settings.customCSS)
    const el = document.documentElement
    el.style.setProperty('--mymd-font-family', $settings.fontFamily)
    el.style.setProperty('--mymd-font-size', $settings.fontSize + 'px')
    el.style.setProperty('--mymd-line-height', String($settings.lineHeight))
    el.style.setProperty('--mymd-content-width', $settings.contentWidth + 'px')
  }

  onMount(async () => {
    await initSettings()
    await loadDocument()

    // Restore scroll position
    if ($settings.rememberScrollPosition && $documentState.url) {
      const positions = await loadLocal<Record<string, number>>('scrollPositions') ?? {}
      const saved = positions[$documentState.url]
      if (saved && mainContent) {
        setTimeout(() => { mainContent.scrollTop = saved }, 100)
      }
    }

    startAutoRefresh()
    unsubSettings = settings.subscribe(() => startAutoRefresh())
    document.addEventListener('keydown', handleKeydown)

    // Sync settings from Popup in real-time
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(() => {
        loadSettings().then(s => settings.set(s))
      })
    }
  })

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown)
    if (refreshInterval) clearInterval(refreshInterval)
    clearTimeout(scrollSaveTimeout)
    unsubSettings?.()
  })
</script>

{#if error}
  <ErrorPage
    {error}
    type={errorType}
    {permissionOrigin}
    host={permissionHost}
    lang={$settings.language}
    onGrant={grantPermission}
  />
{:else}
  {#if $settings.showProgressBar}
    <ProgressBar />
  {/if}
  <div class="layout">
    <main class="main-content" bind:this={mainContent} on:scroll={handleScroll}>
      {#if $showSource}
        <SourceView />
      {:else}
        <FrontmatterBanner />
        <MarkdownContent />
      {/if}
    </main>
  </div>
  <ScrollTop />
  <FloatingPill />
  <ImagePreview />
{/if}
