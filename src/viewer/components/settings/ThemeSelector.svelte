<script lang="ts">
  import { settings } from '../../stores/settings'
  import { getThemeNames } from '../../../lib/theme/themes'
  import { importTheme, exportTheme, resolveColorMode } from '../../../lib/theme/engine'
  import { getTheme } from '../../../lib/theme/themes'

  const themeNames = getThemeNames()

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
      } catch (e) {
        alert('Invalid theme file')
      }
    }
    input.click()
  }

  function handleExport() {
    const mode = resolveColorMode($settings.colorMode)
    const theme = { ...getTheme($settings.theme, mode), cssVariables: { ...getTheme($settings.theme, mode).cssVariables, ...$settings.cssVariables } }
    const blob = new Blob([exportTheme(theme)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mymd-theme-${$settings.theme}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
</script>

<section class="settings-section">
  <h4>Theme</h4>
  <div class="theme-grid">
    {#each themeNames as name}
      <button
        class="theme-card"
        class:active={$settings.theme === name}
        on:click={() => settings.update(s => ({ ...s, theme: name }))}
      >
        {name}
      </button>
    {/each}
  </div>

  <div class="settings-row">
    <label>Color Mode</label>
    <select bind:value={$settings.colorMode} on:change={() => settings.update(s => ({ ...s, colorMode: $settings.colorMode }))}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  </div>

  <div class="settings-row">
    <button class="btn" on:click={handleImport}>Import Theme</button>
    <button class="btn" on:click={handleExport}>Export Theme</button>
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
    color: var(--mymd-text-secondary, #888);
  }

  .theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .theme-card {
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--mymd-border, #ddd);
    border-radius: var(--mymd-radius-sm, 4px);
    background: var(--mymd-code-bg, #f5f5f5);
    color: var(--mymd-text, #333);
    font-size: 0.8rem;
    cursor: pointer;
    text-transform: capitalize;
    transition: border-color 0.15s, background 0.15s;
  }

  .theme-card:hover {
    border-color: var(--mymd-link, #0969da);
  }

  .theme-card.active {
    border-color: var(--mymd-link, #0969da);
    background: var(--mymd-sidebar-active, #0969da);
    color: #fff;
  }

  .settings-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .settings-row label {
    font-size: 0.85rem;
    color: var(--mymd-text-secondary, #666);
    min-width: 80px;
  }

  select {
    flex: 1;
    padding: 0.3rem 0.5rem;
    border: 1px solid var(--mymd-border, #ddd);
    border-radius: var(--mymd-radius-sm, 4px);
    background: var(--mymd-bg, #fff);
    color: var(--mymd-text, #333);
    font-size: 0.85rem;
  }

  .btn {
    padding: 0.35rem 0.75rem;
    border: 1px solid var(--mymd-border, #ddd);
    border-radius: var(--mymd-radius-sm, 4px);
    background: var(--mymd-code-bg, #f5f5f5);
    color: var(--mymd-text, #333);
    font-size: 0.8rem;
    cursor: pointer;
  }

  .btn:hover {
    border-color: var(--mymd-link, #0969da);
    color: var(--mymd-link, #0969da);
  }
</style>
