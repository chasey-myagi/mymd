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

  // GitHub blob page → the github.com /raw/ endpoint (NOT raw.githubusercontent
  // directly). github.com honours the logged-in session cookie and 302-redirects
  // to raw.githubusercontent.com — adding a ?token= for private repos — which the
  // fetch follows. raw.githubusercontent.com on its own returns 404 for private
  // repos because it only accepts that token, not cookies.
  if (u.hostname === 'github.com') {
    const m = u.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/(.+)$/)
    if (m) {
      return `https://github.com/${m[1]}/${m[2]}/raw/${m[3]}${u.search}`
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

/**
 * Every host-permission pattern a fetch of `target` may need — including hosts
 * reached via redirect. A github.com /raw/ request 302s to
 * raw.githubusercontent.com, and the extension needs permission for that hop
 * too, so both are required up front. Returns [] for non-http(s) URLs.
 */
export function requiredOrigins(target: string): string[] {
  const base = originPattern(target)
  if (!base) return []
  const { hostname } = new URL(target)
  if (hostname === 'github.com') {
    return [base, 'https://raw.githubusercontent.com/*']
  }
  return [base]
}

/** Bare hostname for display, or the input unchanged if it can't be parsed. */
export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
