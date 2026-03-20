import { createHighlighterCore, type HighlighterCore } from '@shikijs/core'
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript'

// Static imports — avoids dynamic import() which breaks on file:// pages
import langJavascript from '@shikijs/langs/javascript'
import langTypescript from '@shikijs/langs/typescript'
import langPython from '@shikijs/langs/python'
import langGo from '@shikijs/langs/go'
import langRust from '@shikijs/langs/rust'
import langJava from '@shikijs/langs/java'
import langC from '@shikijs/langs/c'
import langCpp from '@shikijs/langs/cpp'
import langShellscript from '@shikijs/langs/shellscript'
import langJson from '@shikijs/langs/json'
import langYaml from '@shikijs/langs/yaml'
import langHtml from '@shikijs/langs/html'
import langCss from '@shikijs/langs/css'
import langSql from '@shikijs/langs/sql'
import langMarkdown from '@shikijs/langs/markdown'
import langJsx from '@shikijs/langs/jsx'
import langTsx from '@shikijs/langs/tsx'
import langBash from '@shikijs/langs/bash'
import langDiff from '@shikijs/langs/diff'
import langXml from '@shikijs/langs/xml'

import themeGithubDark from '@shikijs/themes/github-dark'
import themeGithubLight from '@shikijs/themes/github-light'
import themeOneDarkPro from '@shikijs/themes/one-dark-pro'
import themeVitesseLight from '@shikijs/themes/vitesse-light'
import themeNord from '@shikijs/themes/nord'

const STATIC_LANGS = [
  langJavascript, langTypescript, langPython, langGo, langRust, langJava,
  langC, langCpp, langShellscript, langJson, langYaml, langHtml, langCss,
  langSql, langMarkdown, langJsx, langTsx, langBash, langDiff, langXml,
]

const STATIC_THEMES = [
  themeGithubDark, themeGithubLight, themeOneDarkPro, themeVitesseLight, themeNord,
]

let highlighter: HighlighterCore | null = null

export async function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighter) {
    highlighter = await createHighlighterCore({
      engine: createJavaScriptRegexEngine(),
      themes: STATIC_THEMES,
      langs: STATIC_LANGS,
    })
  }
  return highlighter
}

export async function highlightCode(code: string, lang: string, theme: string): Promise<string> {
  const hl = await getHighlighter()
  const loadedLangs = hl.getLoadedLanguages()

  if (!loadedLangs.includes(lang)) {
    // Dynamic loading won't work on file:// pages, gracefully fall back to plaintext
    lang = 'text'
  }

  return hl.codeToHtml(code, { lang, theme })
}
