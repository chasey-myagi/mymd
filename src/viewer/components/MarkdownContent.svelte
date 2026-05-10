<script lang="ts">
  import { documentState } from '../stores/document'
  import { previewImageSrc } from '../stores/ui'
  import { settings } from '../stores/settings'
  import { afterUpdate, onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { t } from '../../lib/i18n'
  import { resolveMarkdownHref } from '../../lib/markdown/links'
  import mermaid from 'mermaid'

  let contentEl: HTMLElement

  function navigateToMarkdown(url: string, newTab: boolean) {
    const hasChromeApi = typeof chrome !== 'undefined' && !!chrome.runtime?.sendMessage

    if (url.startsWith('file://')) {
      if (newTab) {
        // Best-effort: most browsers block file:// in window.open from
        // chrome-extension pages, but try anyway. Same-tab path uses the
        // background's tabs.update, which works.
        window.open(url, '_blank')
      } else if (hasChromeApi) {
        chrome.runtime.sendMessage({ type: 'NAVIGATE_FILE', url })
      } else {
        window.location.href = url
      }
      return
    }

    // http/https (or anything else) — route through the viewer when we
    // have access to the extension; the background's webNavigation
    // listener also redirects, but going direct avoids a flash.
    const target = hasChromeApi
      ? `${chrome.runtime.getURL('src/viewer/index.html')}?url=${encodeURIComponent(url)}`
      : url

    if (newTab) {
      window.open(target, '_blank')
    } else {
      window.location.href = target
    }
  }

  function handleContentClick(e: MouseEvent) {
    const targetEl = e.target as HTMLElement
    const anchor = targetEl.closest('a') as HTMLAnchorElement | null

    // Image preview (existing behavior, only when not clicking a link)
    if (!anchor) {
      const img = targetEl.closest('img')
      if (img) previewImageSrc.set((img as HTMLImageElement).src)
      return
    }

    const isWikilink = anchor.classList.contains('wikilink')
    const isMdLink = anchor.hasAttribute('data-md-link')
    if (!isWikilink && !isMdLink) return // external/anchor links: browser default

    const href = anchor.getAttribute('href')
    if (!href) return

    const docUrl = get(documentState).url
    const resolved = resolveMarkdownHref(href, docUrl, isWikilink)
    if (!resolved) return // Couldn't resolve — fall through to default

    e.preventDefault()
    const newTab = e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1
    navigateToMarkdown(resolved, newTab)
  }

  onMount(() => {
    contentEl.addEventListener('click', handleContentClick)
    // Middle-click fires `auxclick`, not `click`, in modern browsers.
    contentEl.addEventListener('auxclick', (e) => {
      if ((e as MouseEvent).button === 1) handleContentClick(e as MouseEvent)
    })
  })

  afterUpdate(() => {
    // Initialize Mermaid diagrams
    const mermaidEls = contentEl?.querySelectorAll('.mermaid')
    if (mermaidEls?.length) {
      mermaid.initialize({ startOnLoad: false, theme: 'default' })
      mermaid.run({ nodes: mermaidEls as unknown as ArrayLike<HTMLElement> })
    }

    // Enhance code blocks: language label + copy button
    contentEl?.querySelectorAll('pre').forEach(pre => {
      if (pre.parentElement?.classList.contains('pre-wrapper')) return // already processed

      const code = pre.querySelector('code')
      if (!code) return

      // Wrap pre in .pre-wrapper so overlay elements stay fixed in visible area
      // even when the code scrolls horizontally
      const preWrapper = document.createElement('div')
      preWrapper.className = 'pre-wrapper'
      pre.parentNode?.insertBefore(preWrapper, pre)
      preWrapper.appendChild(pre)

      // Language label
      const langClass = Array.from(code.classList).find(c => c.startsWith('language-'))
      if (langClass) {
        const lang = langClass.replace('language-', '')
        const label = document.createElement('span')
        label.className = 'code-lang-label'
        label.textContent = lang
        preWrapper.appendChild(label)
      }

      // Copy button
      const btn = document.createElement('button')
      btn.className = 'code-copy-btn'
      btn.textContent = t('copy', get(settings).language)
      btn.addEventListener('click', () => {
        const text = code.textContent ?? ''
        navigator.clipboard.writeText(text).then(() => {
          const lang = get(settings).language
          btn.textContent = t('copied', lang)
          btn.classList.add('copied')
          setTimeout(() => {
            btn.textContent = t('copy', get(settings).language)
            btn.classList.remove('copied')
          }, 2000)
        })
      })
      preWrapper.appendChild(btn)
    })

    // Wrap tables in scrollable containers
    contentEl?.querySelectorAll('table').forEach(table => {
      if (table.parentElement?.classList.contains('table-wrapper')) return // already wrapped

      const wrapper = document.createElement('div')
      wrapper.className = 'table-wrapper'
      table.parentNode?.insertBefore(wrapper, table)
      wrapper.appendChild(table)

      const checkOverflow = () => {
        if (wrapper.scrollWidth > wrapper.clientWidth) {
          wrapper.classList.add('has-overflow')
        } else {
          wrapper.classList.remove('has-overflow')
        }
      }
      checkOverflow()
      wrapper.addEventListener('scroll', () => {
        const atEnd = wrapper.scrollLeft + wrapper.clientWidth >= wrapper.scrollWidth - 5
        wrapper.classList.toggle('has-overflow', !atEnd)
      })
    })
  })
</script>

<article class="mymd-content" bind:this={contentEl}>
  {@html $documentState.renderedHTML}
</article>
