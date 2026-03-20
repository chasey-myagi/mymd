const MD_EXTENSIONS = ['.md', '.mkd', '.mdx', '.markdown']

function isMdFile(name: string): boolean {
  return MD_EXTENSIONS.some(ext => name.toLowerCase().endsWith(ext))
}

export function parseDirectoryListing(html: string): string[] {
  if (!html) return []
  const files: string[] = []

  // Chrome file:// directory listing uses addRow(name, url, isDir, ...)
  const addRowRegex = /addRow\("([^"]+)","[^"]*",(\d)/g
  let match: RegExpExecArray | null
  while ((match = addRowRegex.exec(html)) !== null) {
    const name = match[1]
    const isDir = match[2] === '1'
    if (!isDir && isMdFile(name)) {
      files.push(name)
    }
  }

  // Fallback: <a href> format (older Chrome or HTTP directory index pages)
  if (files.length === 0) {
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>/gi
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1]
      if (isMdFile(href)) {
        files.push(href)
      }
    }
  }

  return files.sort()
}
