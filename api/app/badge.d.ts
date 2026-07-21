import { Image, Font, Color } from '../core/graphics'
import { Insets } from '../core/geometry'
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
 * data inline — a `@priority` badge, a `summary("openTasks")` aggregate, a live
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

/** Context passed to `onClick`: the clicked row and its editor. `key`
 * identifies the clicked image of a keyed multi-image render (absent for
 * single-image badges). */
export interface BadgeContext {
  readonly editor: OutlineEditor
  readonly row: Row
  readonly key?: string
}

/**
 * One image of a keyed multi-image render. The key identifies the sub-badge
 * everywhere: `onClick` receives it, and `showMenu` anchors to it via
 * `{ badge, key }` (the catch-all attribute badges key by attribute name).
 */
export interface KeyedImage {
  key: string
  image: Image
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
   *
   * The string `'*'` is the catch-all form: `values` becomes the row's
   * FULL attribute map (reserved names excluded) — pair it with a
   * match-any `where` (`.*`) and a keyed multi-image render.
   */
  inputs?: Record<string, string> | '*'
  /** Re-render every `tick` WHOLE seconds (integer >= 1) with `env.now` set; smaller values disable ticking */
  tick?: number
  /**
   * Render input values to the badge's glyph(s): a single `Image` (the
   * common case), an array of `KeyedImage` (a multi-image badge — one
   * glyph per key, displayed in array order), or `null` for no badge.
   */
  render: (values: Readonly<Record<string, string | undefined>>, env: BadgeEnvironment) => Image | KeyedImage[] | null
  /**
   * Called when a badge glyph is clicked — `context.key` identifies the
   * clicked image of a keyed render. Typically presents a menu:
   * `onClick: ({ editor, row, key }) => editor.showMenu(row, { items,
   * anchor: { badge: '<name>', key }, ... })`.
   */
  onClick?: (context: BadgeContext) => void
}
