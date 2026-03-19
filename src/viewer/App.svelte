<script lang="ts">
  import { onMount } from 'svelte'
  import Toolbar from './components/Toolbar.svelte'
  import MarkdownContent from './components/MarkdownContent.svelte'
  import ProgressBar from './components/ProgressBar.svelte'
  import ScrollTop from './components/ScrollTop.svelte'
  import ErrorPage from './components/ErrorPage.svelte'
  import FileList from './components/FileList.svelte'
  import Outline from './components/Outline.svelte'
  import { documentState } from './stores/document'
  import { settings, initSettings } from './stores/settings'
  import { showOutline, showFileList, showSource, scrollProgress } from './stores/ui'
  import { renderMarkdown } from '../lib/markdown/renderer'
  import { parseFrontmatter } from '../lib/frontmatter'
  import { calculateStats } from '../lib/stats'
  import { applyTheme, resolveColorMode } from '../lib/theme/engine'
  import { getTheme } from '../lib/theme/themes'
  import type { Heading } from '../types'
  import './styles/base.css'
  import './styles/content.css'

  let error = ''
  let errorType: 'network' | 'notfound' | 'permission' | 'toolarge' = 'network'
  let mainContent: HTMLElement

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
    if (url.startsWith('file://')) {
      const result = await chrome.storage.session.get(`file_content_${url}`)
      return result[`file_content_${url}`] ?? ''
    }
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'FETCH_URL', url }, (response) => {
        if (response?.success) resolve(response.content)
        else reject(new Error(response?.error ?? 'Failed to fetch'))
      })
    })
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
    $scrollProgress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
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
  })
</script>

{#if error}
  <ErrorPage {error} type={errorType} />
{:else}
  <Toolbar />
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
        <pre class="source-view">{$documentState.rawMarkdown}</pre>
      {:else}
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
{/if}
