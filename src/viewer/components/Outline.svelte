<script lang="ts">
  import { headings } from '../stores/document'
  import { onMount, onDestroy } from 'svelte'

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

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
</script>

<nav class="outline">
  <h3 class="outline-title">Outline</h3>
  <ul class="outline-list">
    {#each $headings as heading}
      <li
        class="outline-item"
        class:active={heading.id === activeId}
        style="padding-left: {(heading.level - 1) * 12 + 8}px"
      >
        <button title={heading.text} on:click={() => scrollTo(heading.id)}>
          {heading.text}
        </button>
      </li>
    {/each}
  </ul>
</nav>
