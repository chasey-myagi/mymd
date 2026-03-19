<script lang="ts">
  import { onMount } from 'svelte'
  import { settings } from '../../stores/settings'
  import { EditorView, basicSetup } from '@codemirror/view'
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
