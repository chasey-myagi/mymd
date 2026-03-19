import { createHighlighter, type Highlighter, type BundledLanguage } from 'shiki'

const BUNDLED_LANGS: BundledLanguage[] = [
  'javascript', 'typescript', 'python', 'go', 'rust', 'java',
  'c', 'cpp', 'shellscript', 'json', 'yaml', 'html', 'css',
  'sql', 'markdown', 'jsx', 'tsx', 'bash', 'diff', 'xml',
]

let highlighter: Highlighter | null = null

export async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['github-dark', 'github-light', 'one-dark-pro', 'vitesse-light', 'nord'],
      langs: BUNDLED_LANGS,
    })
  }
  return highlighter
}

export async function highlightCode(code: string, lang: string, theme: string): Promise<string> {
  const hl = await getHighlighter()
  const loadedLangs = hl.getLoadedLanguages()

  if (!loadedLangs.includes(lang as BundledLanguage)) {
    try {
      await hl.loadLanguage(lang as BundledLanguage)
    } catch {
      lang = 'text'
    }
  }

  return hl.codeToHtml(code, { lang, theme })
}
