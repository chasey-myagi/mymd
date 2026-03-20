<script lang="ts">
  import { scrollProgress } from '../stores/ui'
</script>

<div class="progress-bar">
  <div class="progress-fill" style="width: {$scrollProgress}%"></div>
</div>

<style>
  .progress-bar {
    height: 3px;
    background: var(--mymd-border);
    flex-shrink: 0;
  }

  .progress-fill {
    height: 100%;
    background: var(--mymd-link);
    transition: width 0.1s ease;
  }
</style>
