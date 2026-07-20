import { Image, Font, Color } from '../core/graphics'
import { Size, Insets } from '../core/geometry'
import { RelativeOutlinePath } from '../core/outline-path'
import { EditorSettings } from '../style/editor-style'
import { EditorTheme } from '../style/editor-theme'
import { OutlineEditor } from './outline-editor'
import { Row } from './outline'

/**
 * Badges: value-aware glyphs rendered trailing a row's text.
 *
 * A style rule can *test* a value in its selector (`.@priority = 1`), but it
 * emits a static style — it can't render the value itself (the number `3`, a
 * due date, a percent complete), only switch styling on or off per case. A
 * badge fills that gap: it injects a trailing-flow decoration whose glyph is
 * computed from the row's live values.
 *
 * It selects rows with a `where` path (same syntax as style rules), reads
 * `inputs` off each match, and hands them to `render`. That's how you surface
 * data inline — a `@priority` chip, a `summary("openTasks")` aggregate, a live
 * `@due` countdown (see `tick`), a progress bar.
 *
 * A badge is DECORATION ONLY. To make it interactive, give it an `onClick`
 * handler — typically one that presents a menu with `editor.showMenu(row,
 * { items, anchor: '<badge>' })`.
 */

/**
 * The presentation context passed to `render`, mirroring the style API's
 * `StyleContext` (minus per-row transients like `consecutivePath` and the
 * style-context `userCache` — a badge module can memoize at module level
 * instead). Everything here is part of the render's memo state: cached specs
 * are flushed whenever any of it changes, so `render` stays a pure function
 * of `(values, env)`.
 */
export interface BadgeEnvironment {
  /** The outline's BASE text font (the stylesheet's `viewport.font`) */
  readonly font: Font
  /** The row's inherited text color, so the glyph tints with its text. */
  readonly color: Color
  /** Epoch seconds; present only for ticking badges (`tick` set). */
  readonly now?: number
  /** Host platform the editor is running on */
  readonly os: 'macOS' | 'iOS'
  /** True when editor has keyboard focus */
  readonly isKey: boolean
  /** True when editor is typing (mouse hidden) */
  readonly isTyping: boolean
  /** True when editor is filtering */
  readonly isFiltering: boolean
  /** True when in dark mode */
  readonly isDarkMode: boolean
  /** True when in full screen mode */
  readonly isFullScreen: boolean
  /** True when in full window mode (window chrome hidden, document fills the window) */
  readonly isFullWindow: boolean
  /** True when dragging selection */
  readonly isDragSource: boolean
  /** Size of the editor's viewport */
  readonly viewportSize: Size
  /** Insets of overlapping chrome (e.g. floating toolbar/status bar) on the viewport. Subtract from `viewportSize` to get the visible content area. */
  readonly viewportContentInsets: Insets
  /** Editor Settings */
  readonly settings: EditorSettings
  /** Editor Theme, resolved for the current appearance (the dark theme in dark mode) */
  readonly theme: EditorTheme
  /** The editor's UI scale: the outline's base text size relative to the 14pt baseline */
  readonly uiScale: number
  /** Shared geometry for a badge that draws its own rect (a border, a tag) */
  readonly badgeMetrics: BadgeMetrics
}

/**
 * Badge geometry, proportional to the outline's base text size.
 *
 * Badges don't nessarily need to use these, but if they draw a rect (a border,
 * a tag) they should so every drawn badge in a row matches.
 */
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

/** Context passed to `onClick`: the clicked row and its editor. */
export interface BadgeContext {
  readonly editor: OutlineEditor
  readonly row: Row
}

/** A value-aware badge rendered trailing a row's text. */
export interface BadgeConfig {
  /**
   * Relative outline path selecting the rows that show this badge
   * (`.@priority`). Self-only tests only — unbounded traversals like
   * `.//task` throw at registration (they'd walk every visible row's
   * subtree per style pass). Select on a `summary(...)` instead.
   */
  where: RelativeOutlinePath
  /**
   * Map of result-name → outline-path value expression evaluated on the
   * row. Omitted, it defaults to `{ <name>: '@<name>' }` — so the badge's
   * name must be a valid attribute token (registration throws otherwise),
   * and `render` receives `values.<name>` without declaring it.
   */
  inputs?: Record<string, string>
  /** Re-render every `tick` WHOLE seconds (integer >= 1) with `env.now` set; smaller values disable ticking */
  tick?: number
  /**
   * Render input values to the badge's glyph, e.g. `Image.fromSymbol(...)`
   * or `Image.fromText(...)`; return `null` for no badge. Must be a pure
   * function.
   */
  render: (values: Readonly<Record<string, string | undefined>>, env: BadgeEnvironment) => Image | null
  /**
   * Called when the badge's glyph is clicked. Typically presents a menu:
   * `onClick: ({ editor, row }) => editor.showMenu(row, { items,
   * anchor: '<badge>' , ... })`.
   */
  onClick?: (context: BadgeContext) => void
}
