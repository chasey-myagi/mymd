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
      <span class="logo">Md</span>
      <div class="brand-text">
        <span class="brand-name">mymd</span>
        <span class="brand-sub">Beautiful Markdown Preview</span>
      </div>
    </header>

    <div class="divider" />

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
          >☀️</button>
          <button
            class="mode-btn"
            class:active={settings.colorMode === 'dark'}
            on:click={() => { settings.colorMode = 'dark'; settings = settings; persist() }}
            title="Dark"
          >🌙</button>
          <button
            class="mode-btn"
            class:active={settings.colorMode === 'system'}
            on:click={() => { settings.colorMode = 'system'; settings = settings; persist() }}
            title="System"
          >🖥️</button>
        </div>
      </div>
    </section>

    <div class="divider" />

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

    <div class="divider" />

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

    <div class="divider" />

    <!-- Footer Actions -->
    <footer class="footer">
      <button class="action-btn" on:click={openFullSettings}>⚙ Full Settings</button>
      <button class="action-btn" on:click={openTestPage}>📖 Open Test Page</button>
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
    transition: background 0.2s, color 0.2s;
  }

  /* Header */
  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
  }

  .logo {
    width: 32px;
    height: 32px;
    border-radius: var(--mymd-radius-md, 8px);
    background: var(--mymd-link, #0969da);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    letter-spacing: 0.03em;
  }

  .brand-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .brand-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--mymd-heading, var(--mymd-text, #1a1a1a));
    line-height: 1.2;
  }

  .brand-sub {
    font-size: 11px;
    color: var(--mymd-text-secondary, #666);
  }

  /* Divider */
  .divider {
    height: 1px;
    background: var(--mymd-border, #e5e7eb);
  }

  /* Section */
  .section {
    padding: 8px 14px;
    display: flex;
    flex-direction: column;
    gap: 2px;
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

  /* Select */
  .select {
    background: var(--mymd-bg, #ffffff);
    color: var(--mymd-text, #1a1a1a);
    border: 1px solid var(--mymd-border, #d0d5dd);
    border-radius: var(--mymd-radius-sm, 4px);
    padding: 4px 6px;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    min-width: 110px;
    transition: border-color 0.1s;
    outline: none;
  }

  .select:focus {
    border-color: var(--mymd-link, #0969da);
  }

  /* Mode buttons */
  .mode-group {
    display: flex;
    gap: 4px;
  }

  .mode-btn {
    width: 30px;
    height: 26px;
    border: 1px solid var(--mymd-border, #d0d5dd);
    background: transparent;
    border-radius: var(--mymd-radius-sm, 4px);
    cursor: pointer;
    font-size: 13px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background 0.1s, border-color 0.1s;
    color: var(--mymd-text, #1a1a1a);
  }

  .mode-btn:hover {
    background: var(--mymd-sidebar-bg, #f3f4f6);
  }

  .mode-btn.active {
    background: var(--mymd-link, #0969da);
    border-color: var(--mymd-link, #0969da);
  }

  /* Toggle switch */
  .toggle {
    position: relative;
    width: 36px;
    height: 20px;
    border-radius: 10px;
    background: var(--mymd-border, #ccc);
    border: none;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: background 0.15s ease;
  }

  .toggle.on {
    background: var(--mymd-link, #0969da);
  }

  .thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: transform 0.15s ease;
    display: block;
    pointer-events: none;
  }

  .toggle.on .thumb {
    transform: translateX(16px);
  }

  /* Stepper */
  .stepper {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .step-btn {
    width: 24px;
    height: 24px;
    border: 1px solid var(--mymd-border, #d0d5dd);
    background: var(--mymd-sidebar-bg, #f6f8fa);
    color: var(--mymd-text, #1a1a1a);
    border-radius: var(--mymd-radius-sm, 4px);
    cursor: pointer;
    font-size: 15px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background 0.1s;
    font-family: inherit;
  }

  .step-btn:hover:not(:disabled) {
    background: var(--mymd-border, #e5e7eb);
  }

  .step-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .step-val {
    font-size: 12px;
    color: var(--mymd-text-secondary, #666);
    min-width: 40px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  /* Footer */
  .footer {
    padding: 8px 14px 10px;
    display: flex;
    gap: 8px;
  }

  .action-btn {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid var(--mymd-border, #d0d5dd);
    background: var(--mymd-sidebar-bg, #f6f8fa);
    color: var(--mymd-text, #1a1a1a);
    border-radius: var(--mymd-radius-sm, 4px);
    cursor: pointer;
    font-size: 12px;
    font-family: inherit;
    text-align: center;
    transition: background 0.1s;
    white-space: nowrap;
  }

  .action-btn:hover {
    background: var(--mymd-border, #e5e7eb);
  }

  /* Respect reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .toggle,
    .thumb {
      transition: none;
    }
  }
</style>
