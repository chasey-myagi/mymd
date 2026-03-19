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
          <button class="reset-btn" on:click={() => resetVariable(varName)} title="Reset to theme default">↺</button>
        {/if}
      </div>
    {/each}
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

  .variables-grid {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .variable-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  label {
    flex: 1;
    font-size: 0.82rem;
    color: var(--mymd-text, #333);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  input[type="color"] {
    width: 32px;
    height: 22px;
    padding: 0;
    border: 1px solid var(--mymd-border, #ddd);
    border-radius: var(--mymd-radius-sm, 4px);
    cursor: pointer;
    background: none;
  }

  .reset-btn {
    background: none;
    border: none;
    font-size: 0.9rem;
    cursor: pointer;
    color: var(--mymd-text-secondary, #888);
    padding: 0 0.2rem;
    line-height: 1;
  }

  .reset-btn:hover {
    color: var(--mymd-link, #0969da);
  }
</style>
