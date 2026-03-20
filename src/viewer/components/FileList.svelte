<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { documentState } from '../stores/document'
  import { settings } from '../stores/settings'
  import { parseDirectoryListing } from '../../lib/file-list'
  import { t } from '../../lib/i18n'

  const dispatch = createEventDispatcher()
  let files: string[] = []
  let fetched = false

  $: currentFile = decodeURIComponent($documentState.url.split('/').pop() ?? '')
  $: isFileProtocol = $documentState.url.startsWith('file://')

  // Reactively fetch directory listing when URL is available
  $: if (isFileProtocol && $documentState.url && !fetched) {
    fetched = true
    fetchFiles($documentState.url)
  }

  async function fetchFiles(url: string) {
    const dirUrl = url.substring(0, url.lastIndexOf('/') + 1)
    console.log('[mymd] FileList: fetching directory:', dirUrl)
    try {
      const response = await new Promise<{ success: boolean; html?: string; error?: string }>((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'LIST_DIRECTORY', url: dirUrl }, (resp) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve(resp)
          }
        })
      })
      console.log('[mymd] FileList: response success:', response.success, 'html length:', response.html?.length, 'error:', response.error)
      if (response.success && response.html) {
        files = parseDirectoryListing(response.html)
        console.log('[mymd] FileList: found files:', files)
      }
    } catch (e) {
      console.warn('[mymd] FileList: failed:', e)
      files = []
    }
    dispatch('loaded', { count: files.length })
  }

  function openFile(filename: string) {
    const dirUrl = $documentState.url.substring(0, $documentState.url.lastIndexOf('/') + 1)
    if (isFileProtocol) {
      // Navigate via background — content script can't directly navigate file:// URLs
      chrome.runtime.sendMessage({ type: 'NAVIGATE_FILE', url: dirUrl + filename })
    } else {
      const viewerUrl = chrome.runtime.getURL('src/viewer/index.html')
      window.location.href = `${viewerUrl}?url=${encodeURIComponent(dirUrl + filename)}`
    }
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
  <div class="empty-state">{t('noFiles', $settings.language)}</div>
{/if}

<style>
  .file-items {
    list-style: none;
    margin: 0;
    padding: 4px 6px;
  }

  .file-items li button {
    background: none;
    border: none;
    cursor: pointer;
    width: 100%;
    text-align: left;
    padding: 4px 10px;
    font-size: 0.8rem;
    color: var(--mymd-text-muted);
    border-radius: var(--mymd-radius-sm, 4px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    max-width: 100%;
    transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
  }

  .file-items li.active button {
    color: var(--mymd-link);
    background: color-mix(in srgb, var(--mymd-link) 6%, transparent);
    box-shadow: inset 2px 0 0 var(--mymd-link);
    font-weight: 500;
  }

  .file-items li button:hover {
    background: var(--mymd-hover);
    color: var(--mymd-text);
  }

  .file-items li button:focus-visible {
    outline: 2px solid var(--mymd-link);
    outline-offset: -2px;
    border-radius: var(--mymd-radius-sm, 4px);
  }

  .empty-state {
    padding: 12px 14px;
    font-size: 0.8rem;
    color: var(--mymd-text-muted);
    font-style: italic;
  }
</style>
