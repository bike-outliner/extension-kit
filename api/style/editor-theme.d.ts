import { Color, Font, FontWeight } from '../core/graphics'
import { TextStyle, TextRunStyle } from './editor-style'

/**
 * Values from the active `.bktheme` file, read as `context.theme`, e.g.
 * `context.theme.rows.heading.apply(row.text)`.
 */
export interface EditorTheme {
  readonly colors: ColorTheme
  readonly rows: RowThemes
  readonly runs: RunThemes
}

/** Unspecified colors have defaults. */
export interface ColorTheme {
  // Core colors
  readonly text: Color
  readonly accent: Color
  readonly background: Color

  // Caret and selection
  readonly caret: Color
  readonly caretLine: Color
  readonly caretMessage: Color
  readonly textBackgroundSelected: Color
  readonly blockBackgroundSelected: Color
  readonly contentBackgroundSelectedUnemphasized: Color

  // Find matches
  readonly findMatch: Color
  readonly findMatchCurrent: Color

  // UI elements
  readonly handle: Color
  readonly handleUnloaded: Color
  readonly guideLine: Color
  readonly focusArrow: Color

  // Annotations
  readonly grammar: Color
  readonly spelling: Color
  readonly replacement: Color

  /** Custom theme color by name. */
  get(name: string): Color | undefined
}

export interface RowThemes {
  readonly body: TextContainerTheme
  readonly heading: TextContainerTheme
  readonly note: TextContainerTheme
  readonly blockquote: TextContainerTheme
  readonly codeblock: TextContainerTheme
  readonly task: TextContainerTheme
  readonly log: TextContainerTheme
  readonly orderedList: TextContainerTheme
  readonly unorderedList: TextContainerTheme
  readonly horizontalRule: TextContainerTheme
}

export interface RunThemes {
  readonly strong: TextContainerTheme
  readonly emphasis: TextContainerTheme
  readonly strikethrough: TextContainerTheme
  readonly code: TextContainerTheme
  readonly mark: TextContainerTheme
  readonly link: TextContainerTheme
}

export interface TextContainerTheme {
  readonly color?: Color
  readonly backgroundColor?: Color
  readonly fontFamily?: string
  /** Font size multiplier, e.g. 1.2. */
  readonly fontAdjust?: number
  readonly fontWeight?: FontWeight
  readonly fontTraits?: FontTrait[]
  readonly underline?: TextLineTheme
  readonly strikethrough?: TextLineTheme

  /** Sets the defined properties on `style`; undefined ones are left unchanged. */
  apply(style: TextStyle | TextRunStyle): void
}

export interface TextLineTheme {
  readonly color?: Color
  readonly single?: boolean
  readonly thick?: boolean
  readonly double?: boolean
  readonly patternDot?: boolean
  readonly patternDash?: boolean
  readonly patternDashDot?: boolean
  readonly patternDashDotDot?: boolean
  readonly byWord?: boolean
}

export type FontTrait = 'italic' | 'bold' | 'expanded' | 'condensed' | 'monospace'
