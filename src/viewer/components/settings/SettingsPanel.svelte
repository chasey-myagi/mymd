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

<style>
  .settings-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1000;
    display: flex;
    justify-content: flex-end;
  }

  .settings-panel {
    width: 380px;
    max-width: 100%;
    height: 100%;
    background: var(--mymd-bg, #fff);
    color: var(--mymd-text, #333);
    border-left: 1px solid var(--mymd-border, #ddd);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: var(--mymd-shadow-md, 0 4px 12px rgba(0,0,0,0.15));
    animation: slide-in 0.2s ease-out;
  }

  @keyframes slide-in {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  .settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--mymd-border, #ddd);
    flex-shrink: 0;
  }

  .settings-header h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.1rem;
    cursor: pointer;
    color: var(--mymd-text-secondary, #666);
    padding: 0.25rem 0.5rem;
    border-radius: var(--mymd-radius-sm, 4px);
    line-height: 1;
  }

  .close-btn:hover {
    background: var(--mymd-sidebar-hover, #eee);
    color: var(--mymd-text, #333);
  }

  .settings-body {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem 0;
  }
</style>
