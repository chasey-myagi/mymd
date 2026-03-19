<script lang="ts">
  import { scrollProgress } from '../stores/ui'
</script>

<div class="progress-bar">
  <div class="progress-fill" style="width: {$scrollProgress}%"></div>
</div>
