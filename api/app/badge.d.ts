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
 * { items, anchor: '<badge>' })`. Because the menu is built imperatively
 * from the row at click time, the same builder function also serves
 * commands on rows the badge doesn't decorate (a set-due menu on a row
 * with no due yet).
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
  /**
   * The outline's BASE text font (the stylesheet's `viewport.font`), not the
   * row's — the same badge renders identically on a bold heading and a body
   * row.
   */
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
  /**
   * The editor's UI scale: the outline's base text size relative to the 14pt
   * baseline the UI's proportions are designed against. The same scale the
   * stylesheet's chrome (caret, guides, indent) uses, so multiplying a fixed
   * size by it keeps a badge in step with the reader's font.
   */
  readonly uiScale: number
  /**
   * Shared geometry for a badge that draws its own rect (a border, a tag),
   * sized to this environment's base text. Use it instead of hand-picked
   * numbers so every drawn badge in a row matches. Together `fontSize` and
   * `padding` yield a tag exactly `side` tall with its label centered:
   *
   *   const bm = env.badgeMetrics
   *   Image.fromText(new Text(label, env.font.withPointSize(bm.fontSize), color))
   *     .withBackground({
   *       stroke: color.alphaSet(0.3),
   *       strokeWidth: bm.strokeWidth,
   *       cornerRadius: bm.cornerRadius,
   *       padding: bm.padding,
   *     })
   */
  readonly badgeMetrics: BadgeMetrics
}

/**
 * Badge geometry, proportional to the outline's base text size — so badges
 * track the reader's font.
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
  /**
   * Padding around a `fontSize` text image that makes the tag exactly
   * `side` tall with its label's cap-height band centered (descenders hang
   * below, as they should), plus proportional side breathing room.
   */
  readonly padding: Insets
}

/** Context passed to `onClick`: the clicked row and its editor. */
export interface BadgeContext {
  readonly editor: OutlineEditor
  readonly row: Row
}

/** A value-aware badge rendered trailing a row's text. */
export interface BadgeConfig {
  /** Relative outline path selecting the rows that show this badge (`.@priority`) */
  where: RelativeOutlinePath
  /** Map of result-name → outline-path value expression evaluated on the row */
  inputs?: Record<string, string>
  /**
   * Re-render every `tick` seconds with `env.now` set (a whole number of
   * seconds; omit or `0` for no ticking). Use the coarsest interval that
   * still looks live — `1` for a running clock, `60` for a due-date label
   * that only needs to roll over about once a minute. The editor only runs
   * the clock while a ticking badge is actually on screen, at the smallest
   * interval among the visible ones.
   */
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
   * anchor: '<badge>' , ... })`. A badge with no `onClick` is not
   * clickable.
   */
  onClick?: (context: BadgeContext) => void
}
