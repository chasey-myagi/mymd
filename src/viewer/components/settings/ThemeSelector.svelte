<script lang="ts">
  import { onDestroy } from 'svelte'
  import { settings } from '../../stores/settings'
  import { getThemeNames, THEMES } from '../../../lib/theme/themes'
  import { importTheme, exportTheme, resolveColorMode } from '../../../lib/theme/engine'
  import { getTheme } from '../../../lib/theme/themes'

  const themeNames = getThemeNames()

  const displayNames: Record<string, string> = {
    github:      'GitHub',
    typora:      'Typora',
    academic:    'Academic',
    reader:      'Reader',
    minimal:     'Minimal',
    handwriting: 'Handwriting',
    cyberpunk:   'Cyberpunk',
    retro:       'Retro',
  }

  function label(name: string): string {
    return displayNames[name] ?? (name.charAt(0).toUpperCase() + name.slice(1))
  }

  // Returns 4 preview swatch colors for a theme, using current color mode
  function swatches(name: string) {
    const mode = resolveColorMode($settings.colorMode)
    const vars = THEMES[name]?.[mode]?.cssVariables ?? {}
    return [
      vars['--mymd-bg']      ?? '#fff',
      vars['--mymd-text']    ?? '#333',
      vars['--mymd-link']    ?? '#0969da',
      vars['--mymd-code-bg'] ?? '#f5f5f5',
    ]
  }

  // Import/export status feedback
  let ioStatus: 'idle' | 'success' | 'error' = 'idle'
  let ioMessage = ''
  let ioTimer: ReturnType<typeof setTimeout>

  function setStatus(type: 'success' | 'error', msg: string) {
    ioStatus = type
    ioMessage = msg
    clearTimeout(ioTimer)
    ioTimer = setTimeout(() => { ioStatus = 'idle' }, 3000)
  }

  function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const text = await file.text()
      try {
        const theme = importTheme(text)
        settings.update(s => ({ ...s, cssVariables: theme.cssVariables, customCSS: theme.customCSS ?? s.customCSS }))
        setStatus('success', 'Theme imported')
      } catch {
        setStatus('error', 'Invalid theme file')
      }
    }
    input.click()
  }

  function handleExport() {
    const mode = resolveColorMode($settings.colorMode)
    const base = getTheme($settings.theme, mode)
    const theme = { ...base, cssVariables: { ...base.cssVariables, ...$settings.cssVariables } }
    const blob = new Blob([exportTheme(theme)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mymd-theme-${$settings.theme}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  onDestroy(() => clearTimeout(ioTimer))
</script>

<section class="settings-section">
  <h4>Theme</h4>

  <div class="theme-grid">
    {#each themeNames as name}
      {@const colors = swatches(name)}
      {@const active = $settings.theme === name}
      <button
        class="theme-card"
        class:is-active={active}
        on:click={() => settings.update(s => ({ ...s, theme: name }))}
        title={label(name)}
      >
        <div class="theme-swatches">
          {#each colors as color}
            <span class="swatch" style="background:{color}"></span>
          {/each}
        </div>
        <span class="theme-label">{label(name)}</span>
        {#if active}
          <span class="theme-tick" aria-label="Active">✓</span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- Color mode -->
  <div class="settings-row">
    <label for="color-mode-select">Color Mode</label>
    <select id="color-mode-select" bind:value={$settings.colorMode}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  </div>

  <!-- Import / Export -->
  <div class="io-row">
    <button class="io-btn" on:click={handleImport} title="Import theme from JSON file">
      <span class="io-icon">⬆</span>Import
    </button>
    <button class="io-btn" on:click={handleExport} title="Export current theme as JSON">
      <span class="io-icon">⬇</span>Export
    </button>
    {#if ioStatus !== 'idle'}
      <span class="io-status io-status-{ioStatus}">{ioMessage}</span>
    {/if}
  </div>
</section>

<style>
  .settings-section {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--mymd-border, #eee);
  }

  .settings-section h4 {
    margin: 0 0 0.75rem;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--mymd-text-muted, #888);
  }

  /* ── Theme grid ─────────────────────────── */
  .theme-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }

  .theme-card {
    position: relative;
    padding: 8px 8px 7px;
    border: 1.5px solid var(--mymd-border, #ddd);
    border-radius: 10px;
    background: var(--mymd-surface, var(--mymd-code-bg, #fafafa));
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .theme-card:hover {
    border-color: var(--mymd-link, #0969da);
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    scale: 1.02;
    transition: border-color 0.15s ease, box-shadow 0.15s ease, scale 0.15s ease;
  }

  .theme-card.is-active {
    border-color: var(--mymd-link, #0969da);
    box-shadow: 0 0 0 2.5px color-mix(in srgb, var(--mymd-link, #0969da) 22%, transparent);
  }

  /* ── Color swatches ─────────────────────── */
  .theme-swatches {
    display: flex;
    gap: 3px;
    margin-bottom: 6px;
  }

  .swatch {
    display: block;
    width: 16px;
    height: 16px;
    border-radius: 3px;
    flex-shrink: 0;
    outline: 1px solid rgba(0,0,0,0.08);
    outline-offset: -1px;
  }

  /* ── Theme name & tick ──────────────────── */
  .theme-label {
    display: block;
    font-size: 0.7375rem;
    font-weight: 500;
    color: var(--mymd-text, #333);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .theme-tick {
    position: absolute;
    top: 7px;
    right: 8px;
    font-size: 0.6rem;
    font-weight: 700;
    color: var(--mymd-link, #0969da);
    line-height: 1;
  }

  /* ── Color mode row ─────────────────────── */
  .settings-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    margin-bottom: 0;
  }

  .settings-row label {
    font-size: 0.8rem;
    color: var(--mymd-text-muted, #666);
    min-width: 80px;
    flex-shrink: 0;
  }

  select {
    flex: 1;
    padding: 5px 8px;
    border: 1px solid var(--mymd-border, #ddd);
    border-radius: 6px;
    background: var(--mymd-bg, #fff);
    color: var(--mymd-text, #333);
    font-size: 0.8rem;
    cursor: pointer;
  }

  /* ── Import / Export ────────────────────── */
  .io-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    flex-wrap: wrap;
  }

  .io-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border: 1px solid var(--mymd-border, #ddd);
    border-radius: 8px;
    background: none;
    color: var(--mymd-text-muted, #666);
    font-size: 0.75rem;
    cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease;
    line-height: 1.4;
  }

  .io-btn:hover {
    border-color: var(--mymd-link, #0969da);
    color: var(--mymd-link, #0969da);
  }

  .io-icon {
    font-size: 0.7rem;
    opacity: 0.8;
  }

  .io-status {
    font-size: 0.7rem;
    padding: 4px 8px;
    border-radius: 5px;
    animation: status-appear 0.18s ease-out;
  }

  .io-status-success {
    background: color-mix(in srgb, #22c55e 12%, transparent);
    color: #16a34a;
    border: 1px solid color-mix(in srgb, #22c55e 30%, transparent);
  }

  .io-status-error {
    background: color-mix(in srgb, #ef4444 12%, transparent);
    color: #dc2626;
    border: 1px solid color-mix(in srgb, #ef4444 30%, transparent);
  }

  @keyframes status-appear {
    from { opacity: 0; transform: translateY(-3px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .theme-card:hover { scale: unset; }
    .io-status { animation: none; }
  }
</style>
