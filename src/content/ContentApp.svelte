<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import FloatingPill from '../viewer/components/FloatingPill.svelte'
  import MarkdownContent from '../viewer/components/MarkdownContent.svelte'
  import ProgressBar from '../viewer/components/ProgressBar.svelte'
  import ScrollTop from '../viewer/components/ScrollTop.svelte'
  import FrontmatterBanner from '../viewer/components/FrontmatterBanner.svelte'
  import SourceView from '../viewer/components/SourceView.svelte'
  import ImagePreview from '../viewer/components/ImagePreview.svelte'
  import { documentState } from '../viewer/stores/document'
  import { settings, initSettings } from '../viewer/stores/settings'
  import { showSource, scrollProgress } from '../viewer/stores/ui'
  import { renderMarkdown } from '../lib/markdown/renderer'
  import { parseFrontmatter } from '../lib/frontmatter'
  import { calculateStats } from '../lib/stats'
  import { applyTheme, applyCustomCSS, resolveColorMode } from '../lib/theme/engine'
  import { getTheme } from '../lib/theme/themes'
  import { loadLocal, saveLocal, loadSettings } from '../lib/storage'
  import type { Heading } from '../types'

  export let rawText: string
  export let fileUrl: string

  // Set URL immediately (before children mount) so FileList can access it in onMount
  documentState.update(d => ({ ...d, url: fileUrl }))

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

  async function fetchFileContent(): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'FETCH_FILE', url: fileUrl }, (response) => {
        if (response?.success) resolve(response.content)
        else reject(new Error(response?.error ?? 'Failed to load file'))
      })
    })
  }

  async function loadDocument(raw?: string): Promise<void> {
    try {
      const text = raw ?? rawText
      if (!text) return

      const { data: fm, content } = parseFrontmatter(text)
      const html = await renderMarkdown(content, getTheme($settings.theme, resolveColorMode($settings.colorMode)).codeTheme)
      const headings = extractHeadings(html)
      const stats = calculateStats(content)

      documentState.set({
        url: fileUrl,
        rawMarkdown: text,
        renderedHTML: html,
        headings,
        frontmatter: fm,
        wordCount: stats.wordCount,
        readingTime: stats.readingTime,
      })
    } catch (e) {
      console.error('[mymd] Failed to render:', e)
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
      if ($settings.rememberScrollPosition && fileUrl) {
        const positions = await loadLocal<Record<string, number>>('scrollPositions') ?? {}
        positions[fileUrl] = mainContent?.scrollTop ?? 0
        await saveLocal('scrollPositions', positions)
      }
    }, 1000)
  }

  function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval)
    if (!$settings.autoRefresh) return
    refreshInterval = setInterval(async () => {
      try {
        const raw = await fetchFileContent()
        if (raw && raw !== $documentState.rawMarkdown) {
          const scrollPos = mainContent?.scrollTop ?? 0
          await loadDocument(raw)
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
    if ($settings.rememberScrollPosition && fileUrl) {
      const positions = await loadLocal<Record<string, number>>('scrollPositions') ?? {}
      const saved = positions[fileUrl]
      if (saved && mainContent) {
        setTimeout(() => { mainContent.scrollTop = saved }, 100)
      }
    }

    startAutoRefresh()
    unsubSettings = settings.subscribe(() => startAutoRefresh())
    document.addEventListener('keydown', handleKeydown)

    // Sync settings from Popup in real-time
    chrome.storage.onChanged.addListener(() => {
      loadSettings().then(s => settings.set(s))
    })
  })

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown)
    if (refreshInterval) clearInterval(refreshInterval)
    clearTimeout(scrollSaveTimeout)
    unsubSettings?.()
  })
</script>

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
