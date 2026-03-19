<script lang="ts">
  import { frontmatter } from '../stores/document'
  import { settings } from '../stores/settings'
</script>

{#if $settings.showFrontmatter && $frontmatter}
  <div class="frontmatter-banner">
    <table>
      {#each Object.entries($frontmatter) as [key, value]}
        <tr>
          <td class="fm-key">{key}</td>
          <td class="fm-value">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</td>
        </tr>
      {/each}
    </table>
  </div>
{/if}

<style>
  .frontmatter-banner {
    margin: 1rem 0;
    padding: 0.75rem 1rem;
    border: 1px solid var(--mymd-border, #e0e0e0);
    border-radius: 6px;
    background: var(--mymd-code-bg, #f6f8fa);
    font-size: 0.875rem;
  }

  table {
    border-collapse: collapse;
    width: 100%;
  }

  td {
    padding: 2px 8px 2px 0;
    vertical-align: top;
  }

  .fm-key {
    font-weight: 600;
    color: var(--mymd-text-muted, #666);
    white-space: nowrap;
    width: 1%;
  }

  .fm-value {
    color: var(--mymd-text, #333);
    font-family: var(--mymd-font-code, monospace);
  }
</style>
