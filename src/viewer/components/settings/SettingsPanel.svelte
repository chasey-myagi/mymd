<script lang="ts">
  import { showSettings } from '../../stores/ui'
  import ThemeSelector from './ThemeSelector.svelte'
  import FontSettings from './FontSettings.svelte'
  import LayoutSettings from './LayoutSettings.svelte'
  import CSSEditor from './CSSEditor.svelte'
  import CSSVariables from './CSSVariables.svelte'

  function close() {
    $showSettings = false
  }
</script>

{#if $showSettings}
  <div class="settings-overlay" on:click={close} on:keydown={(e) => e.key === 'Escape' && close()}>
    <div class="settings-panel" on:click|stopPropagation role="dialog">
      <div class="settings-header">
        <h2>Settings</h2>
        <button class="close-btn" on:click={close}>✕</button>
      </div>
      <div class="settings-body">
        <ThemeSelector />
        <FontSettings />
        <LayoutSettings />
        <CSSVariables />
        <CSSEditor />
      </div>
    </div>
  </div>
{/if}
