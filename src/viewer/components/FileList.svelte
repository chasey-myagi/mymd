<script lang="ts">
  import { onMount } from 'svelte'
  import { documentState } from '../stores/document'
  import { parseDirectoryListing } from '../../lib/file-list'

  export let show = true

  let files: string[] = []

  $: currentFile = decodeURIComponent($documentState.url.split('/').pop() ?? '')
  $: isFileProtocol = $documentState.url.startsWith('file://')

  onMount(async () => {
    if (!isFileProtocol) return

    const dirUrl = $documentState.url.substring(0, $documentState.url.lastIndexOf('/') + 1)
    try {
      const response = await new Promise<{ success: boolean; html?: string }>((resolve) => {
        chrome.runtime.sendMessage({ type: 'LIST_DIRECTORY', url: dirUrl }, resolve)
      })
      if (response.success && response.html) {
        files = parseDirectoryListing(response.html)
      }
    } catch {
      files = []
    }
  })

  function openFile(filename: string) {
    const dirUrl = $documentState.url.substring(0, $documentState.url.lastIndexOf('/') + 1)
    const viewerUrl = chrome.runtime.getURL('src/viewer/index.html')
    window.location.href = `${viewerUrl}?url=${encodeURIComponent(dirUrl + filename)}`
  }
</script>

{#if show && isFileProtocol && files.length > 0}
  <aside class="sidebar sidebar-left">
    <nav class="file-list">
      <h3 class="file-list-title">Files</h3>
      <ul>
        {#each files as file}
          <li class:active={file === currentFile}>
            <button on:click={() => openFile(file)}>{file}</button>
          </li>
        {/each}
      </ul>
    </nav>
  </aside>
{/if}
