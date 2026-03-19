<script lang="ts">
  import { settings } from '../../stores/settings'
</script>

<section class="settings-section">
  <h4>Layout</h4>

  <div class="settings-row slider-row">
    <label>Content Width: {$settings.contentWidth}px</label>
    <input type="range" min="600" max="1400" step="50" bind:value={$settings.contentWidth} />
  </div>

  <div class="settings-row">
    <label><input type="checkbox" bind:checked={$settings.showOutline} /> Show Outline</label>
  </div>
  <div class="settings-row">
    <label><input type="checkbox" bind:checked={$settings.showFileList} /> Show File List</label>
  </div>
  <div class="settings-row">
    <label><input type="checkbox" bind:checked={$settings.showProgressBar} /> Show Progress Bar</label>
  </div>
  <div class="settings-row">
    <label><input type="checkbox" bind:checked={$settings.showStats} /> Show Stats</label>
  </div>
  <div class="settings-row">
    <label><input type="checkbox" bind:checked={$settings.showFrontmatter} /> Show Frontmatter</label>
  </div>
  <div class="settings-row">
    <label><input type="checkbox" bind:checked={$settings.autoRefresh} /> Auto Refresh</label>
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
    gap: 0.5rem;
    margin-bottom: 0.4rem;
  }

  .slider-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
  }

  label {
    font-size: 0.85rem;
    color: var(--mymd-text, #333);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  input[type="range"] {
    width: 100%;
    accent-color: var(--mymd-link, #0969da);
  }

  input[type="checkbox"] {
    accent-color: var(--mymd-link, #0969da);
    width: 14px;
    height: 14px;
  }
</style>
