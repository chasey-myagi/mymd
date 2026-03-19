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
  })
</script>

<article class="mymd-content" bind:this={contentEl}>
  {@html $documentState.renderedHTML}
</article>
