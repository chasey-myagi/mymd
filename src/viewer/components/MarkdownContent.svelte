<script lang="ts">
  import { documentState } from '../stores/document'
  import { previewImageSrc } from '../stores/ui'
  import { settings } from '../stores/settings'
  import { afterUpdate, onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { t } from '../../lib/i18n'
  import mermaid from 'mermaid'

  let contentEl: HTMLElement

  onMount(() => {
    contentEl.addEventListener('click', (e) => {
      const img = (e.target as HTMLElement).closest('img')
      if (img) previewImageSrc.set((img as HTMLImageElement).src)
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
