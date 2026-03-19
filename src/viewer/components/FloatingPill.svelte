<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { documentState, headings } from '../stores/document'
  import { showSettings, showSource } from '../stores/ui'
  import { settings } from '../stores/settings'
  import Outline from './Outline.svelte'
  import FileList from './FileList.svelte'

  let expanded = false
  let isClosing = false
  let activeTab: 'outline' | 'files' = 'outline'
  let fileCount = 0
  let pillEl: HTMLElement
  let closeTimer: ReturnType<typeof setTimeout>

  $: fileName = decodeURIComponent($documentState.url.split('/').pop() ?? '')
  $: stats = `${$documentState.wordCount} 字 · ${$documentState.readingTime} 分钟`
  $: isFileProtocol = $documentState.url.startsWith('file://')
  $: hasOutline = $headings.length > 0

  let justOpened = false

  function toggle() {
    if (expanded) {
      close()
    } else {
      expanded = true
      justOpened = true
      setTimeout(() => { justOpened = false }, 300)
    }
  }
  function close() {
    if (justOpened) return  // prevent immediate close from same click
    isClosing = true
    clearTimeout(closeTimer)
    closeTimer = setTimeout(() => { expanded = false; isClosing = false }, 160)
  }

  function handleFileListLoaded(e: CustomEvent<{ count: number }>) {
    fileCount = e.detail.count
    if (!hasOutline && fileCount > 0) activeTab = 'files'
  }

  function handleClickOutside(e: MouseEvent) {
    if (justOpened) return
    if (expanded && pillEl && !pillEl.contains(e.target as Node)) close()
  }
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && expanded) close()
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleKeydown)
  })
  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleKeydown)
    clearTimeout(closeTimer)
  })
</script>

<div class="floating-pill" bind:this={pillEl}>

  {#if !expanded}
    <!-- ── Collapsed handle ── -->
    <button
      class="pill-handle"
      on:click={toggle}
      title="打开面板"
      aria-label="打开文档面板"
      aria-expanded="false"
    >
      <span>☰</span>
    </button>

  {:else}
    <!-- ── Expanded liquid glass panel ── -->
    <div
      class="pill-panel"
      class:is-closing={isClosing}
      role="dialog"
      aria-label="文档面板"
    >
      <!-- Glass specular highlight -->
      <div class="glass-sheen" aria-hidden="true"></div>

      <!-- Header -->
      <div class="pill-header">
        <div class="pill-file-info">
          <p class="pill-filename" title={fileName}>{fileName}</p>
          {#if $settings.showStats}
            <p class="pill-stats">{stats}</p>
          {/if}
        </div>
        <button class="pill-close" on:click={close} aria-label="关闭 (Esc)" title="关闭 (Esc)">✕</button>
      </div>

      <!-- Connected pill tab switcher -->
      <div class="pill-tabs" role="tablist">
        <button
          role="tab"
          class="pill-tab pill-tab-left"
          class:active={activeTab === 'outline'}
          aria-selected={activeTab === 'outline'}
          on:click={() => activeTab = 'outline'}
        >
          ☰ 目录
        </button>
        <button
          role="tab"
          class="pill-tab pill-tab-right"
          class:active={activeTab === 'files'}
          aria-selected={activeTab === 'files'}
          disabled={!isFileProtocol}
          on:click={() => activeTab = 'files'}
        >
          ⊞ 文件{#if fileCount > 0}<span class="pill-badge">{fileCount}</span>{/if}
        </button>
      </div>

      <!-- Tab content -->
      <div class="pill-content" role="tabpanel">
        <div class:hidden={activeTab !== 'outline'}>
          {#if hasOutline}
            <Outline />
          {:else}
            <div class="pill-empty">暂无标题</div>
          {/if}
        </div>
        <div class:hidden={activeTab !== 'files'}>
          <FileList on:loaded={handleFileListLoaded} />
        </div>
      </div>

      <!-- Footer -->
      <div class="pill-footer">
        <button
          class="pill-action"
          class:is-on={$showSource}
          on:click={() => $showSource = !$showSource}
          title="切换源码视图"
          aria-pressed={$showSource}
        >
          &lt;/&gt; 源码
        </button>
        <button
          class="pill-action pill-action-icon"
          on:click={() => $showSettings = true}
          title="设置"
        >
          ⚙
        </button>
      </div>
    </div>
  {/if}

</div>

<style>
  /* ─── Container ──────────────────────────────── */
  .floating-pill {
    position: fixed;
    left: 16px;
    top: 5vh;
    z-index: 100;
  }

  /* ─── Collapsed handle ───────────────────────── */
  .pill-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 80px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow:
      0 4px 16px rgba(0,0,0,0.10),
      0 1px 3px rgba(0,0,0,0.06);
    cursor: pointer;
    color: rgba(0,0,0,0.55);
    font-size: 0.9375rem;
    padding: 0;
    animation: breathe 6s ease-in-out infinite;
    transition: color 0.15s ease, box-shadow 0.2s ease;
  }

  .pill-handle:hover {
    animation-play-state: paused;
    opacity: 1;
    color: rgba(0,0,0,0.8);
    box-shadow:
      0 8px 24px rgba(0,0,0,0.14),
      0 2px 6px rgba(0,0,0,0.08);
    border-color: rgba(0, 0, 0, 0.12);
  }

  @keyframes breathe {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 0.85; }
  }

  /* ─── Expanded glass panel ───────────────────── */
  .pill-panel {
    position: relative;
    width: 280px;
    height: 90vh;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow:
      0 8px 32px rgba(0,0,0,0.12),
      0 2px 6px rgba(0,0,0,0.06);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform-origin: top left;
    animation: panel-open 0.2s ease-out both;
  }

  .pill-panel.is-closing {
    animation: panel-close 0.15s ease-in both;
  }

  @keyframes panel-open {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
  }

  @keyframes panel-close {
    from { opacity: 1; transform: scale(1); }
    to   { opacity: 0; transform: scale(0.95); }
  }

  /* Glass specular sheen on top edge */
  .glass-sheen {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 52px;
    background: linear-gradient(
      180deg,
      rgba(255,255,255,0.22) 0%,
      rgba(255,255,255,0.06) 55%,
      transparent 100%
    );
    border-radius: 20px 20px 0 0;
    pointer-events: none;
    z-index: 1;
  }

  /* ─── Dark mode overrides ────────────────────── */
  :global([data-color-mode="dark"]) .pill-handle {
    background: rgba(30, 30, 30, 0.72);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 0 0 0.5px rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.45);
  }
  :global([data-color-mode="dark"]) .pill-handle:hover {
    color: rgba(255,255,255,0.85);
    box-shadow: 0 12px 40px rgba(0,0,0,0.4), inset 0 0 0 0.5px rgba(255,255,255,0.08);
  }
  :global([data-color-mode="dark"]) .pill-panel {
    background: rgba(30, 30, 30, 0.72);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 0 0 0.5px rgba(255,255,255,0.05);
  }
  :global([data-color-mode="dark"]) .glass-sheen {
    background: linear-gradient(
      180deg,
      rgba(255,255,255,0.06) 0%,
      rgba(255,255,255,0.02) 55%,
      transparent 100%
    );
  }

  /* ─── Header ─────────────────────────────────── */
  .pill-header {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 14px 12px 8px 16px;
    z-index: 2;
    flex-shrink: 0;
  }

  .pill-file-info {
    flex: 1;
    min-width: 0;
  }

  .pill-filename {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--mymd-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
    margin: 0;
  }

  .pill-stats {
    font-size: 0.8rem;
    color: var(--mymd-text-muted);
    margin: 2px 0 0;
  }

  .pill-close {
    flex-shrink: 0;
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

  /* ─── Connected pill tab switcher ────────────── */
  .pill-tabs {
    display: flex;
    padding: 0 12px 8px;
    flex-shrink: 0;
    z-index: 2;
  }

  .pill-tab {
    flex: 1;
    background: none;
    border: 1px solid color-mix(in srgb, var(--mymd-border) 60%, transparent);
    cursor: pointer;
    padding: 7px 12px;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--mymd-text-muted);
    transition: background 0.15s ease, color 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    white-space: nowrap;
  }

  .pill-tab-left {
    border-radius: 8px 0 0 8px;
  }

  .pill-tab-right {
    border-radius: 0 8px 8px 0;
    margin-left: -1px;
  }

  .pill-tab:hover:not(:disabled) {
    background: var(--mymd-hover);
    color: var(--mymd-text);
  }

  .pill-tab.active {
    color: var(--mymd-link);
    background: color-mix(in srgb, var(--mymd-link) 12%, transparent);
    border-color: color-mix(in srgb, var(--mymd-link) 30%, transparent);
  }

  .pill-tab:disabled {
    opacity: 0.35;
    cursor: not-allowed;
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
    padding: 2px 0;
    z-index: 2;
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

  /* ─── Footer ─────────────────────────────────── */
  .pill-footer {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px 12px;
    border-top: 1px solid color-mix(in srgb, var(--mymd-border) 40%, transparent);
    flex-shrink: 0;
    z-index: 2;
  }

  .pill-action {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 34px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: none;
    cursor: pointer;
    color: var(--mymd-text-muted);
    font-size: 0.8125rem;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    white-space: nowrap;
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

  .pill-action-icon {
    width: 34px;
    padding: 0;
    justify-content: center;
    font-size: 1.1rem;
    margin-left: auto;
  }

  /* ─── Reduced motion ─────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .pill-handle { animation: none; opacity: 0.65; }
    .pill-handle:hover { opacity: 1; }
    .pill-panel, .pill-panel.is-closing { animation: none; }
  }
</style>
