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
