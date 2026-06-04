// Utilities for turning "rendered page" URLs into raw-content URLs and for
// deriving the host-permission match pattern a cross-origin fetch needs.

/**
 * Rewrite common code-host "blob" pages to their raw-content equivalents so the
 * fetched body is the Markdown source itself, not the surrounding HTML page.
 * Returns the URL unchanged when no rule applies or it can't be parsed.
 */
export function normalizeFetchUrl(url: string): string {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return url
  }

  // GitHub blob/raw page → raw.githubusercontent.com
  // https://github.com/{owner}/{repo}/blob/{branch}/{path...}
  // The {branch}/{path} layout is identical on raw.githubusercontent.com, so a
  // branch containing slashes still maps correctly.
  if (u.hostname === 'github.com') {
    const m = u.pathname.match(/^\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/)
    if (m) {
      return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}${u.search}`
    }
  }

  // GitLab blob page → raw (same host): /-/blob/ → /-/raw/
  if (u.hostname === 'gitlab.com' || u.hostname.endsWith('.gitlab.com')) {
    if (u.pathname.includes('/-/blob/')) {
      u.pathname = u.pathname.replace('/-/blob/', '/-/raw/')
      return u.toString()
    }
  }

  // Bitbucket source page → raw: /{ws}/{repo}/src/ → /{ws}/{repo}/raw/
  if (u.hostname === 'bitbucket.org') {
    if (/^\/[^/]+\/[^/]+\/src\//.test(u.pathname)) {
      u.pathname = u.pathname.replace('/src/', '/raw/')
      return u.toString()
    }
  }

  return url
}

/**
 * The host-permission match pattern for a URL's origin, e.g.
 * "https://raw.githubusercontent.com/*". Returns null for non-http(s) URLs.
 */
export function originPattern(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return `${u.protocol}//${u.hostname}/*`
  } catch {
    return null
  }
}

/** Bare hostname for display, or the input unchanged if it can't be parsed. */
export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
