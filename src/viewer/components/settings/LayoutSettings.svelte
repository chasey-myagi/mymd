<script lang="ts">
  import { settings } from '../../stores/settings'
</script>

<section class="settings-section">
  <h4>Layout</h4>

  <div class="settings-row">
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
