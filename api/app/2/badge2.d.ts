import { Image, Font, Color } from '../../core/graphics'
import { Insets } from '../../core/geometry'
import { RelativeOutlinePath } from '../../core/outline-path'
import { EditorSettings } from '../../style/editor-style'
import { EditorTheme } from '../../style/editor-theme'
import { OutlineEditor } from '../outline-editor'
import { Row } from '../outline'
import { AttributeType } from './attribute2'

/**
 * Badges v2: value-aware glyphs rendered trailing a row's text.
 *
 * A style rule can *test* a value in its selector (`.@priority = 1`), but
 * it emits a static style — it can't render the value itself. A badge
 * fills that gap: it injects a trailing-flow decoration whose glyph is
 * computed from the row's live values. It selects rows with a `where` path
 * (same syntax as style rules), reads `inputs` off each match, and hands
 * them to `render`.
 *
 * Attribute integration:
 *
 * - The BUILT-IN CATCH-ALL badge renders any attribute no dedicated badge
 *   claims, TYPE-AWARELY through its registered definition: display labels
 *   come from the same native formatter as pickers and the palette
 *   ({@link BadgeEnvironment.formatAttribute}), so a `duration` shows
 *   "2h 30m", a `date` shows "Today", a `color` shows its swatch. A
 *   definition's `defaultBadge: false` opts its attribute out.
 * - Custom badges never reimplement value parsing or formatting — they
 *   receive raw wire strings and format through the environment
 *   ({@link BadgeEnvironment.formatAttribute} /
 *   {@link BadgeEnvironment.formatValue}).
 *
 * A badge is DECORATION ONLY. To make it interactive, give it
 * `menu: 'default'` — the built-in TYPE-AWARE attribute menu opens on
 * click — or a custom `onClick` handler, typically one that presents
 * `editor.showMenu` or `editor.showPicker` anchored to the badge. A badge
 * with neither is not clickable.
 */

/**
 * The presentation context passed to `render`, mirroring the style API's
 * `StyleContext` (minus per-row transients — a badge module can memoize at
 * module level instead). Everything here except the format methods is part
 * of the render's memo state: cached specs are flushed whenever any of it
 * changes, so `render` stays a pure function of `(values, env)`.
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

  /**
   * Format a wire value for display through the registered definition of
   * attribute `name` (type + facet: choice values show their names, a
   * rating knows its max) — the SAME native, locale-aware display layer
   * the palette, pickers, and catch-all badge use. Falls back to the raw
   * wire string when nothing better is known. Now-relative labels
   * ("Today", "Yesterday") are computed at `env.now` when ticking, else
   * at presentation time — set `tick` on badges displaying now-relative
   * types or the label can go stale.
   */
  formatAttribute(name: string, wire: string): string
  /**
   * Format a wire value as a bare {@link AttributeType} with default
   * facets — for values that aren't a registered attribute's (a summary
   * result, a computed input). Same formatter, same fallback and
   * now-relative caveats as {@link formatAttribute}.
   */
  formatValue(type: AttributeType, wire: string): string
}

/**
 * Badge geometry, proportional to the outline's base text size.
 *
 * Badges don't necessarily need to use these, but if they draw a rect (a
 * border, a tag) they should so every drawn badge in a row matches.
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
 * One image of a keyed multi-image render. The key identifies the
 * sub-badge everywhere: `onClick` receives it, and `showMenu`/`showPicker`
 * anchor to it via `{ badge, key }` (the catch-all attribute badges key by
 * attribute name).
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
  /** Re-render every `tick` WHOLE seconds (integer >= 1) with `env.now`
   * set; smaller values disable ticking. Required in practice for badges
   * whose display is now-relative (date labels, countdowns). */
  tick?: number
  /**
   * Render input values to the badge's glyph(s): a single `Image` (the
   * common case), an array of `KeyedImage` (a multi-image badge — one
   * glyph per key, displayed in array order), or `null` for no badge.
   * Values are raw wire strings — format them through
   * `env.formatAttribute` / `env.formatValue`, never by hand.
   */
  render: (values: Readonly<Record<string, string | undefined>>, env: BadgeEnvironment) => Image | KeyedImage[] | null
  /**
   * `'default'` opens the built-in TYPE-AWARE attribute menu when a badge
   * glyph is clicked. The target attribute is the clicked image's key (a
   * keyed multi-image render) or, unkeyed, the badge's own name; the menu
   * derives from the attribute's registered definition:
   *
   * - Filter / Filter = value rows, always.
   * - `flag` — On / Off radios (Off removes).
   * - `boolean` — Yes / No radios.
   * - `choice` — the choices as radios (plus "Value…" when `open`).
   * - every other type — "Value…", opening the attribute-bound picker
   *   (`showPicker` with `{ attribute }`), anchored to the glyph.
   * - Remove, always.
   *
   * A custom `onClick` wins when both are set; a badge with neither is
   * not clickable.
   */
  menu?: 'default'
  /**
   * Called when a badge glyph is clicked — `context.key` identifies the
   * clicked image of a keyed render. Typically presents a menu or picker
   * anchored to the glyph: `onClick: ({ editor, row, key }) =>
   * editor.showPicker(row, { attribute: key, anchor: { badge: '<name>',
   * key } })`. Wins over `menu: 'default'` when both are set.
   */
  onClick?: (context: BadgeContext) => void
}
