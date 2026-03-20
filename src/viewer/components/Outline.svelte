<script lang="ts">
  import { headings } from '../stores/document'
  import { onMount, onDestroy, tick } from 'svelte'

  let activeId = ''
  let observer: IntersectionObserver

  onMount(() => {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeId = entry.target.id
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    $headings.forEach(h => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })
  })

  onDestroy(() => observer?.disconnect())

  // Scroll active outline item into view within the panel
  $: if (activeId) {
    tick().then(() => {
      const el = document.querySelector('.outline-item.active button') as HTMLElement | null
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
</script>

<ul class="outline-list">
  {#each $headings as heading}
    <li
      class="outline-item"
      class:active={heading.id === activeId}
      class:is-top={heading.level <= 2}
      style="padding-left: {(heading.level - 1) * 14 + 8}px"
    >
      <button title={heading.text} on:click={() => scrollTo(heading.id)}>
        {heading.text}
      </button>
    </li>
  {/each}
</ul>

<style>
  .outline-list {
    list-style: none;
    margin: 0;
    padding: 4px 6px;
  }

  .outline-item button {
    background: none;
    border: none;
    cursor: pointer;
    width: 100%;
    text-align: left;
    padding: 4px 8px;
    font-size: 0.8rem;
    font-weight: 400;
    color: var(--mymd-text-muted);
    border-radius: var(--mymd-radius-sm, 4px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    max-width: 100%;
    transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
  }

  /* Top-level headings (h1, h2) get slightly bolder treatment */
  .outline-item.is-top button {
    font-weight: 500;
  }

  .outline-item.active button {
    color: var(--mymd-link);
    background: color-mix(in srgb, var(--mymd-link) 6%, transparent);
    box-shadow: inset 2px 0 0 var(--mymd-link);
    font-weight: 500;
  }

  .outline-item button:hover {
    background: var(--mymd-hover);
    color: var(--mymd-text);
  }

  .outline-item button:focus-visible {
    outline: 2px solid var(--mymd-link);
    outline-offset: -2px;
    border-radius: var(--mymd-radius-sm, 4px);
  }
</style>
