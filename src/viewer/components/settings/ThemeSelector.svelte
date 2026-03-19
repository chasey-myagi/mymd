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
    <button on:click={handleImport}>Import Theme</button>
    <button on:click={handleExport}>Export Theme</button>
  </div>
</section>
