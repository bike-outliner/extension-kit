import { Image, Font, Color } from '../core/graphics'
import { RelativeOutlinePath } from '../core/outline-path'

/**
 * Badges: value-aware glyphs rendered trailing a row's text.
 *
 * A style rule can *test* a value in its selector (`.@priority = 1`), but it
 * emits a static style — it can't render the value itself (the number `3`, a
 * due date, a percent complete), only switch styling on or off per case. A
 * badge fills that gap: it runs as an extra pass after the rules and injects a
 * trailing-flow decoration whose glyph is computed from the row's live values.
 *
 * It selects rows with a `where` path (same syntax as style rules), reads
 * `inputs` off each match, and hands them to `render`. That's how you surface
 * data inline — a `@priority` chip, a `summary("openTasks")` rollup, a live
 * `@due` countdown (see `tick`), a progress bar. A badge can also be clicked to
 * open a small card of actions, so it doubles as a lightweight inline control.
 */

/** The row's inherited text presentation, passed to `render`. */
export interface BadgeEnvironment {
  /** The row's inherited text font. */
  readonly font: Font
  /** The row's inherited text color. */
  readonly color: Color
  /** Epoch seconds; present only for `tick: true` badges. */
  readonly now?: number
}

/** What `render` returns: a glyph plus optional click behavior. */
export interface BadgeSpec {
  /** The rendered glyph, e.g. `Image.fromSymbol(...)` or `Image.fromText(...)`. */
  image: Image
  /** Choices shown in a card on click. When present, wins over `commandName`. */
  actions?: BadgeAction[]
  /** Command dispatched on click (the clicked row is its `selection`). */
  commandName?: string
}

/**
 * A choice in a badge's click card. `set`/`remove` target the badge's own
 * attribute, applied in one undo step.
 */
export type BadgeAction =
  | { title: string; role: 'set'; value: string; isCurrent?: boolean }
  | { title: string; role: 'remove' }
  | { role: 'separator' }

/**
 * A value-aware badge rendered trailing a row's text. The last registration
 * for a name wins; same-row badges display alphabetically by name.
 */
export interface BadgeConfig {
  /**
   * Relative outline path selecting the rows that show this badge (same
   * selector syntax as style rules), e.g. `.@priority`, `.heading`,
   * `.summary("tasks") > 0`. Re-evaluated per visible row every style pass,
   * so unbounded traversals (`//`, following/preceding) are rejected — select
   * on a `summary(...)` instead.
   */
  where: RelativeOutlinePath
  /**
   * Map of result-name → outline-path value expression evaluated on the row —
   * `@priority`, `summary("doneTasks")`. The evaluated values are passed to
   * `render` and memoize it: it re-runs only when one changes. Selection is by
   * `where` alone. Defaults to `{ [name]: '@' + name }` (so the badge name
   * must then be a valid attribute token).
   */
  inputs?: Record<string, string>
  /**
   * Re-render every second with `env.now` set — for clocks/countdowns.
   * Ticking badges aren't memoized, so keep `render` cheap.
   */
  tick?: boolean
  /**
   * Turns the evaluated `values` (absent inputs are `undefined`) into a
   * `BadgeSpec`, or `null` for no badge. Invoked mid-styling — must be pure.
   */
  render: (values: Readonly<Record<string, string | undefined>>, env: BadgeEnvironment) => BadgeSpec | null
}
