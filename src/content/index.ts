import './styles/inject.css'
// Import global styles directly in TS — CSS @import gets deduplicated by Vite
// and excluded from the content script chunk, so we must import here
import '../viewer/styles/base.css'
import '../viewer/styles/content.css'
import '../viewer/styles/print.css'
import ContentApp from './ContentApp.svelte'

const MD_EXTENSIONS = /\.(md|mkd|mdx|markdown)$/i

function isMarkdownFile(): boolean {
  return MD_EXTENSIONS.test(window.location.pathname)
}

if (isMarkdownFile()) {
  // Grab raw markdown text before modifying DOM
  const rawText = document.body.innerText || document.body.textContent || ''

  // Set page title to filename
  const fileName = decodeURIComponent(window.location.pathname.split('/').pop() ?? 'Untitled')
  document.title = fileName

  // Replace page content with app container
  document.body.innerHTML = ''
  const root = document.createElement('div')
  root.id = 'app'
  document.body.appendChild(root)

  // Mount the Svelte rendering app
  new ContentApp({
    target: root,
    props: {
      rawText,
      fileUrl: window.location.href,
    },
  })

  // Reveal — CSS hides body until this class is added
  document.documentElement.classList.add('mymd-rendered')
}
