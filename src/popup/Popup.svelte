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
      <span class="brand-name">mymd</span>
      <span class="brand-sub">Markdown Preview</span>
    </header>

    <!-- Appearance Section -->
    <section class="collapsible-section">
      <button
        class="section-header"
        on:click={() => (showAppearance = !showAppearance)}
        aria-expanded={showAppearance}
      >
        <span class="section-title">{t('appearance', settings.language)}</span>
        <span class="chevron" class:open={showAppearance}>›</span>
      </button>
      {#if showAppearance}
        <div class="section-body">
          <div class="row">
            <span class="label">{t('language', settings.language)}</span>
            <select
              class="select"
              bind:value={settings.language}
              on:change={persist}
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>
          <div class="row">
            <span class="label">{t('theme', settings.language)}</span>
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
            <span class="label">{t('mode', settings.language)}</span>
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
            <span class="label">{t('fontFamily', settings.language)}</span>
            <select
              class="select"
              bind:value={settings.fontFamily}
              on:change={persist}
            >
              <option value="system-ui, sans-serif">{t('systemSans', settings.language)}</option>
              <option value="Georgia, serif">{t('serif', settings.language)}</option>
              <option value="ui-monospace, monospace">{t('monospace', settings.language)}</option>
            </select>
          </div>
          <div class="row">
            <span class="label">{t('fontSize', settings.language)}</span>
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
            <span class="label">{t('lineHeight', settings.language)}</span>
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
            <span class="label">{t('width', settings.language)}</span>
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
        <span class="section-title">{t('features', settings.language)}</span>
        <span class="chevron" class:open={showFeatures}>›</span>
      </button>
      {#if showFeatures}
        <div class="section-body">
          <div class="row">
            <span class="label">{t('autoOutline', settings.language)}</span>
            <button
              class="toggle"
              class:on={settings.showOutline}
              on:click={() => { settings.showOutline = !settings.showOutline; settings = settings; persist() }}
              role="switch"
              aria-checked={settings.showOutline}
            ><span class="thumb" /></button>
          </div>
          <div class="row">
            <span class="label">{t('autoRefresh', settings.language)}</span>
            <button
              class="toggle"
              class:on={settings.autoRefresh}
              on:click={() => { settings.autoRefresh = !settings.autoRefresh; settings = settings; persist() }}
              role="switch"
              aria-checked={settings.autoRefresh}
            ><span class="thumb" /></button>
          </div>
          <div class="row">
            <span class="label">{t('progressBar', settings.language)}</span>
            <button
              class="toggle"
              class:on={settings.showProgressBar}
              on:click={() => { settings.showProgressBar = !settings.showProgressBar; settings = settings; persist() }}
              role="switch"
              aria-checked={settings.showProgressBar}
            ><span class="thumb" /></button>
          </div>
          <div class="row">
            <span class="label">{t('stats', settings.language)}</span>
            <button
              class="toggle"
              class:on={settings.showStats}
              on:click={() => { settings.showStats = !settings.showStats; settings = settings; persist() }}
              role="switch"
              aria-checked={settings.showStats}
            ><span class="thumb" /></button>
          </div>
          <div class="row">
            <span class="label">{t('frontmatter', settings.language)}</span>
            <button
              class="toggle"
              class:on={settings.showFrontmatter}
              on:click={() => { settings.showFrontmatter = !settings.showFrontmatter; settings = settings; persist() }}
              role="switch"
              aria-checked={settings.showFrontmatter}
            ><span class="thumb" /></button>
          </div>
          <div class="row">
            <span class="label">{t('rememberScroll', settings.language)}</span>
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
        <span class="section-title">{t('advanced', settings.language)}</span>
        <span class="chevron" class:open={showAdvanced}>›</span>
      </button>
      {#if showAdvanced}
        <div class="section-body advanced-body">
          <div class="subsection-label">{t('cssVariables', settings.language)}</div>
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

          <div class="subsection-label" style="margin-top: 10px;">{t('customCSS', settings.language)}</div>
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
              {t('importTheme', settings.language)}
            </button>
            <button class="action-btn ghost small" on:click={handleExport}>
              <svg class="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 10V2m-3 3 3-3 3 3"/><path d="M3 13h10"/></svg>
              {t('exportTheme', settings.language)}
            </button>
          </div>
        </div>
      {/if}
    </section>

    <!-- Footer Actions -->
    <footer class="footer">
      <button class="footer-link" on:click={openFullSettings}>
        <svg class="footer-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 3h12M2 8h12M2 13h12"/><circle cx="5" cy="3" r="1.5" fill="currentColor" stroke="none"/><circle cx="11" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="7" cy="13" r="1.5" fill="currentColor" stroke="none"/></svg>
        {t('openViewer', settings.language)}
      </button>
      <button class="footer-link" on:click={openTestPage}>
        <svg class="footer-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 9v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4"/><path d="M9 2h5v5M14 2 7 9"/></svg>
        {t('openTestPage', settings.language)}
      </button>
    </footer>
  </div>
{/if}

<style>
  /* ═══════════════════════════════════════════════════════════
     mymd Popup — Premium Redesign
     Reference: Raycast / Linear / Arc settings panels
     Grid: 4px base (8 / 12 / 16 / 20)
     ═══════════════════════════════════════════════════════════ */

  .popup {
    background: var(--mymd-bg, #ffffff);
    color: var(--mymd-text, #1a1a1a);
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    font-size: 13px;
    line-height: 1.4;
    width: 320px;
    transition: background-color 0.2s, color 0.2s;

    /* Custom thin scrollbar */
    scrollbar-width: thin;
    scrollbar-color: rgba(0,0,0,0.1) transparent;
  }

  .popup::-webkit-scrollbar { width: 4px; }
  .popup::-webkit-scrollbar-track { background: transparent; }
  .popup::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.1);
    border-radius: 2px;
  }
  .popup::-webkit-scrollbar-thumb:hover {
    background: rgba(0,0,0,0.18);
  }

  /* ─── Header ─── */
  .header {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 10px 16px;
    border-bottom: 0.5px solid rgba(0,0,0,0.06);
  }

  .brand-name {
    font-size: 14px;
    font-weight: 650;
    color: var(--mymd-heading, var(--mymd-text, #1a1a1a));
    letter-spacing: -0.02em;
  }

  .brand-sub {
    font-size: 11px;
    color: var(--mymd-text-muted, var(--mymd-text-secondary, #999));
    letter-spacing: 0.01em;
    font-weight: 400;
  }

  /* ─── Collapsible Section ─── */
  .collapsible-section {
    /* no bottom border — section-header has top border */
  }

  .collapsible-section.advanced {
    background: color-mix(in srgb, var(--mymd-code-bg, #f6f8fa) 30%, var(--mymd-bg, #ffffff));
  }

  .section-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 16px;
    background: transparent;
    border: none;
    border-top: 0.5px solid rgba(0,0,0,0.06);
    cursor: pointer;
    color: var(--mymd-text-muted, var(--mymd-text-secondary, #999));
    font-size: 0.6875rem;  /* 11px */
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-family: inherit;
    user-select: none;
    transition: background-color 0.15s;
  }

  .section-header:hover {
    background: color-mix(in srgb, var(--mymd-text, #1a1a1a) 3%, transparent);
  }

  .section-title {
    color: inherit;
  }

  .chevron {
    font-size: 12px;
    color: inherit;
    opacity: 0.5;
    transform: rotate(0deg);
    transition: transform 0.2s ease;
    display: inline-block;
    line-height: 1;
  }

  .chevron.open {
    transform: rotate(90deg);
  }

  .section-body {
    padding: 2px 16px 8px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .advanced-body {
    gap: 4px;
  }

  /* ─── Row ─── */
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 0;
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
    background: color-mix(in srgb, var(--mymd-text, #1a1a1a) 3%, var(--mymd-bg, #ffffff));
    color: var(--mymd-text, #1a1a1a);
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 6px;
    padding: 5px 28px 5px 10px;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    min-width: 120px;
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 12px;
  }

  .select:hover {
    border-color: rgba(0,0,0,0.15);
  }

  .select:focus {
    border-color: var(--mymd-link, #0969da);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--mymd-link, #0969da) 15%, transparent);
  }

  /* ─── Mode Buttons (pill group) ─── */
  .mode-group {
    display: flex;
    background: color-mix(in srgb, var(--mymd-text, #1a1a1a) 4%, transparent);
    border-radius: 6px;
    padding: 2px;
    gap: 1px;
  }

  .mode-btn {
    width: 30px;
    height: 24px;
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border-radius: 4px;
    transition: all 0.15s;
    color: var(--mymd-text-muted, var(--mymd-text-secondary, #999));
  }

  .mode-btn svg {
    width: 13px;
    height: 13px;
  }

  .mode-btn:hover {
    color: var(--mymd-text, #1a1a1a);
  }

  .mode-btn.active {
    background: var(--mymd-bg, #ffffff);
    color: var(--mymd-text, #1a1a1a);
    box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 0.5px 1px rgba(0,0,0,0.06);
  }

  /* ─── Toggle Switch ─── */
  .toggle {
    position: relative;
    width: 28px;
    height: 16px;
    border-radius: 8px;
    background: rgba(0,0,0,0.12);
    border: none;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .toggle.on {
    background: color-mix(in srgb, var(--mymd-link, #0969da) 75%, white);
  }

  .thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0.5px 2px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: block;
    pointer-events: none;
  }

  .toggle.on .thumb {
    transform: translateX(12px);
  }

  /* ─── Stepper ─── */
  .stepper {
    display: flex;
    align-items: center;
    background: color-mix(in srgb, var(--mymd-text, #1a1a1a) 3%, transparent);
    border-radius: 6px;
    padding: 1px;
  }

  .step-btn {
    width: 24px;
    height: 24px;
    border: none;
    background: none;
    color: var(--mymd-text-muted, var(--mymd-text-secondary, #999));
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background-color 0.15s, color 0.15s;
    font-family: inherit;
  }

  .step-btn:hover:not(:disabled) {
    background: rgba(0,0,0,0.06);
    color: var(--mymd-text, #1a1a1a);
  }

  .step-btn:active:not(:disabled) {
    background: rgba(0,0,0,0.1);
  }

  .step-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }

  .step-val {
    font-size: 12px;
    color: var(--mymd-text, #1a1a1a);
    min-width: 48px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  /* ─── Advanced: CSS Variables ─── */
  .subsection-label {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--mymd-text-muted, var(--mymd-text-secondary, #999));
    margin-bottom: 4px;
    padding-top: 2px;
  }

  .var-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px 12px;
  }

  .var-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    min-height: 28px;
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
    width: 22px;
    height: 22px;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 5px;
    padding: 1px;
    cursor: pointer;
    background: none;
    flex-shrink: 0;
    overflow: hidden;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .color-picker:hover {
    border-color: rgba(0,0,0,0.2);
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
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
    height: 100px;
    font-family: ui-monospace, 'Cascadia Code', 'Fira Code', monospace;
    font-size: 11px;
    line-height: 1.5;
    padding: 8px;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 6px;
    background: color-mix(in srgb, var(--mymd-text, #1a1a1a) 2%, var(--mymd-bg, #ffffff));
    color: var(--mymd-text, #1a1a1a);
    resize: vertical;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .css-textarea:focus {
    border-color: var(--mymd-link, #0969da);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--mymd-link, #0969da) 15%, transparent);
  }

  .css-textarea::placeholder {
    color: var(--mymd-text-muted, var(--mymd-text-secondary, #bbb));
    font-size: 11px;
  }

  /* ─── Import / Export ─── */
  .import-export-row {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  /* ─── Action Button (used in import/export) ─── */
  .action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 0 10px;
    height: 26px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    font-family: inherit;
    white-space: nowrap;
    transition: background-color 0.15s, color 0.15s;
  }

  .action-btn.ghost {
    background: transparent;
    color: var(--mymd-text-muted, var(--mymd-text-secondary, #888));
    border: 1px solid rgba(0,0,0,0.08);
  }

  .action-btn.ghost:hover {
    background: rgba(0,0,0,0.04);
    color: var(--mymd-text, #1a1a1a);
    border-color: rgba(0,0,0,0.12);
  }

  .action-btn.small {
    height: 24px;
    font-size: 11px;
    padding: 0 8px;
  }

  .btn-icon {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
  }

  /* ─── Footer ─── */
  .footer {
    padding: 8px 16px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 0.5px solid rgba(0,0,0,0.06);
  }

  .footer-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 12px;
    font-family: inherit;
    font-weight: 500;
    color: var(--mymd-text-muted, var(--mymd-text-secondary, #888));
    padding: 4px 0;
    transition: color 0.15s;
  }

  .footer-link:hover {
    color: var(--mymd-link, #0969da);
  }

  .footer-icon {
    width: 12px;
    height: 12px;
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
    .section-header,
    .footer-link,
    .color-picker {
      transition: none;
    }
  }
</style>
