<script lang="ts">
  import { onMount } from 'svelte'
  import { loadSettings, saveSettings } from '../lib/storage'
  import { getTheme, getThemeNames } from '../lib/theme/themes/index'
  import { resolveColorMode, applyTheme, exportTheme, importTheme } from '../lib/theme/engine'
  import { DEFAULT_SETTINGS, type MymdSettings } from '../types'
  import { t } from '../lib/i18n'

  let settings: MymdSettings = { ...DEFAULT_SETTINGS }
  let isLoaded = false

  const themeNames = getThemeNames()

  let showAdvanced = false

  const topVariables: [string, string][] = [
    ['--mymd-bg', 'Background'],
    ['--mymd-text', 'Text'],
    ['--mymd-heading', 'Headings'],
    ['--mymd-link', 'Links'],
    ['--mymd-border', 'Borders'],
    ['--mymd-code-bg', 'Code BG'],
    ['--mymd-sidebar-bg', 'Sidebar'],
    ['--mymd-mark-bg', 'Highlight'],
  ]

  function getVarValue(name: string): string {
    const mode = resolveColorMode(settings.colorMode)
    const theme = getTheme(settings.theme, mode)
    return settings.cssVariables[name] ?? theme.cssVariables[name] ?? '#000000'
  }

  function setVar(name: string, value: string) {
    settings.cssVariables = { ...settings.cssVariables, [name]: value }
    settings = settings
    persist()
  }

  onMount(async () => {
    settings = await loadSettings()
    isLoaded = true
    applyCurrentTheme()
  })

  function applyCurrentTheme() {
    const mode = resolveColorMode(settings.colorMode)
    const theme = getTheme(settings.theme, mode)
    applyTheme(theme, settings.cssVariables)
  }

  async function persist() {
    await saveSettings(settings)
    applyCurrentTheme()
  }

  async function openFullSettings() {
    try {
      const id = chrome.runtime.id
      const tabs = await chrome.tabs.query({
        url: `chrome-extension://${id}/src/viewer/index.html*`,
      })
      if (tabs.length > 0 && tabs[0].id != null) {
        await chrome.tabs.update(tabs[0].id, { active: true })
        if (tabs[0].windowId != null) {
          chrome.windows.update(tabs[0].windowId, { focused: true })
        }
      }
    } catch (_) { /* ignore */ }
    window.close()
  }

  async function openTestPage() {
    await chrome.tabs.create({
      url: 'https://raw.githubusercontent.com/sindresorhus/github-markdown-css/main/readme.md',
    })
    window.close()
  }

  function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  function handleExport() {
    const mode = resolveColorMode(settings.colorMode)
    const theme = getTheme(settings.theme, mode)
    const merged = {
      ...theme,
      cssVariables: { ...theme.cssVariables, ...settings.cssVariables },
      customCSS: settings.customCSS,
    }
    const json = exportTheme(merged)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${settings.theme}-theme.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const text = await file.text()
      try {
        const theme = importTheme(text)
        settings.cssVariables = { ...settings.cssVariables, ...theme.cssVariables }
        if (theme.customCSS) settings.customCSS = theme.customCSS
        settings = settings
        persist()
      } catch (err) {
        console.error('Failed to import theme:', err)
      }
    }
    input.click()
  }
</script>

{#if isLoaded}
  <div class="popup">
    <div class="popup-scroll">
    <!-- ═══ Identity ═══ -->
    <div class="identity">
      <img class="identity-icon" src="../assets/icons/icon48.png" alt="mymd" width="24" height="24" />
      <div class="wordmark">mymd</div>
    </div>

    <!-- ═══ Theme & Mode — the hero controls ═══ -->
    <div class="hero-section">
      <div class="theme-row">
        <select
          class="theme-select"
          bind:value={settings.theme}
          on:change={persist}
        >
          {#each themeNames as name}
            <option value={name}>{capitalize(name)}</option>
          {/each}
        </select>

        <div class="mode-switcher">
          <button
            class="mode-btn"
            class:on={settings.colorMode === 'light'}
            on:click={() => { settings.colorMode = 'light'; settings = settings; persist() }}
            aria-label="Light"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="3.5"/><path d="M10 3v1.5m0 11V17M4.22 4.22l1.06 1.06m9.44 9.44 1.06 1.06M3 10h1.5m11 0H17M4.22 15.78l1.06-1.06m9.44-9.44 1.06-1.06"/></svg>
          </button>
          <button
            class="mode-btn"
            class:on={settings.colorMode === 'dark'}
            on:click={() => { settings.colorMode = 'dark'; settings = settings; persist() }}
            aria-label="Dark"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M17.293 13.293A8 8 0 0 1 6.707 2.707 8.003 8.003 0 1 0 17.293 13.293z"/></svg>
          </button>
          <button
            class="mode-btn"
            class:on={settings.colorMode === 'system'}
            on:click={() => { settings.colorMode = 'system'; settings = settings; persist() }}
            aria-label="System"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="14" height="10" rx="1.5"/><path d="M7 17h6m-3-3v3"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ Typography ═══ -->
    <div class="group">
      <div class="group-label">{t('appearance', settings.language)}</div>
      <div class="control-row">
        <span class="control-label">{t('language', settings.language)}</span>
        <select class="mini-select" bind:value={settings.language} on:change={persist}>
          <option value="zh">中文</option>
          <option value="en">EN</option>
        </select>
      </div>
      <div class="control-row">
        <span class="control-label">{t('fontFamily', settings.language)}</span>
        <select class="mini-select" bind:value={settings.fontFamily} on:change={persist}>
          <option value="system-ui, sans-serif">{t('systemSans', settings.language)}</option>
          <option value="Georgia, serif">{t('serif', settings.language)}</option>
          <option value="ui-monospace, monospace">{t('monospace', settings.language)}</option>
        </select>
      </div>
      <div class="control-row">
        <span class="control-label">{t('fontSize', settings.language)}</span>
        <div class="num-control">
          <button class="num-btn" on:click={() => { settings.fontSize = Math.max(12, settings.fontSize - 1); settings = settings; persist() }} disabled={settings.fontSize <= 12}>−</button>
          <span class="num-val">{settings.fontSize}</span>
          <button class="num-btn" on:click={() => { settings.fontSize = Math.min(24, settings.fontSize + 1); settings = settings; persist() }} disabled={settings.fontSize >= 24}>+</button>
        </div>
      </div>
      <div class="control-row">
        <span class="control-label">{t('lineHeight', settings.language)}</span>
        <div class="num-control">
          <button class="num-btn" on:click={() => { settings.lineHeight = Math.round((Math.max(1.2, settings.lineHeight - 0.1)) * 10) / 10; settings = settings; persist() }} disabled={settings.lineHeight <= 1.2}>−</button>
          <span class="num-val">{settings.lineHeight.toFixed(1)}</span>
          <button class="num-btn" on:click={() => { settings.lineHeight = Math.round((Math.min(2.0, settings.lineHeight + 0.1)) * 10) / 10; settings = settings; persist() }} disabled={settings.lineHeight >= 2.0}>+</button>
        </div>
      </div>
      <div class="control-row">
        <span class="control-label">{t('width', settings.language)}</span>
        <div class="num-control">
          <button class="num-btn" on:click={() => { settings.contentWidth = Math.max(600, settings.contentWidth - 20); settings = settings; persist() }} disabled={settings.contentWidth <= 600}>−</button>
          <span class="num-val">{settings.contentWidth}</span>
          <button class="num-btn" on:click={() => { settings.contentWidth = Math.min(1400, settings.contentWidth + 20); settings = settings; persist() }} disabled={settings.contentWidth >= 1400}>+</button>
        </div>
      </div>
    </div>

    <!-- ═══ Toggles ═══ -->
    <div class="group">
      <div class="group-label">{t('features', settings.language)}</div>
      {#each [
        ['showOutline', 'autoOutline'],
        ['autoRefresh', 'autoRefresh'],
        ['showProgressBar', 'progressBar'],
        ['showStats', 'stats'],
        ['showFrontmatter', 'frontmatter'],
        ['rememberScrollPosition', 'rememberScroll'],
      ] as [key, labelKey]}
        <div class="control-row">
          <span class="control-label">{t(labelKey, settings.language)}</span>
          <button
            class="switch"
            class:on={settings[key]}
            on:click={() => { settings[key] = !settings[key]; settings = settings; persist() }}
            role="switch"
            aria-checked={settings[key]}
          ><span class="switch-dot" /></button>
        </div>
      {/each}
    </div>

    <!-- ═══ Advanced (collapsed) ═══ -->
    <div class="group">
      <button class="group-label clickable" on:click={() => showAdvanced = !showAdvanced}>
        {t('advanced', settings.language)}
        <span class="arrow" class:open={showAdvanced}>›</span>
      </button>
      {#if showAdvanced}
        <div class="advanced-content">
          <div class="color-grid">
            {#each topVariables as [varName, label]}
              <label class="color-cell">
                <input
                  type="color"
                  class="color-dot"
                  value={getVarValue(varName)}
                  on:input={(e) => setVar(varName, e.currentTarget.value)}
                />
                <span class="color-name">{label}</span>
              </label>
            {/each}
          </div>
          <textarea
            class="css-input"
            bind:value={settings.customCSS}
            on:input={persist}
            placeholder="/* Custom CSS */"
            spellcheck="false"
            rows="4"
          ></textarea>
          <div class="io-row">
            <button class="io-btn" on:click={handleImport}>{t('importTheme', settings.language)}</button>
            <button class="io-btn" on:click={handleExport}>{t('exportTheme', settings.language)}</button>
          </div>
        </div>
      {/if}
    </div>

    <!-- ═══ Footer ═══ -->
    <div class="foot">
      <button class="foot-btn" on:click={openFullSettings}>{t('openViewer', settings.language)}</button>
      <span class="foot-dot">·</span>
      <button class="foot-btn" on:click={openTestPage}>{t('openTestPage', settings.language)}</button>
    </div>
    </div>
  </div>
{/if}

<style>
  /*
   * mymd popup — Swiss Utility aesthetic
   * Precise, restrained, intentional. Every pixel earns its place.
   */

  .popup {
    --_bg: var(--mymd-bg, #fafafa);
    --_fg: var(--mymd-text, #1a1a1a);
    --_muted: var(--mymd-text-muted, #8b8b8b);
    --_accent: var(--mymd-link, #2563eb);
    --_border: rgba(0, 0, 0, 0.06);
    --_surface: rgba(0, 0, 0, 0.028);
    --_r: 10px;      /* standard radius — squircle feel */
    --_r-sm: 8px;    /* small controls */
    --_r-pill: 99px;  /* pill shapes */

    background: var(--_bg);
    color: var(--_fg);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    font-size: 13px;
    line-height: 1.35;
    width: 340px;
    max-height: 552px;
    -webkit-font-smoothing: antialiased;
    border-radius: 12px;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.12),
      0 2px 8px rgba(0, 0, 0, 0.06),
      0 0 0 1px rgba(0, 0, 0, 0.04);
    overflow: hidden;
  }

  .popup-scroll {
    max-height: 544px;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .popup-scroll::-webkit-scrollbar { width: 0; }

  /* ─── Identity ─── */
  .identity {
    padding: 14px 20px 6px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .identity-icon {
    border-radius: 6px;
    flex-shrink: 0;
  }

  .wordmark {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.04em;
    color: var(--_fg);
  }

  /* ─── Hero: Theme + Mode ─── */
  .hero-section {
    padding: 8px 20px 14px;
  }

  .theme-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .theme-select {
    flex: 1;
    appearance: none;
    -webkit-appearance: none;
    background: var(--_surface);
    border: 1px solid var(--_border);
    border-radius: var(--_r);
    padding: 8px 32px 8px 12px;
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    color: var(--_fg);
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238b8b8b' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }

  .theme-select:focus {
    border-color: var(--_accent);
  }

  .mode-switcher {
    display: flex;
    gap: 2px;
    padding: 3px;
    background: var(--_surface);
    border-radius: var(--_r);
    border: 1px solid var(--_border);
  }

  .mode-btn {
    width: 32px;
    height: 28px;
    border: none;
    background: transparent;
    border-radius: calc(var(--_r) - 3px);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--_muted);
    transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  }

  .mode-btn svg { width: 15px; height: 15px; }

  .mode-btn:hover { color: var(--_fg); }

  .mode-btn.on {
    background: var(--_bg);
    color: var(--_fg);
    box-shadow:
      0 1px 3px rgba(0,0,0,0.06),
      0 0.5px 1px rgba(0,0,0,0.04),
      0 0 0 0.5px rgba(0,0,0,0.03);
  }

  /* ─── Groups ─── */
  .group {
    border-top: 1px solid var(--_border);
  }

  .group-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 20px 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--_muted);
    user-select: none;
    background: none;
    border: none;
    width: 100%;
    cursor: default;
    font-family: inherit;
  }

  .group-label.clickable {
    cursor: pointer;
  }

  .group-label.clickable:hover {
    color: var(--_fg);
  }

  .arrow {
    font-size: 13px;
    transition: transform 0.2s;
    display: inline-block;
  }

  .arrow.open { transform: rotate(90deg); }

  /* ─── Control Rows ─── */
  .control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 20px;
    min-height: 32px;
  }

  .control-label {
    font-size: 13px;
    color: var(--_fg);
  }

  /* ─── Mini Select ─── */
  .mini-select {
    appearance: none;
    -webkit-appearance: none;
    background: var(--_surface);
    border: 1px solid var(--_border);
    border-radius: var(--_r-sm);
    padding: 4px 24px 4px 8px;
    font-size: 12px;
    font-family: inherit;
    color: var(--_fg);
    cursor: pointer;
    outline: none;
    min-width: 80px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b8b8b' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 6px center;
    transition: border-color 0.15s;
  }

  .mini-select:focus { border-color: var(--_accent); }

  /* ─── Number Control ─── */
  .num-control {
    display: flex;
    align-items: center;
    gap: 0;
    background: var(--_surface);
    border: 1px solid var(--_border);
    border-radius: var(--_r-sm);
    height: 28px;
    overflow: hidden;
  }

  .num-btn {
    width: 28px;
    height: 100%;
    border: none;
    background: transparent;
    color: var(--_muted);
    cursor: pointer;
    font-size: 15px;
    font-family: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.1s, color 0.1s;
    padding: 0;
  }

  .num-btn:hover:not(:disabled) {
    background: rgba(0,0,0,0.05);
    color: var(--_fg);
  }

  .num-btn:active:not(:disabled) {
    background: rgba(0,0,0,0.09);
    transform: scale(0.95);
  }

  .num-btn:disabled {
    opacity: 0.2;
    cursor: default;
  }

  .num-val {
    min-width: 42px;
    text-align: center;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: var(--_fg);
    font-weight: 500;
    border-left: 1px solid rgba(0, 0, 0, 0.04);
    border-right: 1px solid rgba(0, 0, 0, 0.04);
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ─── Switch (toggle) ─── */
  .switch {
    position: relative;
    width: 32px;
    height: 18px;
    border-radius: var(--_r-pill);
    border: none;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    background: rgba(0,0,0,0.12);
    transition: background 0.25s cubic-bezier(0.2, 0, 0, 1);
  }

  .switch.on {
    background: var(--_accent);
  }

  .switch-dot {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 2px rgba(0,0,0,0.12), 0 0.5px 0.5px rgba(0,0,0,0.08);
    transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1);
    display: block;
    pointer-events: none;
  }

  .switch.on .switch-dot {
    transform: translateX(14px);
  }

  /* ─── Advanced ─── */
  .advanced-content {
    padding: 4px 20px 12px;
  }

  .color-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 16px;
    margin-bottom: 10px;
  }

  .color-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .color-dot {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border: 2px solid var(--_border);
    border-radius: 50%;
    padding: 0;
    cursor: pointer;
    background: none;
    overflow: hidden;
    flex-shrink: 0;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .color-dot:hover {
    border-color: var(--_accent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--_accent) 20%, transparent);
  }

  .color-dot::-webkit-color-swatch-wrapper { padding: 0; }
  .color-dot::-webkit-color-swatch { border: none; border-radius: 50%; }

  .color-name {
    font-size: 11px;
    color: var(--_muted);
  }

  .css-input {
    display: block;
    width: 100%;
    font-family: 'SF Mono', 'Cascadia Code', ui-monospace, monospace;
    font-size: 11px;
    line-height: 1.5;
    padding: 8px 10px;
    border: 1px solid var(--_border);
    border-radius: var(--_r-sm);
    background: var(--_surface);
    color: var(--_fg);
    resize: none;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }

  .css-input:focus { border-color: var(--_accent); }
  .css-input::placeholder { color: var(--_muted); opacity: 0.6; }

  .io-row {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .io-btn {
    flex: 1;
    height: 28px;
    border: 1px solid var(--_border);
    border-radius: var(--_r-sm);
    background: transparent;
    color: var(--_muted);
    font-size: 11px;
    font-family: inherit;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .io-btn:hover {
    background: var(--_surface);
    color: var(--_fg);
    border-color: rgba(0,0,0,0.1);
    transform: translateY(-0.5px);
  }

  .io-btn:active {
    transform: translateY(0);
  }

  /* ─── Footer ─── */
  .foot {
    border-top: 1px solid var(--_border);
    padding: 8px 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .foot-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 11px;
    font-family: inherit;
    color: var(--_muted);
    padding: 2px 0;
    transition: color 0.15s;
  }

  .foot-btn:hover { color: var(--_accent); }

  .foot-dot {
    color: var(--_border);
    font-size: 10px;
  }

  /* ─── Reduced Motion ─── */
  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; }
  }
</style>
