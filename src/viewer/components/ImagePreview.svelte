<script lang="ts">
  import { previewImageSrc } from '../stores/ui'

  let scale = 1

  $: if ($previewImageSrc) scale = 1

  function close() {
    previewImageSrc.set(null)
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault()
    scale = Math.max(0.1, Math.min(5, scale - e.deltaY * 0.001))
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close()
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $previewImageSrc}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
  <div class="image-overlay" on:click={close} on:wheel={handleWheel} role="dialog" aria-modal="true">
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
    <img
      src={$previewImageSrc}
      alt=""
      style="transform: scale({scale})"
      on:click|stopPropagation
    />
  </div>
{/if}

<style>
  .image-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: zoom-out;
  }

  img {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
    transition: transform 0.1s ease;
    cursor: default;
    border-radius: 4px;
  }
</style>
