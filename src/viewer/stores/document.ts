import { writable, derived } from 'svelte/store'
import type { DocumentState } from '../../types'

export const documentState = writable<DocumentState>({
  url: '',
  rawMarkdown: '',
  renderedHTML: '',
  headings: [],
  frontmatter: null,
  wordCount: 0,
  readingTime: 0,
})

export const headings = derived(documentState, $doc => $doc.headings)
export const frontmatter = derived(documentState, $doc => $doc.frontmatter)
