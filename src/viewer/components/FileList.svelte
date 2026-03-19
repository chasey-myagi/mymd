<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import { documentState } from '../stores/document'
  import { parseDirectoryListing } from '../../lib/file-list'

  const dispatch = createEventDispatcher()
  let files: string[] = []

  $: currentFile = decodeURIComponent($documentState.url.split('/').pop() ?? '')
  $: isFileProtocol = $documentState.url.startsWith('file://')

  onMount(async () => {
    if (!isFileProtocol) { dispatch('loaded', { count: 0 }); return }
    const dirUrl = $documentState.url.substring(0, $documentState.url.lastIndexOf('/') + 1)
    try {
      const response = await new Promise<{ success: boolean; html?: string }>((resolve) => {
        chrome.runtime.sendMessage({ type: 'LIST_DIRECTORY', url: dirUrl }, resolve)
      })
      if (response.success && response.html) {
        files = parseDirectoryListing(response.html)
      }
    } catch { files = [] }
    dispatch('loaded', { count: files.length })
  })

  function openFile(filename: string) {
    const dirUrl = $documentState.url.substring(0, $documentState.url.lastIndexOf('/') + 1)
    const viewerUrl = chrome.runtime.getURL('src/viewer/index.html')
    window.location.href = `${viewerUrl}?url=${encodeURIComponent(dirUrl + filename)}`
  }
</script>

{#if files.length > 0}
  <ul class="file-items">
    {#each files as file}
      <li class:active={file === currentFile}>
        <button on:click={() => openFile(file)} title={file}>{file}</button>
      </li>
    {/each}
  </ul>
{:else if isFileProtocol}
  <div class="empty-state">No other .md files</div>
{/if}

<style>
  .file-items {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .file-items li button {
    background: none;
    border: none;
    cursor: pointer;
    width: 100%;
    text-align: left;
    padding: 3px 8px;
    font-size: 0.8rem;
    color: var(--mymd-text-muted);
    border-radius: var(--mymd-radius-sm, 4px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    max-width: 100%;
    transition: background 0.1s, color 0.1s;
  }

  .file-items li.active button {
    color: var(--mymd-link);
    background: color-mix(in srgb, var(--mymd-link) 10%, transparent);
  }

  .file-items li button:hover {
    background: var(--mymd-hover);
    color: var(--mymd-text);
  }

  .empty-state {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    color: var(--mymd-text-muted);
    font-style: italic;
  }
</style>
