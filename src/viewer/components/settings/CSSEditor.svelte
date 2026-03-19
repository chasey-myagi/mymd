<script lang="ts">
  import { onMount } from 'svelte'
  import { settings } from '../../stores/settings'
  import { EditorView } from '@codemirror/view'
  import { basicSetup } from 'codemirror'
  import { EditorState } from '@codemirror/state'
  import { css } from '@codemirror/lang-css'
  import { oneDark } from '@codemirror/theme-one-dark'

  let editorEl: HTMLElement
  let view: EditorView

  onMount(() => {
    const state = EditorState.create({
      doc: $settings.customCSS,
      extensions: [
        basicSetup,
        css(),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            settings.update(s => ({ ...s, customCSS: update.state.doc.toString() }))
          }
        }),
      ],
    })
    view = new EditorView({ state, parent: editorEl })
    return () => view.destroy()
  })
</script>

<section class="settings-section">
  <h4>Custom CSS</h4>
  <div class="css-editor" bind:this={editorEl}></div>
</section>

<style>
  .settings-section {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--mymd-border, #eee);
  }

  .settings-section h4 {
    margin: 0 0 0.75rem;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--mymd-text-secondary, #888);
  }

  .css-editor {
    border: 1px solid var(--mymd-border, #ddd);
    border-radius: var(--mymd-radius-sm, 4px);
    overflow: hidden;
    font-size: 0.8rem;
    min-height: 150px;
    max-height: 300px;
    overflow-y: auto;
  }

  :global(.css-editor .cm-editor) {
    height: 100%;
  }
</style>
