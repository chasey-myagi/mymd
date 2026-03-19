<script lang="ts">
  import { scrollProgress } from '../stores/ui'

  function scrollToTop() {
    document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' })
  }
</script>

{#if $scrollProgress > 10}
  <button class="scroll-top" on:click={scrollToTop} title="Back to top">↑</button>
{/if}
