<script lang="ts">
  import { t, type Language } from '../../lib/i18n'

  export let error: string
  export let type: 'network' | 'notfound' | 'permission' | 'toolarge' = 'network'
  // Host-permission grant flow (http/https). When set, this is a missing
  // host-permission rather than the file:// "allow file URLs" case.
  export let permissionOrigin = ''
  export let host = ''
  export let lang: Language = 'zh'
  export let onGrant: (() => void) | undefined = undefined

  $: needsHostGrant = type === 'permission' && !!permissionOrigin

  function retry() {
    window.location.reload()
  }
</script>

<div class="error-page">
  {#if needsHostGrant}
    <h1>{t('permNeeded', lang)}</h1>
    <p>{t('permPrompt', lang)}</p>
    <p class="host">{host}</p>
    <button on:click={() => onGrant?.()}>{t('permGrant', lang)} {host}</button>
    <p class="hint">{t('permHint', lang)}</p>
  {:else}
    <h1>{type === 'notfound' ? '404' : type === 'permission' ? t('permNeeded', lang) : 'Error'}</h1>
    <p>{error}</p>
    {#if type === 'permission'}
      <p>{t('fileUrlHint', lang)}</p>
    {/if}
    {#if type === 'network'}
      <button on:click={retry}>{t('retry', lang)}</button>
    {/if}
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

  .error-page .host {
    font-family: var(--mymd-font-code, monospace);
    font-size: 0.9rem;
    color: var(--mymd-text);
    word-break: break-all;
    margin-top: -0.25rem;
  }

  .error-page .hint {
    font-size: 0.8rem;
    opacity: 0.8;
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
