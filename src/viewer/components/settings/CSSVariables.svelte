<script lang="ts">
  import { settings } from '../../stores/settings'
  import { VARIABLE_METADATA } from '../../../lib/theme/variables'
  import { getTheme } from '../../../lib/theme/themes'
  import { resolveColorMode } from '../../../lib/theme/engine'

  $: currentTheme = getTheme($settings.theme, resolveColorMode($settings.colorMode))

  function getEffectiveValue(varName: string): string {
    return $settings.cssVariables[varName] ?? currentTheme.cssVariables[varName] ?? ''
  }

  function setVariable(varName: string, value: string) {
    settings.update(s => ({
      ...s,
      cssVariables: { ...s.cssVariables, [varName]: value },
    }))
  }

  function resetVariable(varName: string) {
    settings.update(s => {
      const vars = { ...s.cssVariables }
      delete vars[varName]
      return { ...s, cssVariables: vars }
    })
  }

  const colorVars = Object.entries(VARIABLE_METADATA).filter(([, m]) => m.type === 'color')
</script>

<section class="settings-section">
  <h4>CSS Variables</h4>
  <div class="variables-grid">
    {#each colorVars as [varName, meta]}
      <div class="variable-row">
        <label>{meta.label}</label>
        <input
          type="color"
          value={getEffectiveValue(varName)}
          on:input={(e) => setVariable(varName, e.currentTarget.value)}
        />
        {#if $settings.cssVariables[varName]}
          <button class="reset-btn" on:click={() => resetVariable(varName)}>↺</button>
        {/if}
      </div>
    {/each}
  </div>
</section>
