<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { documentState, headings } from '../stores/document'
  import { showSettings, showSource } from '../stores/ui'
  import { settings } from '../stores/settings'
  import Outline from './Outline.svelte'
  import FileList from './FileList.svelte'

  // Panel state
  let isExpanded = false
  let showPanel  = false
  let isClosing  = false
  let activeTab: 'outline' | 'files' = 'outline'
  let fileCount = 0

  let pillEl: HTMLElement
  let closeTimer: ReturnType<typeof setTimeout>

  $: fileName  = decodeURIComponent($documentState.url.split('/').pop() ?? 'Untitled')
  $: wordStats = `${$documentState.wordCount} words · ${$documentState.readingTime} min`
  $: hasOutline = $headings.length > 0
  $: colorIcon  = $settings.colorMode === 'dark' ? '☀' : $settings.colorMode === 'light' ? '🌙' : '⊙'
  $: colorLabel = $settings.colorMode === 'dark' ? 'Light' : $settings.colorMode === 'light' ? 'Dark' : 'System'

  function expand() {
    clearTimeout(closeTimer)
    isClosing  = false
    isExpanded = true
    showPanel  = true
  }

  function collapse() {
    isExpanded = false
    isClosing  = true
    clearTimeout(closeTimer)
    closeTimer = setTimeout(() => {
      showPanel = false
      isClosing = false
    }, 160)
  }

  function toggle() {
    isExpanded ? collapse() : expand()
  }

  function doToggleSource() {
    $showSource = !$showSource
  }

  function doToggleColorMode() {
    settings.update(s => ({
      ...s,
      colorMode: s.colorMode === 'light' ? 'dark' : s.colorMode === 'dark' ? 'system' : 'light',
    }))
  }

  function doOpenSettings() {
    $showSettings = true
    collapse()
  }

  function handleFileListLoaded(e: CustomEvent<{ count: number }>) {
    fileCount = e.detail.count
    // If no outline headings, auto-switch to files tab
    if (!hasOutline && fileCount > 0) activeTab = 'files'
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isExpanded) collapse()
  }

  function handleOutsideClick(e: MouseEvent) {
    if (isExpanded && pillEl && !pillEl.contains(e.target as Node)) collapse()
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown)
    document.addEventListener('mousedown', handleOutsideClick)
  })

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown)
    document.removeEventListener('mousedown', handleOutsideClick)
    clearTimeout(closeTimer)
  })
</script>

<div class="floating-pill" bind:this={pillEl}>

  {#if !showPanel}
    <!-- ── Collapsed handle ── -->
    <button
      class="pill-handle"
      on:click={toggle}
      title="Open panel"
      aria-label="Open document panel"
      aria-expanded="false"
    >
      <span class="pill-hamburger">☰</span>
    </button>

  {:else}
    <!-- ── Expanded liquid glass panel ── -->
    <div
      class="pill-panel"
      class:is-closing={isClosing}
      role="dialog"
      aria-label="Document panel"
    >
      <!-- Glass specular highlight layer -->
      <div class="glass-highlight" aria-hidden="true"></div>

      <!-- Header: filename + stats -->
      <div class="pill-header">
        <p class="pill-filename" title={fileName}>{fileName}</p>
        {#if $settings.showStats}
          <p class="pill-stats">{wordStats}</p>
        {/if}
      </div>

      <!-- Tabs -->
      <div class="pill-tabs" role="tablist">
        <button
          role="tab"
          class="pill-tab"
          class:active={activeTab === 'outline'}
          aria-selected={activeTab === 'outline'}
          on:click={() => activeTab = 'outline'}
          title="Outline"
        >
          ☰ Outline
        </button>
        <button
          role="tab"
          class="pill-tab"
          class:active={activeTab === 'files'}
          aria-selected={activeTab === 'files'}
          on:click={() => activeTab = 'files'}
          title="Files in directory"
        >
          ⊞ Files{#if fileCount > 0}<span class="pill-badge">{fileCount}</span>{/if}
        </button>
      </div>

      <!-- Tab content -->
      <div class="pill-content" role="tabpanel">
        <div class:hidden={activeTab !== 'outline'}>
          {#if hasOutline}
            <Outline />
          {:else}
            <div class="pill-empty">No headings found</div>
          {/if}
        </div>
        <div class:hidden={activeTab !== 'files'}>
          <FileList on:loaded={handleFileListLoaded} />
        </div>
      </div>

      <!-- Footer actions -->
      <div class="pill-footer">
        <button
          class="pill-action"
          class:is-on={$showSource}
          on:click={doToggleSource}
          title="Toggle source view"
          aria-pressed={$showSource}
        >
          <span>&lt;/&gt;</span>
        </button>
        <button
          class="pill-action"
          on:click={doToggleColorMode}
          title="{colorLabel} mode"
        >
          <span>{colorIcon}</span>
        </button>
        <button
          class="pill-action"
          on:click={doOpenSettings}
          title="Settings"
        >
          <span>⚙</span>
        </button>
        <button
          class="pill-close"
          on:click={collapse}
          aria-label="Close panel (Escape)"
          title="Close (Esc)"
        >
          ✕
        </button>
      </div>
    </div>
  {/if}

</div>

<style>
  /* ─── Container ──────────────────────────────── */
  .floating-pill {
    position: fixed;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  /* ─── Collapsed handle ───────────────────────── */
  .pill-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 80px;
    border-radius: 0 18px 18px 0;
    background: color-mix(in srgb, var(--mymd-toolbar-bg, var(--mymd-surface)) 72%, transparent);
    backdrop-filter: blur(16px) saturate(1.5);
    -webkit-backdrop-filter: blur(16px) saturate(1.5);
    border: 1px solid color-mix(in srgb, var(--mymd-border) 50%, transparent);
    border-left: none;
    box-shadow:
      2px 2px 12px rgba(0,0,0,0.10),
      1px 0 4px rgba(0,0,0,0.06),
      inset 0 1px 0 rgba(255,255,255,0.15);
    cursor: pointer;
    color: var(--mymd-text-muted);
    font-size: 0.875rem;
    padding: 0;
    animation: pill-breathe 6s ease-in-out infinite;
    transition: box-shadow 0.2s ease, color 0.15s ease;
  }

  .pill-handle:hover {
    animation-play-state: paused;
    opacity: 1;
    color: var(--mymd-text);
    box-shadow:
      3px 3px 18px rgba(0,0,0,0.14),
      1px 0 6px rgba(0,0,0,0.08),
      inset 0 1px 0 rgba(255,255,255,0.20);
    width: 32px;
    transition: width 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;
  }

  @keyframes pill-breathe {
    0%, 100% { opacity: 0.48; }
    50%       { opacity: 0.70; }
  }

  .pill-hamburger {
    user-select: none;
    line-height: 1;
  }

  /* ─── Expanded glass panel ───────────────────── */
  .pill-panel {
    position: relative;
    width: 260px;
    max-height: calc(100vh - 48px);
    border-radius: 0 20px 20px 0;
    /* Liquid glass base */
    background: color-mix(in srgb, var(--mymd-bg) 78%, transparent);
    backdrop-filter: blur(28px) saturate(1.8) brightness(1.02);
    -webkit-backdrop-filter: blur(28px) saturate(1.8) brightness(1.02);
    border: 1px solid color-mix(in srgb, var(--mymd-border) 55%, transparent);
    border-left: none;
    box-shadow:
      4px 8px 32px rgba(0,0,0,0.13),
      2px 2px 10px rgba(0,0,0,0.07),
      inset 0 1px 0 rgba(255,255,255,0.18),
      inset 1px 0 0 rgba(255,255,255,0.08);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform-origin: left center;
    animation: panel-open 0.2s ease-out both;
  }

  .pill-panel.is-closing {
    animation: panel-close 0.15s ease-in both;
  }

  @keyframes panel-open {
    from { opacity: 0; transform: scaleX(0.88); }
    to   { opacity: 1; transform: scaleX(1); }
  }

  @keyframes panel-close {
    from { opacity: 1; transform: scaleX(1); }
    to   { opacity: 0; transform: scaleX(0.92); }
  }

  /* Specular highlight — top edge gleam */
  .glass-highlight {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 48px;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.12) 0%,
      rgba(255, 255, 255, 0.04) 50%,
      transparent 100%
    );
    border-radius: 0 20px 0 0;
    pointer-events: none;
    z-index: 1;
  }

  /* ─── Header ─────────────────────────────────── */
  .pill-header {
    padding: 14px 16px 8px;
    z-index: 2;
    flex-shrink: 0;
  }

  .pill-filename {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--mymd-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
    margin: 0;
  }

  .pill-stats {
    font-size: 0.6875rem;
    color: var(--mymd-text-muted);
    margin: 2px 0 0;
  }

  /* ─── Tabs ───────────────────────────────────── */
  .pill-tabs {
    display: flex;
    gap: 2px;
    padding: 0 10px 6px;
    flex-shrink: 0;
    z-index: 2;
  }

  .pill-tab {
    flex: 1;
    background: none;
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    padding: 5px 8px;
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--mymd-text-muted);
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    white-space: nowrap;
  }

  .pill-tab:hover {
    background: var(--mymd-hover);
    color: var(--mymd-text);
  }

  .pill-tab.active {
    color: var(--mymd-link);
    background: color-mix(in srgb, var(--mymd-link) 10%, transparent);
    border-color: color-mix(in srgb, var(--mymd-link) 20%, transparent);
  }

  .pill-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--mymd-link) 15%, transparent);
    color: var(--mymd-link);
    font-size: 0.6rem;
    font-weight: 700;
    line-height: 1;
  }

  /* ─── Content area ───────────────────────────── */
  .pill-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 4px 0 4px;
    z-index: 2;
    /* Custom scrollbar */
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--mymd-border) 80%, transparent) transparent;
  }

  .pill-content::-webkit-scrollbar { width: 4px; }
  .pill-content::-webkit-scrollbar-track { background: transparent; }
  .pill-content::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--mymd-border) 80%, transparent);
    border-radius: 2px;
  }

  .hidden { display: none; }

  .pill-empty {
    padding: 16px;
    font-size: 0.75rem;
    color: var(--mymd-text-muted);
    font-style: italic;
    text-align: center;
  }

  /* ─── Footer actions ─────────────────────────── */
  .pill-footer {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 8px 10px 12px;
    border-top: 1px solid color-mix(in srgb, var(--mymd-border) 50%, transparent);
    flex-shrink: 0;
    z-index: 2;
  }

  .pill-action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: none;
    cursor: pointer;
    color: var(--mymd-text-muted);
    font-size: 0.875rem;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    padding: 0;
    line-height: 1;
  }

  .pill-action:hover {
    background: var(--mymd-hover);
    color: var(--mymd-text);
  }

  .pill-action.is-on {
    color: var(--mymd-link);
    background: color-mix(in srgb, var(--mymd-link) 10%, transparent);
    border-color: color-mix(in srgb, var(--mymd-link) 22%, transparent);
  }

  /* Close button pushed to the right */
  .pill-close {
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--mymd-text-muted);
    font-size: 0.6rem;
    transition: background 0.15s ease, color 0.15s ease;
    padding: 0;
    line-height: 1;
  }

  .pill-close:hover {
    background: var(--mymd-hover);
    color: var(--mymd-text);
  }

  /* ─── Reduced motion ─────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .pill-handle {
      animation: none;
      opacity: 0.65;
      transition: none;
    }
    .pill-handle:hover {
      opacity: 1;
      width: 28px;
    }
    .pill-panel,
    .pill-panel.is-closing {
      animation: none;
    }
  }
</style>
