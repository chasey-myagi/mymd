<script lang="ts">
  export let error: string
  export let type: 'network' | 'notfound' | 'permission' | 'toolarge' = 'network'

  function retry() {
    window.location.reload()
  }
</script>

<div class="error-page">
  <h1>{type === 'notfound' ? '404' : type === 'permission' ? 'Permission Denied' : 'Error'}</h1>
  <p>{error}</p>
  {#if type === 'permission'}
    <p>Please enable "Allow access to file URLs" in chrome://extensions for mymd.</p>
  {/if}
  {#if type === 'network'}
    <button on:click={retry}>Retry</button>
  {/if}
</div>

<style>
  .error-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
    padding: 2rem;
    text-align: center;
    color: var(--mymd-text);
  }

  .error-page h1 {
    font-size: 3rem;
    font-weight: 700;
    color: var(--mymd-text);
  }

  .error-page p {
    color: var(--mymd-text-muted);
    max-width: 480px;
  }

  .error-page button {
    padding: 8px 20px;
    background: var(--mymd-link);
    color: #fff;
    border: none;
    border-radius: var(--mymd-radius, 6px);
    cursor: pointer;
    font-size: 0.875rem;
    transition: background 0.15s ease;
  }

  .error-page button:hover {
    background: var(--mymd-link-hover, var(--mymd-link));
  }

  .error-page button:focus-visible {
    outline: 2px solid var(--mymd-link);
    outline-offset: 2px;
  }
</style>
