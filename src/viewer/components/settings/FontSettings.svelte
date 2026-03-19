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
