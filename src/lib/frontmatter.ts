import yaml from 'js-yaml'

interface FrontmatterResult {
  data: Record<string, unknown> | null
  content: string
}

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n?---\n?([\s\S]*)$/

export function parseFrontmatter(markdown: string): FrontmatterResult {
  if (!markdown.startsWith('---')) {
    return { data: null, content: markdown }
  }
  const match = markdown.match(FRONTMATTER_RE)
  if (!match) {
    return { data: null, content: markdown }
  }
  try {
    const raw = match[1].trim()
    const data = raw ? (yaml.load(raw) as Record<string, unknown>) : {}
    return { data, content: match[2].trim() }
  } catch {
    return { data: null, content: markdown }
  }
}
