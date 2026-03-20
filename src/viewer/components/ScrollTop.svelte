<script lang="ts">
  import { scrollProgress } from '../stores/ui'

  function scrollToTop() {
    document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' })
  }
</script>

{#if $scrollProgress > 10}
  <button class="scroll-top" on:click={scrollToTop} title="Back to top">↑</button>
{/if}

<style>
  .scroll-top {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid var(--mymd-border);
    background: var(--mymd-bg);
    color: var(--mymd-text);
    cursor: pointer;
    font-size: 1.1rem;
    box-shadow: var(--mymd-shadow-md, 0 4px 12px rgba(0,0,0,0.15));
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease;
  }

  .scroll-top:hover {
    transform: translateY(-2px);
  }

  .scroll-top:focus-visible {
    outline: 2px solid var(--mymd-link);
    outline-offset: 2px;
  }
</style>
