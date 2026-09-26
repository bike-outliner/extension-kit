import { Image, Font, Color } from '../core/graphics'
import { Insets } from '../core/geometry'
import { RelativeOutlinePath, RelativeValuePath } from '../core/outline-path'
import { EditorSettings } from '../style/editor-style'
import { EditorTheme } from '../style/editor-theme'
import { OutlineEditor } from './outline-editor'
import { Row } from './outline'
import { AttributeType } from './attribute'

/** Passed to `render`. */
export interface BadgeEnvironment {
  /** Base text font (the stylesheet's `viewport.font`). */
  readonly font: Font
  /** Base text color (`theme.colors.text`). */
  readonly color: Color
  /** Epoch seconds; set only when `tick` is. */
  readonly now?: number
  readonly os: 'macOS' | 'iOS'
  readonly settings: EditorSettings
  /** Resolved for the current appearance. */
  readonly theme: EditorTheme
  /** Base text size relative to 14pt. */
  readonly uiScale: number
  readonly badgeMetrics: BadgeMetrics
  /** Formats per the attribute's definition. */
  formatAttribute(name: string, wire: string): string
  /** Formats as `type` with default facets. */
  formatValue(type: AttributeType, wire: string): string
}

/** Standard geometry for badges that draw their own rect, scaled to the base text size. */
export interface BadgeMetrics {
  /** Rect height. */
  readonly side: number
  readonly cornerRadius: number
  readonly strokeWidth: number
  /** Label point size, a step below the base font. */
  readonly fontSize: number
  /** Around `fontSize` text to reach `side`. */
  readonly padding: Insets
}

/** Passed to `onClick`. `key` is the clicked image of a keyed render. */
export interface BadgeContext {
  readonly editor: OutlineEditor
  readonly row: Row
  readonly key?: string
}

/** Anchors as `{ badge, key }`. */
export interface KeyedImage {
  key: string
  image: Image
}

/**
 * Rendered after a row's text. Attributes without a dedicated badge use the
 * built-in catch-all badge unless `defaultBadge: false`.
 */
export interface BadgeConfig {
  /** Re-render interval in seconds; sets `env.now`. */
  tick?: number
  /** Rows that show this badge. */
  where: RelativeOutlinePath
  /** Values passed to `render`. */
  inputs: Record<string, RelativeValuePath> | 'rowAttributes'
  /** `null` shows no badge. */
  render: (values: Readonly<Record<string, string | undefined>>, env: BadgeEnvironment) => Image | KeyedImage[] | null
  /** Without it the badge is inert. */
  onClick?: (context: BadgeContext) => void
}
