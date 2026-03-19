<script lang="ts">
  import { onMount } from 'svelte'
  import { loadSettings, saveSettings } from '../lib/storage'
  import { getTheme, getThemeNames } from '../lib/theme/themes/index'
  import { resolveColorMode, applyTheme } from '../lib/theme/engine'
  import { DEFAULT_SETTINGS, type MymdSettings } from '../types'

  let settings: MymdSettings = { ...DEFAULT_SETTINGS }
  let isLoaded = false

  const themeNames = getThemeNames()

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

    <!-- Theme & Color Mode -->
    <section class="section">
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
    </section>

    <!-- Feature Toggles -->
    <section class="section">
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
    </section>

    <!-- Steppers -->
    <section class="section">
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
    </section>

    <!-- Footer Actions -->
    <footer class="footer">
      <button class="action-btn primary" on:click={openFullSettings}>
        <svg class="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 3h12M2 8h12M2 13h12"/><circle cx="5" cy="3" r="1.5" fill="currentColor" stroke="none"/><circle cx="11" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="7" cy="13" r="1.5" fill="currentColor" stroke="none"/></svg>
        All Settings
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
  }

  /* ─── Header ─── */
  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px 10px;
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

  /* ─── Section ─── */
  .section {
    padding: 8px 16px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .section + .section {
    padding-top: 4px;
    border-top: 1px solid color-mix(in srgb, var(--mymd-border, #e5e7eb) 50%, transparent);
  }

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

  /* ─── Footer ─── */
  .footer {
    padding: 8px 16px 12px;
    display: flex;
    gap: 8px;
    border-top: 1px solid color-mix(in srgb, var(--mymd-border, #e5e7eb) 50%, transparent);
    margin-top: 4px;
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
    .popup {
      transition: none;
    }
  }
</style>
