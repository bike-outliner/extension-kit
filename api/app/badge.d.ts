import { Image, Font, Color } from '../core/graphics'
import { Insets } from '../core/geometry'
import { RelativeOutlinePath, RelativeValuePath } from '../core/outline-path'
import { EditorSettings } from '../style/editor-style'
import { EditorTheme } from '../style/editor-theme'
import { OutlineEditor } from './outline-editor'
import { Row } from './outline'
import { AttributeType } from './attribute'

/**
 * Value-aware glyphs rendered trailing a row's text.
 *
 * Badges are registered with `bike.badge(name, config)`. Attributes with no
 * dedicated badge claims are rendered by the built-in catch-all badge, which a
 * definition's `defaultBadge: false` opts out of.
 */

/** The context passed to `render`. */
export interface BadgeEnvironment {
  /** The outline's BASE text font (the stylesheet's `viewport.font`) */
  readonly font: Font
  /** The outline's BASE text color (same as `theme.colors.text`) */
  readonly color: Color
  /** Epoch seconds; present only for ticking badges (`tick` set). */
  readonly now?: number
  /** Host platform the editor is running on */
  readonly os: 'macOS' | 'iOS'
  /** Editor Settings */
  readonly settings: EditorSettings
  /** Editor Theme, resolved for the current appearance (the dark theme in dark mode) */
  readonly theme: EditorTheme
  /** The editor's UI scale: the outline's base text size relative to the 14pt baseline */
  readonly uiScale: number
  /** Shared geometry for a badge that draws its own rect (a border, a tag) */
  readonly badgeMetrics: BadgeMetrics
  /** Format a wire value through attribute `name`'s registered definition. */
  formatAttribute(name: string, wire: string): string
  /** Format a wire value as a bare type with default facets. */
  formatValue(type: AttributeType, wire: string): string
}

/** Standard badge geometry, proportional to the outline's base text size. */
export interface BadgeMetrics {
  /** The badge rect's height. */
  readonly side: number
  /** Corner radius for the badge rect's border. */
  readonly cornerRadius: number
  /** Line width for the badge rect's border. */
  readonly strokeWidth: number
  /** Point size for a tag's label text (a step down from the base font). */
  readonly fontSize: number
  /** Padding around a `fontSize` to achieve the badge rect's `side` height. */
  readonly padding: Insets
}

/** Context passed to `onClick`. `key` identifies the clicked image of a keyed badge render. */
export interface BadgeContext {
  readonly editor: OutlineEditor
  readonly row: Row
  readonly key?: string
}

/** One image of a keyed multi-image render. Anchors as `{ badge, key }`. */
export interface KeyedImage {
  key: string
  image: Image
}

/** A value-aware badge rendered trailing a row's text. */
export interface BadgeConfig {
  /** Re-render every `tick` seconds with `env.now` set. */
  tick?: number
  /** Selects the rows that show this badge. */
  where: RelativeOutlinePath
  /** What `render` reads off the row */
  inputs: Record<string, RelativeValuePath> | 'rowAttributes'
  /** Render the input values to the badge's glyph(s), or `null` for no badge. */
  render: (values: Readonly<Record<string, string | undefined>>, env: BadgeEnvironment) => Image | KeyedImage[] | null
  /** Called when a badge glyph is clicked. Without one the glyph is inert. */
  onClick?: (context: BadgeContext) => void
}
