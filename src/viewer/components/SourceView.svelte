<script lang="ts">
  import { documentState } from '../stores/document'
  import { highlightCode } from '../../lib/markdown/highlighter'

  let highlightedHTML = ''

  $: {
    highlightCode($documentState.rawMarkdown, 'markdown', 'github-dark').then(html => {
      highlightedHTML = html
    })
  }
</script>

<div class="source-view">
  {@html highlightedHTML}
</div>

<style>
  .source-view {
    padding: 1rem;
    overflow-x: auto;
    font-size: 0.875rem;
  }

  .source-view :global(pre) {
    margin: 0;
    border-radius: 6px;
  }
</style>
