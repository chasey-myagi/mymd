import type { MymdTheme } from '../../../types'
import { githubLight, githubDark } from './github'
import { typoraLight, typoraDark } from './typora'
import { academicLight, academicDark } from './academic'
import { readerLight, readerDark } from './reader'
import { minimalLight, minimalDark } from './minimal'
import { handwritingLight, handwritingDark } from './handwriting'
import { cyberpunkLight, cyberpunkDark } from './cyberpunk'
import { retroLight, retroDark } from './retro'

export interface ThemePair {
  light: MymdTheme
  dark: MymdTheme
}

export const THEMES: Record<string, ThemePair> = {
  github: { light: githubLight, dark: githubDark },
  typora: { light: typoraLight, dark: typoraDark },
  academic: { light: academicLight, dark: academicDark },
  reader: { light: readerLight, dark: readerDark },
  minimal: { light: minimalLight, dark: minimalDark },
  handwriting: { light: handwritingLight, dark: handwritingDark },
  cyberpunk: { light: cyberpunkLight, dark: cyberpunkDark },
  retro: { light: retroLight, dark: retroDark },
}

export function getTheme(name: string, mode: 'light' | 'dark'): MymdTheme {
  const pair = THEMES[name] ?? THEMES.github
  return pair[mode]
}

export function getThemeNames(): string[] {
  return Object.keys(THEMES)
}
