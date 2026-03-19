<script lang="ts">
  import { showOutline, showFileList } from './stores/ui'
  import FileList from './components/FileList.svelte'
  import Outline from './components/Outline.svelte'

  let message = 'mymd — Markdown Preview'
</script>

<div class="app-layout">
  {#if $showFileList}
    <aside class="sidebar sidebar-left">
      <FileList />
    </aside>
  {/if}

  <main class="main-content">
    <!-- MarkdownContent component goes here in Task 8 -->
    <h1>{message}</h1>
  </main>

  {#if $showOutline}
    <aside class="sidebar sidebar-right">
      <Outline />
    </aside>
  {/if}
</div>
