<script lang="ts">
  import { documentState } from '../stores/document'

  let copied = false

  $: lines = $documentState.rawMarkdown.split('\n')
  $: fileName = decodeURIComponent($documentState.url.split('/').pop() ?? 'source')

  function copyAll() {
    navigator.clipboard.writeText($documentState.rawMarkdown).then(() => {
      copied = true
      setTimeout(() => { copied = false }, 2000)
    })
  }
</script>

<div class="source-container">
  <header class="source-header">
    <span class="source-filename">{fileName}</span>
    <div class="source-actions">
      <span class="source-line-count">{lines.length} lines</span>
      <button class="source-copy-btn" class:copied on:click={copyAll}>
        {copied ? '✓ Copied' : 'Copy All'}
      </button>
    </div>
  </header>
  <div class="source-body">
    <div class="line-numbers" aria-hidden="true">
      {#each lines as _, i}
        <span>{i + 1}</span>
      {/each}
    </div>
    <pre class="source-code"><code>{$documentState.rawMarkdown}</code></pre>
  </div>
</div>

<style>
  .source-container {
    max-width: var(--mymd-content-width, 800px);
    width: 100%;
    border: 1px solid var(--mymd-border);
    border-radius: var(--mymd-radius-md, 6px);
    overflow: hidden;
    background: var(--mymd-code-bg);
    margin: 0 auto;
  }

  .source-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: var(--mymd-toolbar-bg);
    border-bottom: 1px solid var(--mymd-border);
    font-size: 0.8rem;
  }

  .source-filename {
    font-weight: 600;
    color: var(--mymd-text);
    font-family: var(--mymd-font-mono, ui-monospace, monospace);
  }

  .source-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .source-line-count {
    color: var(--mymd-text-secondary);
    font-size: 0.75rem;
  }

  .source-copy-btn {
    background: none;
    border: 1px solid var(--mymd-border);
    border-radius: 4px;
    padding: 3px 10px;
    font-size: 0.75rem;
    cursor: pointer;
    color: var(--mymd-text-secondary);
    transition: all 0.15s ease;
  }

  .source-copy-btn:hover {
    background: var(--mymd-sidebar-hover);
    color: var(--mymd-text);
  }

  .source-copy-btn.copied {
    color: #22c55e;
    border-color: #22c55e;
  }

  .source-body {
    display: flex;
    overflow-x: auto;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
  }

  .line-numbers {
    display: flex;
    flex-direction: column;
    padding: 16px 0;
    background: color-mix(in srgb, var(--mymd-code-bg) 90%, var(--mymd-border));
    border-right: 1px solid var(--mymd-border);
    user-select: none;
    flex-shrink: 0;
    min-width: 48px;
    text-align: right;
    position: sticky;
    left: 0;
    z-index: 1;
  }

  .line-numbers span {
    padding: 0 12px;
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--mymd-text-secondary);
    font-family: var(--mymd-font-mono, ui-monospace, monospace);
    opacity: 0.5;
  }

  .source-code {
    margin: 0;
    padding: 16px;
    font-family: var(--mymd-font-mono, ui-monospace, monospace);
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--mymd-code-text);
    white-space: pre;
    flex: 1;
    overflow-x: visible;
    tab-size: 4;
  }

  .source-code code {
    background: none;
    padding: 0;
    font-size: inherit;
    color: inherit;
  }

  @media (prefers-reduced-motion: reduce) {
    .source-copy-btn {
      transition: none;
    }
  }
</style>
