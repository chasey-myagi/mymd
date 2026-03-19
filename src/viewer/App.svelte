<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import FloatingPill from './components/FloatingPill.svelte'
  import MarkdownContent from './components/MarkdownContent.svelte'
  import ProgressBar from './components/ProgressBar.svelte'
  import ScrollTop from './components/ScrollTop.svelte'
  import ErrorPage from './components/ErrorPage.svelte'
  import FileList from './components/FileList.svelte'
  import Outline from './components/Outline.svelte'
  import SettingsPanel from './components/settings/SettingsPanel.svelte'
  import FrontmatterBanner from './components/FrontmatterBanner.svelte'
  import SourceView from './components/SourceView.svelte'
  import ImagePreview from './components/ImagePreview.svelte'
  import { documentState } from './stores/document'
  import { settings, initSettings } from './stores/settings'
  import { showOutline, showFileList, showSource, scrollProgress } from './stores/ui'
  import { renderMarkdown } from '../lib/markdown/renderer'
  import { parseFrontmatter } from '../lib/frontmatter'
  import { calculateStats } from '../lib/stats'
  import { applyTheme, resolveColorMode } from '../lib/theme/engine'
  import { getTheme } from '../lib/theme/themes'
  import { loadLocal, saveLocal } from '../lib/storage'
  import type { Heading } from '../types'
  import './styles/base.css'
  import './styles/content.css'
  import './styles/print.css'

  let error = ''
  let errorType: 'network' | 'notfound' | 'permission' | 'toolarge' = 'network'
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
      const key = `file_content_${url}`
      const result = await chrome.storage.session.get(key)
      const content = result[key] ?? ''
      chrome.storage.session.remove(key).catch(() => {})
      return content
    }

    if (hasChromeApi) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'FETCH_URL', url }, (response) => {
          if (response?.success) resolve(response.content)
          else reject(new Error(response?.error ?? 'Failed to fetch'))
        })
      })
    }

    // Fallback: direct fetch (works outside extension context)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.text()
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
      error = e instanceof Error ? e.message : 'Unknown error'
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
      if (key === 'O') { e.preventDefault(); showOutline.update(v => !v) }
      if (key === 'S') { e.preventDefault(); showSource.update(v => !v) }
      if (key === 'D') {
        e.preventDefault()
        settings.update(s => ({ ...s, colorMode: s.colorMode === 'dark' ? 'light' : 'dark' }))
      }
    }
  }

  // Apply theme reactively
  $: {
    const mode = resolveColorMode($settings.colorMode)
    const theme = getTheme($settings.theme, mode)
    applyTheme(theme, $settings.cssVariables)
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
  })

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown)
    if (refreshInterval) clearInterval(refreshInterval)
    clearTimeout(scrollSaveTimeout)
    unsubSettings?.()
  })
</script>

{#if error}
  <ErrorPage {error} type={errorType} />
{:else}
  {#if $settings.showProgressBar}
    <ProgressBar />
  {/if}
  <div class="layout">
    {#if $showFileList}
      <aside class="sidebar sidebar-left">
        <FileList />
      </aside>
    {/if}
    <main class="main-content" bind:this={mainContent} on:scroll={handleScroll}>
      {#if $showSource}
        <SourceView />
      {:else}
        <FrontmatterBanner />
        <MarkdownContent />
      {/if}
    </main>
    {#if $showOutline}
      <aside class="sidebar sidebar-right">
        <Outline />
      </aside>
    {/if}
  </div>
  <ScrollTop />
  <FloatingPill />
  <SettingsPanel />
  <ImagePreview />
{/if}
