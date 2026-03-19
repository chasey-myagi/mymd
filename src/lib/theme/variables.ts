export interface ThemeVariables {
  // Colors
  '--mymd-bg': string
  '--mymd-text': string
  '--mymd-text-secondary': string
  '--mymd-heading': string
  '--mymd-link': string
  '--mymd-link-hover': string
  '--mymd-border': string
  '--mymd-code-bg': string
  '--mymd-code-text': string
  '--mymd-blockquote-bg': string
  '--mymd-blockquote-border': string
  '--mymd-table-border': string
  '--mymd-table-stripe': string
  '--mymd-mark-bg': string
  '--mymd-selection-bg': string

  // Sidebar
  '--mymd-sidebar-bg': string
  '--mymd-sidebar-text': string
  '--mymd-sidebar-active': string
  '--mymd-sidebar-hover': string

  // Toolbar
  '--mymd-toolbar-bg': string
  '--mymd-toolbar-text': string
  '--mymd-toolbar-border': string

  // Shadows
  '--mymd-shadow-sm': string
  '--mymd-shadow-md': string

  // Radius
  '--mymd-radius-sm': string
  '--mymd-radius-md': string

  // Spacing
  '--mymd-content-padding': string

  // Alert variants
  '--mymd-alert-note-bg': string
  '--mymd-alert-note-border': string
  '--mymd-alert-tip-bg': string
  '--mymd-alert-tip-border': string
  '--mymd-alert-warning-bg': string
  '--mymd-alert-warning-border': string
  '--mymd-alert-danger-bg': string
  '--mymd-alert-danger-border': string
}

export const VARIABLE_METADATA: Record<keyof ThemeVariables, { label: string; type: 'color' | 'size' | 'shadow' }> = {
  '--mymd-bg': { label: 'Background', type: 'color' },
  '--mymd-text': { label: 'Text Color', type: 'color' },
  '--mymd-text-secondary': { label: 'Secondary Text', type: 'color' },
  '--mymd-heading': { label: 'Heading Color', type: 'color' },
  '--mymd-link': { label: 'Link Color', type: 'color' },
  '--mymd-link-hover': { label: 'Link Hover', type: 'color' },
  '--mymd-border': { label: 'Border Color', type: 'color' },
  '--mymd-code-bg': { label: 'Code Background', type: 'color' },
  '--mymd-code-text': { label: 'Code Text', type: 'color' },
  '--mymd-blockquote-bg': { label: 'Blockquote Background', type: 'color' },
  '--mymd-blockquote-border': { label: 'Blockquote Border', type: 'color' },
  '--mymd-table-border': { label: 'Table Border', type: 'color' },
  '--mymd-table-stripe': { label: 'Table Stripe', type: 'color' },
  '--mymd-mark-bg': { label: 'Highlight Background', type: 'color' },
  '--mymd-selection-bg': { label: 'Selection Background', type: 'color' },
  '--mymd-sidebar-bg': { label: 'Sidebar Background', type: 'color' },
  '--mymd-sidebar-text': { label: 'Sidebar Text', type: 'color' },
  '--mymd-sidebar-active': { label: 'Sidebar Active', type: 'color' },
  '--mymd-sidebar-hover': { label: 'Sidebar Hover', type: 'color' },
  '--mymd-toolbar-bg': { label: 'Toolbar Background', type: 'color' },
  '--mymd-toolbar-text': { label: 'Toolbar Text', type: 'color' },
  '--mymd-toolbar-border': { label: 'Toolbar Border', type: 'color' },
  '--mymd-shadow-sm': { label: 'Small Shadow', type: 'shadow' },
  '--mymd-shadow-md': { label: 'Medium Shadow', type: 'shadow' },
  '--mymd-radius-sm': { label: 'Small Radius', type: 'size' },
  '--mymd-radius-md': { label: 'Medium Radius', type: 'size' },
  '--mymd-content-padding': { label: 'Content Padding', type: 'size' },
  '--mymd-alert-note-bg': { label: 'Alert Note Background', type: 'color' },
  '--mymd-alert-note-border': { label: 'Alert Note Border', type: 'color' },
  '--mymd-alert-tip-bg': { label: 'Alert Tip Background', type: 'color' },
  '--mymd-alert-tip-border': { label: 'Alert Tip Border', type: 'color' },
  '--mymd-alert-warning-bg': { label: 'Alert Warning Background', type: 'color' },
  '--mymd-alert-warning-border': { label: 'Alert Warning Border', type: 'color' },
  '--mymd-alert-danger-bg': { label: 'Alert Danger Background', type: 'color' },
  '--mymd-alert-danger-border': { label: 'Alert Danger Border', type: 'color' },
}
