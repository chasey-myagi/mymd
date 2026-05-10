// Link classification and resolution helpers shared by the renderer
// (which tags anchors at render time) and the click handler (which
// resolves and routes navigation at click time).

const MD_EXTENSIONS_RE = /\.(md|mkd|mdx|markdown)(\?[^#]*)?(#.*)?$/i
const PROTOCOL_RE = /^[a-z][a-z0-9+.-]*:/i

export function hasMdExtension(href: string): boolean {
  return MD_EXTENSIONS_RE.test(href)
}

export function isAnchorOnly(href: string): boolean {
  return href.startsWith('#')
}

// True for any href that carries an explicit protocol (http, https, mailto,
// tel, ftp, file, ...). Used to decide whether to add target=_blank.
export function hasExplicitProtocol(href: string): boolean {
  return PROTOCOL_RE.test(href)
}

// Resolve a markdown link or wikilink target against the current document
// URL. For wikilinks without an extension, append `.md` before resolving.
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
  if (isWikilink) {
    const hashIdx = target.indexOf('#')
    const path = hashIdx >= 0 ? target.slice(0, hashIdx) : target
    const fragment = hashIdx >= 0 ? target.slice(hashIdx) : ''
    // Only synthesize `.md` when there is a real path with no extension —
    // an anchor-only wikilink like [[#section]] should resolve in-page.
    if (path && !/\.[a-z0-9]+$/i.test(path)) {
      target = `${path}.md${fragment}`
    }
  }

  try {
    return new URL(target, documentUrl).href
  } catch {
    return null
  }
}
