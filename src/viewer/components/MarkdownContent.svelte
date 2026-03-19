<script lang="ts">
  import { documentState } from '../stores/document'
  import { previewImageSrc } from '../stores/ui'
  import { afterUpdate } from 'svelte'
  import mermaid from 'mermaid'

  let contentEl: HTMLElement

  afterUpdate(() => {
    // Initialize Mermaid diagrams
    const mermaidEls = contentEl?.querySelectorAll('.mermaid')
    if (mermaidEls?.length) {
      mermaid.initialize({ startOnLoad: false, theme: 'default' })
      mermaid.run({ nodes: mermaidEls as unknown as ArrayLike<HTMLElement> })
    }

    // Wire image click handler for preview
    contentEl?.querySelectorAll('img').forEach(img => {
      img.style.cursor = 'zoom-in'
      img.addEventListener('click', () => previewImageSrc.set(img.src))
    })

    // Enhance code blocks: language label + copy button
    contentEl?.querySelectorAll('pre').forEach(pre => {
      if (pre.querySelector('.code-copy-btn')) return // already processed

      const code = pre.querySelector('code')
      if (!code) return

      // Language label
      const langClass = Array.from(code.classList).find(c => c.startsWith('language-'))
      if (langClass) {
        const lang = langClass.replace('language-', '')
        const label = document.createElement('span')
        label.className = 'code-lang-label'
        label.textContent = lang
        pre.appendChild(label)
      }

      // Copy button
      const btn = document.createElement('button')
      btn.className = 'code-copy-btn'
      btn.textContent = 'Copy'
      btn.addEventListener('click', () => {
        const text = code.textContent ?? ''
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = 'Copied!'
          btn.classList.add('copied')
          setTimeout(() => {
            btn.textContent = 'Copy'
            btn.classList.remove('copied')
          }, 2000)
        })
      })
      pre.appendChild(btn)
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
