<script lang="ts">
  import { documentState } from '../stores/document'
  import { showOutline, showSource, showSettings, showFileList } from '../stores/ui'
  import { settings } from '../stores/settings'

  $: fileName = decodeURIComponent($documentState.url.split('/').pop() ?? 'Untitled')
  $: stats = `${$documentState.wordCount} words · ${$documentState.readingTime} min`

  function toggleColorMode() {
    settings.update(s => ({
      ...s,
      colorMode: s.colorMode === 'light' ? 'dark' : s.colorMode === 'dark' ? 'system' : 'light',
    }))
  }
</script>

<header class="toolbar">
  <div class="toolbar-left">
    <button class="toolbar-btn" on:click={() => $showFileList = !$showFileList} title="Toggle file list">
      &#x1F4C1;
    </button>
    <span class="toolbar-title">{fileName}</span>
  </div>
  <div class="toolbar-right">
    {#if $settings.showStats}
      <span class="toolbar-stats">{stats}</span>
    {/if}
    <button class="toolbar-btn" on:click={() => $showSource = !$showSource} title="Toggle source">
      &lt;/&gt;
    </button>
    <button class="toolbar-btn" on:click={toggleColorMode} title="Toggle color mode">
      {$settings.colorMode === 'dark' ? '☀' : $settings.colorMode === 'light' ? '🌙' : '⚙'}
    </button>
    <button class="toolbar-btn" on:click={() => $showOutline = !$showOutline} title="Toggle outline">
      ☰
    </button>
    <button class="toolbar-btn" on:click={() => $showSettings = !$showSettings} title="Settings">
      ⚙
    </button>
  </div>
</header>
