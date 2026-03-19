<script lang="ts">
  import { onMount } from 'svelte'
  import { loadSettings, saveSettings } from '../lib/storage'
  import { getTheme, getThemeNames } from '../lib/theme/themes/index'
  import { resolveColorMode, applyTheme, exportTheme, importTheme } from '../lib/theme/engine'
  import { DEFAULT_SETTINGS, type MymdSettings } from '../types'

  let settings: MymdSettings = { ...DEFAULT_SETTINGS }
  let isLoaded = false

  const themeNames = getThemeNames()

  let showAppearance = true
  let showFeatures = true
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
    } catch (_) {
      // ignore
    }
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
    <!-- Header -->
    <header class="header">
      <div class="logo">M</div>
      <div class="brand-text">
        <span class="brand-name">mymd</span>
        <span class="brand-sub">Markdown Preview</span>
      </div>
    </header>

    <!-- Appearance Section -->
    <section class="collapsible-section">
      <button
        class="section-header"
        on:click={() => (showAppearance = !showAppearance)}
        aria-expanded={showAppearance}
      >
        <span class="section-title">Appearance</span>
        <span class="chevron" class:open={showAppearance}>›</span>
      </button>
      {#if showAppearance}
        <div class="section-body">
          <div class="row">
            <span class="label">Theme</span>
            <select
              class="select"
              bind:value={settings.theme}
              on:change={persist}
            >
              {#each themeNames as name}
                <option value={name}>{capitalize(name)}</option>
              {/each}
            </select>
          </div>
          <div class="row">
            <span class="label">Mode</span>
            <div class="mode-group">
              <button
                class="mode-btn"
                class:active={settings.colorMode === 'light'}
                on:click={() => { settings.colorMode = 'light'; settings = settings; persist() }}
                title="Light"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/></svg>
              </button>
              <button
                class="mode-btn"
                class:active={settings.colorMode === 'dark'}
                on:click={() => { settings.colorMode = 'dark'; settings = settings; persist() }}
                title="Dark"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              </button>
              <button
                class="mode-btn"
                class:active={settings.colorMode === 'system'}
                on:click={() => { settings.colorMode = 'system'; settings = settings; persist() }}
                title="Auto"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>
              </button>
            </div>
          </div>
          <div class="row">
            <span class="label">Font</span>
            <select
              class="select"
              bind:value={settings.fontFamily}
              on:change={persist}
            >
              <option value="system-ui, sans-serif">System Sans</option>
              <option value="Georgia, serif">Serif</option>
              <option value="ui-monospace, monospace">Monospace</option>
            </select>
          </div>
          <div class="row">
            <span class="label">Font Size</span>
            <div class="stepper">
              <button
                class="step-btn"
                on:click={() => { settings.fontSize = Math.max(12, settings.fontSize - 1); settings = settings; persist() }}
                disabled={settings.fontSize <= 12}
              >−</button>
              <span class="step-val">{settings.fontSize}px</span>
              <button
                class="step-btn"
                on:click={() => { settings.fontSize = Math.min(24, settings.fontSize + 1); settings = settings; persist() }}
                disabled={settings.fontSize >= 24}
              >+</button>
            </div>
          </div>
          <div class="row">
            <span class="label">Line Height</span>
            <div class="stepper">
              <button
                class="step-btn"
                on:click={() => { settings.lineHeight = Math.round((Math.max(1.2, settings.lineHeight - 0.1)) * 10) / 10; settings = settings; persist() }}
                disabled={settings.lineHeight <= 1.2}
              >−</button>
              <span class="step-val">{settings.lineHeight.toFixed(1)}</span>
              <button
                class="step-btn"
                on:click={() => { settings.lineHeight = Math.round((Math.min(2.0, settings.lineHeight + 0.1)) * 10) / 10; settings = settings; persist() }}
                disabled={settings.lineHeight >= 2.0}
              >+</button>
            </div>
          </div>
          <div class="row">
            <span class="label">Width</span>
            <div class="stepper">
              <button
                class="step-btn"
                on:click={() => { settings.contentWidth = Math.max(600, settings.contentWidth - 20); settings = settings; persist() }}
                disabled={settings.contentWidth <= 600}
              >−</button>
              <span class="step-val">{settings.contentWidth}px</span>
              <button
                class="step-btn"
                on:click={() => { settings.contentWidth = Math.min(1400, settings.contentWidth + 20); settings = settings; persist() }}
                disabled={settings.contentWidth >= 1400}
              >+</button>
            </div>
          </div>
        </div>
      {/if}
    </section>

    <!-- Features Section -->
    <section class="collapsible-section">
      <button
        class="section-header"
        on:click={() => (showFeatures = !showFeatures)}
        aria-expanded={showFeatures}
      >
        <span class="section-title">Features</span>
        <span class="chevron" class:open={showFeatures}>›</span>
      </button>
      {#if showFeatures}
        <div class="section-body">
          <div class="row">
            <span class="label">Auto Outline</span>
            <button
              class="toggle"
              class:on={settings.showOutline}
              on:click={() => { settings.showOutline = !settings.showOutline; settings = settings; persist() }}
              role="switch"
              aria-checked={settings.showOutline}
            ><span class="thumb" /></button>
          </div>
          <div class="row">
            <span class="label">Auto Refresh</span>
            <button
              class="toggle"
              class:on={settings.autoRefresh}
              on:click={() => { settings.autoRefresh = !settings.autoRefresh; settings = settings; persist() }}
              role="switch"
              aria-checked={settings.autoRefresh}
            ><span class="thumb" /></button>
          </div>
          <div class="row">
            <span class="label">Progress Bar</span>
            <button
              class="toggle"
              class:on={settings.showProgressBar}
              on:click={() => { settings.showProgressBar = !settings.showProgressBar; settings = settings; persist() }}
              role="switch"
              aria-checked={settings.showProgressBar}
            ><span class="thumb" /></button>
          </div>
          <div class="row">
            <span class="label">Stats</span>
            <button
              class="toggle"
              class:on={settings.showStats}
              on:click={() => { settings.showStats = !settings.showStats; settings = settings; persist() }}
              role="switch"
              aria-checked={settings.showStats}
            ><span class="thumb" /></button>
          </div>
          <div class="row">
            <span class="label">Frontmatter</span>
            <button
              class="toggle"
              class:on={settings.showFrontmatter}
              on:click={() => { settings.showFrontmatter = !settings.showFrontmatter; settings = settings; persist() }}
              role="switch"
              aria-checked={settings.showFrontmatter}
            ><span class="thumb" /></button>
          </div>
          <div class="row">
            <span class="label">Remember Scroll</span>
            <button
              class="toggle"
              class:on={settings.rememberScrollPosition}
              on:click={() => { settings.rememberScrollPosition = !settings.rememberScrollPosition; settings = settings; persist() }}
              role="switch"
              aria-checked={settings.rememberScrollPosition}
            ><span class="thumb" /></button>
          </div>
        </div>
      {/if}
    </section>

    <!-- Advanced Section -->
    <section class="collapsible-section advanced">
      <button
        class="section-header"
        on:click={() => (showAdvanced = !showAdvanced)}
        aria-expanded={showAdvanced}
      >
        <span class="section-title">Advanced</span>
        <span class="chevron" class:open={showAdvanced}>›</span>
      </button>
      {#if showAdvanced}
        <div class="section-body advanced-body">
          <div class="subsection-label">CSS Variables</div>
          <div class="var-grid">
            {#each topVariables as [varName, label]}
              <div class="var-row">
                <span class="var-label">{label}</span>
                <input
                  type="color"
                  class="color-picker"
                  value={getVarValue(varName)}
                  on:input={(e) => setVar(varName, e.currentTarget.value)}
                  title={varName}
                />
              </div>
            {/each}
          </div>

          <div class="subsection-label" style="margin-top: 10px;">Custom CSS</div>
          <textarea
            class="css-textarea"
            bind:value={settings.customCSS}
            on:input={persist}
            placeholder="/* Your custom CSS */"
            spellcheck="false"
          ></textarea>

          <div class="import-export-row">
            <button class="action-btn ghost small" on:click={handleImport}>
              <svg class="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 2v8m-3-3 3 3 3-3"/><path d="M3 13h10"/></svg>
              Import
            </button>
            <button class="action-btn ghost small" on:click={handleExport}>
              <svg class="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 10V2m-3 3 3-3 3 3"/><path d="M3 13h10"/></svg>
              Export
            </button>
          </div>
        </div>
      {/if}
    </section>

    <!-- Footer Actions -->
    <footer class="footer">
      <button class="action-btn primary" on:click={openFullSettings}>
        <svg class="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 3h12M2 8h12M2 13h12"/><circle cx="5" cy="3" r="1.5" fill="currentColor" stroke="none"/><circle cx="11" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="7" cy="13" r="1.5" fill="currentColor" stroke="none"/></svg>
        Open Viewer
      </button>
      <button class="action-btn ghost" on:click={openTestPage}>
        <svg class="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 9v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4"/><path d="M9 2h5v5M14 2 7 9"/></svg>
        Test Page
      </button>
    </footer>
  </div>
{/if}

<style>
  .popup {
    background: var(--mymd-bg, #ffffff);
    color: var(--mymd-text, #1a1a1a);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    line-height: 1.4;
    transition: background-color 0.2s, color 0.2s;
    min-width: 280px;
    max-width: 320px;
  }

  /* ─── Header ─── */
  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px 10px;
    border-bottom: 1px solid color-mix(in srgb, var(--mymd-border, #e5e7eb) 50%, transparent);
  }

  .logo {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: linear-gradient(
      135deg,
      var(--mymd-link, #0969da),
      color-mix(in srgb, var(--mymd-link, #0969da) 60%, #000)
    );
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    letter-spacing: 0.02em;
  }

  .brand-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .brand-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--mymd-heading, var(--mymd-text, #1a1a1a));
    line-height: 1.2;
    letter-spacing: -0.01em;
  }

  .brand-sub {
    font-size: 11px;
    color: var(--mymd-text-secondary, #666);
    letter-spacing: 0.01em;
  }

  /* ─── Collapsible Section ─── */
  .collapsible-section {
    border-bottom: 1px solid color-mix(in srgb, var(--mymd-border, #e5e7eb) 50%, transparent);
  }

  .collapsible-section.advanced {
    background: color-mix(in srgb, var(--mymd-code-bg, #f6f8fa) 40%, var(--mymd-bg, #ffffff));
  }

  .section-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--mymd-text-secondary, #555);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-family: inherit;
    transition: background-color 0.15s;
  }

  .section-header:hover {
    background: color-mix(in srgb, var(--mymd-text, #1a1a1a) 4%, transparent);
  }

  .section-title {
    color: var(--mymd-text-secondary, #666);
  }

  .chevron {
    font-size: 14px;
    color: var(--mymd-text-secondary, #999);
    transform: rotate(0deg);
    transition: transform 0.2s ease;
    display: inline-block;
    line-height: 1;
  }

  .chevron.open {
    transform: rotate(90deg);
  }

  .section-body {
    padding: 4px 16px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .advanced-body {
    gap: 4px;
  }

  /* ─── Row ─── */
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 32px;
  }

  .label {
    font-size: 13px;
    color: var(--mymd-text, #1a1a1a);
    flex: 1;
  }

  /* ─── Select ─── */
  .select {
    appearance: none;
    -webkit-appearance: none;
    background: var(--mymd-bg, #ffffff);
    color: var(--mymd-text, #1a1a1a);
    border: 1px solid var(--mymd-border, #d0d5dd);
    border-radius: 6px;
    padding: 5px 28px 5px 10px;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    min-width: 110px;
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
  }

  .select:hover {
    border-color: color-mix(in srgb, var(--mymd-link, #0969da) 40%, var(--mymd-border, #d0d5dd));
  }

  .select:focus {
    border-color: var(--mymd-link, #0969da);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--mymd-link, #0969da) 12%, transparent);
  }

  /* ─── Mode Buttons (pill group) ─── */
  .mode-group {
    display: flex;
  }

  .mode-btn {
    width: 32px;
    height: 28px;
    border: 1px solid var(--mymd-border, #d0d5dd);
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background-color 0.15s, border-color 0.15s, color 0.15s;
    color: var(--mymd-text-secondary, #666);
  }

  .mode-btn svg {
    width: 14px;
    height: 14px;
  }

  .mode-btn:first-child {
    border-radius: 6px 0 0 6px;
  }

  .mode-btn:last-child {
    border-radius: 0 6px 6px 0;
  }

  .mode-btn:not(:first-child) {
    margin-left: -1px;
  }

  .mode-btn:hover {
    background: color-mix(in srgb, var(--mymd-text, #1a1a1a) 5%, transparent);
  }

  .mode-btn.active {
    background: color-mix(in srgb, var(--mymd-link, #0969da) 10%, transparent);
    color: var(--mymd-link, #0969da);
    border-color: color-mix(in srgb, var(--mymd-link, #0969da) 30%, transparent);
    position: relative;
    z-index: 1;
  }

  /* ─── Toggle Switch ─── */
  .toggle {
    position: relative;
    width: 32px;
    height: 18px;
    border-radius: 9px;
    background: color-mix(in srgb, var(--mymd-border, #ccc) 80%, var(--mymd-bg, #fff));
    border: none;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .toggle.on {
    background: color-mix(in srgb, var(--mymd-link, #0969da) 85%, white);
  }

  .thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: block;
    pointer-events: none;
  }

  .toggle.on .thumb {
    transform: translateX(14px);
  }

  /* ─── Stepper ─── */
  .stepper {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .step-btn {
    width: 22px;
    height: 22px;
    border: 1px solid var(--mymd-border, #d0d5dd);
    background: transparent;
    color: var(--mymd-text-secondary, #666);
    border-radius: 50%;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background-color 0.15s, border-color 0.15s, color 0.15s,
      transform 0.15s, box-shadow 0.15s;
    font-family: inherit;
  }

  .step-btn:hover:not(:disabled) {
    background: color-mix(in srgb, var(--mymd-link, #0969da) 8%, transparent);
    border-color: color-mix(in srgb, var(--mymd-link, #0969da) 30%, var(--mymd-border, #d0d5dd));
    color: var(--mymd-link, #0969da);
    transform: translateY(-0.5px);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .step-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .step-val {
    font-size: 12px;
    color: var(--mymd-text-secondary, #666);
    min-width: 44px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  /* ─── Advanced: CSS Variables ─── */
  .subsection-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--mymd-text-secondary, #999);
    margin-bottom: 4px;
    padding-top: 2px;
  }

  .var-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 8px;
  }

  .var-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    min-height: 26px;
  }

  .var-label {
    font-size: 12px;
    color: var(--mymd-text, #1a1a1a);
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .color-picker {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border: 1px solid var(--mymd-border, #d0d5dd);
    border-radius: 5px;
    padding: 1px;
    cursor: pointer;
    background: none;
    flex-shrink: 0;
    overflow: hidden;
  }

  .color-picker::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  .color-picker::-webkit-color-swatch {
    border: none;
    border-radius: 3px;
  }

  /* ─── Custom CSS Textarea ─── */
  .css-textarea {
    width: 100%;
    height: 120px;
    font-family: ui-monospace, 'Cascadia Code', 'Fira Code', monospace;
    font-size: 11px;
    line-height: 1.5;
    padding: 8px;
    border: 1px solid var(--mymd-border, #d0d5dd);
    border-radius: 6px;
    background: var(--mymd-bg, #ffffff);
    color: var(--mymd-text, #1a1a1a);
    resize: vertical;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s, box-shadow 0.15s;
    font-family: ui-monospace, monospace;
  }

  .css-textarea:focus {
    border-color: var(--mymd-link, #0969da);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--mymd-link, #0969da) 12%, transparent);
  }

  .css-textarea::placeholder {
    color: var(--mymd-text-secondary, #aaa);
  }

  /* ─── Import / Export ─── */
  .import-export-row {
    display: flex;
    gap: 8px;
    margin-top: 6px;
  }

  /* ─── Footer ─── */
  .footer {
    padding: 8px 16px 12px;
    display: flex;
    gap: 8px;
    margin-top: 2px;
  }

  .action-btn {
    flex: 1;
    padding: 0 12px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    font-family: inherit;
    text-align: center;
    transition: background-color 0.15s, border-color 0.15s, transform 0.15s,
      box-shadow 0.15s;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  .action-btn.small {
    height: 28px;
    font-size: 11px;
    padding: 0 10px;
  }

  .action-btn:hover {
    transform: translateY(-0.5px);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }

  .action-btn.primary {
    background: var(--mymd-link, #0969da);
    color: #fff;
    border: 1px solid transparent;
  }

  .action-btn.primary:hover {
    background: color-mix(in srgb, var(--mymd-link, #0969da) 88%, #000);
  }

  .action-btn.ghost {
    background: transparent;
    color: var(--mymd-text-secondary, #666);
    border: 1px solid var(--mymd-border, #d0d5dd);
  }

  .action-btn.ghost:hover {
    background: color-mix(in srgb, var(--mymd-text, #1a1a1a) 4%, transparent);
    border-color: color-mix(in srgb, var(--mymd-border, #d0d5dd) 70%, var(--mymd-text, #1a1a1a));
  }

  .btn-icon {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
  }

  /* ─── Reduced Motion ─── */
  @media (prefers-reduced-motion: reduce) {
    .toggle,
    .thumb,
    .step-btn,
    .action-btn,
    .mode-btn,
    .select,
    .popup,
    .chevron,
    .section-header {
      transition: none;
    }
  }
</style>
