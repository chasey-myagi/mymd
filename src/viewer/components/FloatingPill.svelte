<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { documentState } from '../stores/document'
  import { showOutline, showSource, showSettings, showFileList } from '../stores/ui'
  import { settings } from '../stores/settings'

  // Panel visibility state — decoupled for exit animation
  let isExpanded = false   // logical state
  let showPanel  = false   // DOM presence
  let isClosing  = false   // triggers close animation

  let pillEl: HTMLElement
  let closeTimer: ReturnType<typeof setTimeout>
  let flashKey: string | null = null
  let flashTimer: ReturnType<typeof setTimeout>

  $: fileName = decodeURIComponent($documentState.url.split('/').pop() ?? 'Untitled')
  $: wordStats = `${$documentState.wordCount} words · ${$documentState.readingTime} min`

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

  // Micro-feedback: flash a button briefly on action
  function flash(key: string) {
    flashKey = key
    clearTimeout(flashTimer)
    flashTimer = setTimeout(() => { flashKey = null }, 280)
  }

  function doToggleOutline()   { flash('outline');   $showOutline   = !$showOutline }
  function doToggleFiles()     { flash('files');     $showFileList  = !$showFileList }
  function doToggleSource()    { flash('source');    $showSource    = !$showSource }
  function doToggleColorMode() {
    flash('color')
    settings.update(s => ({
      ...s,
      colorMode: s.colorMode === 'light' ? 'dark' : s.colorMode === 'dark' ? 'system' : 'light',
    }))
  }
  function doOpenSettings() {
    $showSettings = true
    collapse()
  }

  $: colorIcon  = $settings.colorMode === 'dark' ? '☀' : $settings.colorMode === 'light' ? '🌙' : '⊙'
  $: colorLabel = $settings.colorMode === 'dark' ? 'Light' : $settings.colorMode === 'light' ? 'Dark' : 'System'

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
    clearTimeout(flashTimer)
  })
</script>

<div class="floating-pill" bind:this={pillEl}>

  {#if !showPanel}
    <!-- ── Collapsed pill ── -->
    <button
      class="pill-handle"
      on:click={toggle}
      title="Open controls"
      aria-label="Open controls"
      aria-expanded="false"
    >
      <span class="pill-hamburger">☰</span>
    </button>

  {:else}
    <!-- ── Expanded panel ── -->
    <div
      class="pill-panel"
      class:is-closing={isClosing}
      role="dialog"
      aria-label="Document controls"
    >
      <!-- File info -->
      <div class="pill-info">
        <p class="pill-filename" title={fileName}>{fileName}</p>
        {#if $settings.showStats}
          <p class="pill-stats">{wordStats}</p>
        {/if}
      </div>

      <div class="pill-rule"></div>

      <!-- Row 1: Outline + Files -->
      <div class="pill-row" style="animation-delay: 30ms">
        <button
          class="pill-btn"
          class:is-on={$showOutline}
          class:is-flash={flashKey === 'outline'}
          on:click={doToggleOutline}
          title="Toggle outline (Ctrl+Shift+O)"
        >
          <span class="pill-ico">☰</span>Outline
        </button>
        <button
          class="pill-btn"
          class:is-on={$showFileList}
          class:is-flash={flashKey === 'files'}
          on:click={doToggleFiles}
          title="Toggle file list"
        >
          <span class="pill-ico">📁</span>Files
        </button>
      </div>

      <!-- Row 2: Source + Color -->
      <div class="pill-row" style="animation-delay: 60ms">
        <button
          class="pill-btn"
          class:is-on={$showSource}
          class:is-flash={flashKey === 'source'}
          on:click={doToggleSource}
          title="Toggle source (Ctrl+Shift+S)"
        >
          <span class="pill-ico">&lt;/&gt;</span>Source
        </button>
        <button
          class="pill-btn"
          class:is-flash={flashKey === 'color'}
          on:click={doToggleColorMode}
          title="{colorLabel} mode"
        >
          <span class="pill-ico">{colorIcon}</span>{colorLabel}
        </button>
      </div>

      <div class="pill-rule" style="animation-delay: 80ms"></div>

      <!-- Settings -->
      <button
        class="pill-btn pill-btn-full"
        style="animation-delay: 90ms"
        on:click={doOpenSettings}
        title="Settings"
      >
        <span class="pill-ico">⚙</span>Settings
      </button>

      <!-- Auto-refresh indicator -->
      <div class="pill-status" style="animation-delay: 110ms">
        <span class="pill-dot" class:pill-dot-on={$settings.autoRefresh}></span>
        Auto-refresh {$settings.autoRefresh ? 'on' : 'off'}
      </div>

      <!-- Close -->
      <button class="pill-close" on:click={collapse} aria-label="Close (Escape)">✕</button>
    </div>
  {/if}

</div>

<style>
  /* ─── Container ──────────────────────────────── */
  .floating-pill {
    position: fixed;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  /* ─── Collapsed handle ───────────────────────── */
  .pill-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 88px;
    border-radius: 18px;
    background: color-mix(in srgb, var(--mymd-toolbar-bg, var(--mymd-surface)) 78%, transparent);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid color-mix(in srgb, var(--mymd-border) 55%, transparent);
    box-shadow: 0 2px 10px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.07);
    cursor: pointer;
    color: var(--mymd-text-muted);
    font-size: 1rem;
    padding: 0;
    /* Breathing: subtle presence, not distracting */
    animation: pill-breathe 6s ease-in-out infinite;
    transition: box-shadow 0.2s ease;
  }

  .pill-handle:hover {
    animation-play-state: paused;
    opacity: 0.95;
    scale: 1.05;
    color: var(--mymd-text);
    box-shadow: 0 4px 16px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08);
    transition: opacity 0.2s ease, scale 0.2s ease, box-shadow 0.2s ease;
  }

  @keyframes pill-breathe {
    0%, 100% { opacity: 0.50; }
    50%       { opacity: 0.72; }
  }

  .pill-hamburger {
    user-select: none;
    line-height: 1;
  }

  /* ─── Expanded panel ─────────────────────────── */
  .pill-panel {
    position: relative;
    width: 280px;
    border-radius: 16px;
    background: color-mix(in srgb, var(--mymd-bg) 92%, transparent);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid color-mix(in srgb, var(--mymd-border) 65%, transparent);
    box-shadow:
      0 8px 32px rgba(0,0,0,0.13),
      0 2px 8px rgba(0,0,0,0.07),
      0 0 0 0.5px color-mix(in srgb, var(--mymd-border) 40%, transparent);
    padding: 16px;
    transform-origin: right center;
    animation: pill-open 0.2s ease-out both;
  }

  .pill-panel.is-closing {
    animation: pill-close 0.15s ease-in both;
  }

  @keyframes pill-open {
    from { opacity: 0; scale: 0.90; }
    to   { opacity: 1; scale: 1; }
  }

  @keyframes pill-close {
    from { opacity: 1; scale: 1; }
    to   { opacity: 0; scale: 0.95; }
  }

  /* ─── File info ──────────────────────────────── */
  .pill-info {
    padding-right: 24px; /* room for close btn */
    padding-bottom: 8px;
  }

  .pill-filename {
    font-size: 0.8125rem;
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

  /* ─── Divider ────────────────────────────────── */
  .pill-rule {
    height: 1px;
    background: var(--mymd-border);
    margin: 8px 0;
    opacity: 0.5;
    animation: pill-in 0.2s ease-out both;
  }

  /* ─── Rows ───────────────────────────────────── */
  .pill-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    margin-bottom: 4px;
    animation: pill-in 0.2s ease-out both;
  }

  @keyframes pill-in {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ─── Buttons ────────────────────────────────── */
  .pill-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    padding: 6px 8px;
    font-size: 0.75rem;
    color: var(--mymd-text-muted);
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    width: 100%;
    line-height: 1.3;
  }

  .pill-btn:hover {
    background: var(--mymd-hover);
    color: var(--mymd-text);
  }

  /* Active / toggled-on state */
  .pill-btn.is-on {
    color: var(--mymd-link);
    background: color-mix(in srgb, var(--mymd-link) 10%, transparent);
    border-color: color-mix(in srgb, var(--mymd-link) 20%, transparent);
  }

  /* Micro-feedback flash */
  .pill-btn.is-flash {
    animation: pill-flash 0.28s ease;
  }

  @keyframes pill-flash {
    0%, 100% { background: var(--mymd-hover); }
    45%       { background: color-mix(in srgb, var(--mymd-link) 24%, transparent); }
  }

  .pill-btn-full {
    width: 100%;
    animation: pill-in 0.2s ease-out both;
  }

  .pill-ico {
    font-size: 0.875rem;
    line-height: 1;
    flex-shrink: 0;
    width: 16px;
    text-align: center;
    opacity: 0.85;
  }

  /* ─── Status footer ──────────────────────────── */
  .pill-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.6875rem;
    color: var(--mymd-text-muted);
    padding: 4px 8px;
    margin-top: 2px;
    animation: pill-in 0.2s ease-out both;
  }

  .pill-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--mymd-text-muted);
    opacity: 0.35;
    flex-shrink: 0;
    transition: background 0.3s ease, opacity 0.3s ease;
  }

  .pill-dot.pill-dot-on {
    background: #22c55e;
    opacity: 1;
  }

  /* ─── Close button ───────────────────────────── */
  .pill-close {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--mymd-text-muted);
    font-size: 0.625rem;
    display: flex;
    align-items: center;
    justify-content: center;
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
    }
    .pill-handle:hover {
      opacity: 0.95;
      scale: unset;
      transition: none;
    }
    .pill-panel,
    .pill-panel.is-closing {
      animation: none;
    }
    .pill-row,
    .pill-rule,
    .pill-btn-full,
    .pill-status {
      animation: none !important;
      opacity: 1 !important;
    }
    .pill-btn.is-flash {
      animation: none;
    }
  }
</style>
