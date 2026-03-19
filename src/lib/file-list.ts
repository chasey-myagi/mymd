const MD_EXTENSIONS = ['.md', '.mkd', '.mdx', '.markdown']

export function parseDirectoryListing(html: string): string[] {
  if (!html) return []
  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>/gi
  const files: string[] = []
  let match: RegExpExecArray | null
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]
    if (MD_EXTENSIONS.some(ext => href.toLowerCase().endsWith(ext))) {
      files.push(href)
    }
  }
  return files.sort()
}
