<script lang="ts">
  import { settings } from '../../stores/settings'
</script>

<section class="settings-section">
  <h4>Typography</h4>

  <div class="settings-row">
    <label>Font Family</label>
    <select bind:value={$settings.fontFamily}>
      <option value="system-ui, sans-serif">System Sans</option>
      <option value="Georgia, serif">Serif</option>
      <option value="ui-monospace, monospace">Monospace</option>
    </select>
  </div>

  <div class="settings-row">
    <label>Font Size: {$settings.fontSize}px</label>
    <input type="range" min="12" max="24" step="1" bind:value={$settings.fontSize} />
  </div>

  <div class="settings-row">
    <label>Line Height: {$settings.lineHeight}</label>
    <input type="range" min="1.2" max="2.0" step="0.1" bind:value={$settings.lineHeight} />
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

  .settings-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  label {
    font-size: 0.85rem;
    color: var(--mymd-text, #333);
    min-width: 140px;
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

  input[type="range"] {
    flex: 1;
    accent-color: var(--mymd-link, #0969da);
  }
</style>
