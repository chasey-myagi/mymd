// Link classification and resolution helpers shared by the renderer
// (which tags anchors at render time) and the click handler (which
// resolves and routes navigation at click time).

const MD_EXTENSIONS_RE = /\.(md|mkd|mdx|markdown)(\?[^#]*)?(#.*)?$/i
const MD_EXTENSION_PATH_RE = /\.(md|mkd|mdx|markdown)$/i
const SAFE_EXTERNAL_RE = /^(https?|ftp):/i

export function hasMdExtension(href: string): boolean {
  return MD_EXTENSIONS_RE.test(href)
}

export function isAnchorOnly(href: string): boolean {
  return href.startsWith('#')
}

// True only for protocols where opening in a new tab is meaningful and safe.
// Excludes mailto:/tel: (browser handles them) and javascript: (dangerous).
export function isSafeExternal(href: string): boolean {
  return SAFE_EXTERNAL_RE.test(href)
}

// Resolve a markdown link or wikilink target against the current document
// URL. For wikilinks the semantics is "another markdown file in the vault",
// so append `.md` unless the user already wrote a markdown extension.
// Returns null when resolution fails (e.g. empty href, invalid base URL).
export function resolveMarkdownHref(
  href: string,
  documentUrl: string,
  isWikilink: boolean,
): string | null {
  if (!documentUrl) return null
  const trimmed = href.trim()
  if (!trimmed) return null

  let target = trimmed
  if (isWikilink && !target.startsWith('#')) {
    // [[#section]] is an in-page anchor — leave it alone.
    const hashIdx = target.indexOf('#')
    const path = hashIdx >= 0 ? target.slice(0, hashIdx) : target
    const fragment = hashIdx >= 0 ? target.slice(hashIdx) : ''
    // Only skip `.md` synthesis when the path *already* ends in a known
    // markdown extension. Names like `v1.2` or `2024.01.05 notes` look
    // like they have an extension to a naive regex but are still markdown
    // page references in Obsidian-style wikilinks.
    if (!MD_EXTENSION_PATH_RE.test(path)) {
      target = `${path}.md${fragment}`
    }
  }

  try {
    return new URL(target, documentUrl).href
  } catch {
    return null
  }
}
