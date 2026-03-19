<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { documentState } from '../stores/document'
  import { showOutline, showSource, showSettings, showFileList } from '../stores/ui'
  import { settings } from '../stores/settings'

  let isExpanded = false
  let pillEl: HTMLElement

  $: fileName = decodeURIComponent($documentState.url.split('/').pop() ?? 'Untitled')
  $: stats = `${$documentState.wordCount} words · ${$documentState.readingTime} min read`

  function toggle() {
    isExpanded = !isExpanded
  }

  function collapse() {
    isExpanded = false
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isExpanded) collapse()
  }

  function handleOutsideClick(e: MouseEvent) {
    if (isExpanded && pillEl && !pillEl.contains(e.target as Node)) {
      collapse()
    }
  }

  function toggleColorMode() {
    settings.update(s => ({
      ...s,
      colorMode: s.colorMode === 'light' ? 'dark' : s.colorMode === 'dark' ? 'system' : 'light',
    }))
  }

  $: colorModeIcon = $settings.colorMode === 'dark' ? '☀' : $settings.colorMode === 'light' ? '🌙' : '⊙'
  $: colorModeLabel = $settings.colorMode === 'dark' ? 'Light mode' : $settings.colorMode === 'light' ? 'Dark mode' : 'System mode'

  onMount(() => {
    document.addEventListener('keydown', handleKeydown)
    document.addEventListener('mousedown', handleOutsideClick)
  })

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown)
    document.removeEventListener('mousedown', handleOutsideClick)
  })
</script>

<div class="floating-pill" bind:this={pillEl}>
  {#if !isExpanded}
    <button class="pill-collapsed" on:click={toggle} title="Open menu" aria-label="Open menu" aria-expanded="false">
      <span class="pill-icon">☰</span>
    </button>
  {:else}
    <div class="pill-expanded" role="dialog" aria-label="Document controls">
      <!-- Header: file info -->
      <div class="pill-header">
        <div class="pill-filename" title={fileName}>{fileName}</div>
        {#if $settings.showStats}
          <div class="pill-stats">{stats}</div>
        {/if}
      </div>

      <div class="pill-divider"></div>

      <!-- Sidebar toggles -->
      <div class="pill-section">
        <button
          class="pill-btn"
          class:active={$showOutline}
          on:click={() => { $showOutline = !$showOutline }}
          title="Toggle outline (Ctrl+Shift+O)"
        >
          <span class="pill-btn-icon">☰</span>
          Outline
        </button>
        <button
          class="pill-btn"
          class:active={$showFileList}
          on:click={() => { $showFileList = !$showFileList }}
          title="Toggle file list"
        >
          <span class="pill-btn-icon">📁</span>
          Files
        </button>
      </div>

      <div class="pill-section">
        <button
          class="pill-btn"
          class:active={$showSource}
          on:click={() => { $showSource = !$showSource }}
          title="Toggle source (Ctrl+Shift+S)"
        >
          <span class="pill-btn-icon">&lt;/&gt;</span>
          Source
        </button>
        <button
          class="pill-btn"
          on:click={toggleColorMode}
          title={colorModeLabel}
        >
          <span class="pill-btn-icon">{colorModeIcon}</span>
          {colorModeLabel}
        </button>
      </div>

      <div class="pill-divider"></div>

      <!-- Settings -->
      <button
        class="pill-btn pill-btn-settings"
        on:click={() => { $showSettings = !$showSettings; collapse() }}
        title="Settings"
      >
        <span class="pill-btn-icon">⚙</span>
        Settings
      </button>

      <!-- Auto-refresh status -->
      <div class="pill-refresh-status">
        <span class="pill-refresh-dot" class:active={$settings.autoRefresh}></span>
        Auto-refresh: {$settings.autoRefresh ? 'ON' : 'OFF'}
      </div>

      <!-- Close button -->
      <button class="pill-close" on:click={collapse} title="Close (Escape)" aria-label="Close menu">
        ✕
      </button>
    </div>
  {/if}
</div>

<style>
  .floating-pill {
    position: fixed;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
  }

  /* Collapsed pill */
  .pill-collapsed {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 88px;
    border-radius: 18px;
    background: color-mix(in srgb, var(--mymd-toolbar-bg, var(--mymd-surface)) 80%, transparent);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: var(--mymd-shadow-md, 0 4px 16px rgba(0,0,0,0.12));
    border: 1px solid color-mix(in srgb, var(--mymd-border) 60%, transparent);
    cursor: pointer;
    opacity: 0.55;
    transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
    color: var(--mymd-text-muted);
    font-size: 1rem;
    padding: 0;
  }

  .pill-collapsed:hover {
    opacity: 0.95;
    transform: scale(1.06);
    box-shadow: var(--mymd-shadow-md, 0 6px 20px rgba(0,0,0,0.18));
    color: var(--mymd-text);
  }

  .pill-icon {
    line-height: 1;
    user-select: none;
  }

  /* Expanded panel */
  .pill-expanded {
    position: relative;
    width: 240px;
    border-radius: 16px;
    background: color-mix(in srgb, var(--mymd-bg) 94%, transparent);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: var(--mymd-shadow-md, 0 8px 32px rgba(0,0,0,0.18));
    border: 1px solid color-mix(in srgb, var(--mymd-border) 70%, transparent);
    padding: 0.875rem;
    animation: pill-expand 0.2s ease;
    transform-origin: right center;
  }

  @keyframes pill-expand {
    from { opacity: 0; transform: scale(0.88) translateX(8px); }
    to   { opacity: 1; transform: scale(1)    translateX(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .pill-expanded {
      animation: none;
    }
    .pill-collapsed {
      transition: none;
    }
  }

  /* Header */
  .pill-header {
    padding-bottom: 0.5rem;
  }

  .pill-filename {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--mymd-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
  }

  .pill-stats {
    font-size: 0.7rem;
    color: var(--mymd-text-muted);
    margin-top: 0.125rem;
  }

  /* Divider */
  .pill-divider {
    height: 1px;
    background: var(--mymd-border);
    margin: 0.5rem 0;
    opacity: 0.6;
  }

  /* Sections */
  .pill-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem;
    margin-bottom: 0.25rem;
  }

  /* Buttons */
  .pill-btn {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    background: none;
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    padding: 0.35rem 0.5rem;
    font-size: 0.7375rem;
    color: var(--mymd-text-muted);
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    width: 100%;
  }

  .pill-btn:hover {
    background: var(--mymd-hover);
    color: var(--mymd-text);
  }

  .pill-btn.active {
    color: var(--mymd-link);
    background: color-mix(in srgb, var(--mymd-link) 10%, transparent);
    border-color: color-mix(in srgb, var(--mymd-link) 25%, transparent);
  }

  .pill-btn-icon {
    font-size: 0.875rem;
    line-height: 1;
    flex-shrink: 0;
    opacity: 0.8;
  }

  .pill-btn-settings {
    width: 100%;
    margin-top: 0;
  }

  /* Refresh status */
  .pill-refresh-status {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.675rem;
    color: var(--mymd-text-muted);
    padding: 0.3rem 0.5rem;
    margin-top: 0.125rem;
  }

  .pill-refresh-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--mymd-text-muted);
    opacity: 0.4;
    flex-shrink: 0;
  }

  .pill-refresh-dot.active {
    background: #22c55e;
    opacity: 1;
  }

  /* Close button */
  .pill-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--mymd-text-muted);
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, color 0.15s ease;
    line-height: 1;
    padding: 0;
  }

  .pill-close:hover {
    background: var(--mymd-hover);
    color: var(--mymd-text);
  }
</style>
