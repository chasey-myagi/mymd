export interface MymdSettings {
  theme: string
  colorMode: 'light' | 'dark' | 'system'
  customCSS: string
  cssVariables: Record<string, string>
  fontFamily: string
  fontSize: number
  lineHeight: number
  contentWidth: number
  autoRefresh: boolean
  autoRefreshInterval: number
  showOutline: boolean
  showFileList: boolean
  showProgressBar: boolean
  showStats: boolean
  rememberScrollPosition: boolean
  showFrontmatter: boolean
  shortcuts: Record<string, string>
}

export interface MymdTheme {
  name: string
  version: number
  colorMode: 'light' | 'dark'
  cssVariables: Record<string, string>
  customCSS?: string
  codeTheme?: string
  fonts?: {
    body?: string
    heading?: string
    code?: string
  }
}

export interface DocumentState {
  url: string
  rawMarkdown: string
  renderedHTML: string
  headings: Heading[]
  frontmatter: Record<string, unknown> | null
  wordCount: number
  readingTime: number
}

export interface Heading {
  level: number
  text: string
  id: string
}

export const DEFAULT_SETTINGS: MymdSettings = {
  theme: 'github',
  colorMode: 'system',
  customCSS: '',
  cssVariables: {},
  fontFamily: 'system-ui, sans-serif',
  fontSize: 16,
  lineHeight: 1.6,
  contentWidth: 800,
  autoRefresh: true,
  autoRefreshInterval: 2000,
  showOutline: true,
  showFileList: true,
  showProgressBar: true,
  showStats: true,
  rememberScrollPosition: true,
  showFrontmatter: false,
  shortcuts: {
    toggleOutline: 'Ctrl+Shift+O',
    toggleSource: 'Ctrl+Shift+S',
    toggleDark: 'Ctrl+Shift+D',
  },
}
