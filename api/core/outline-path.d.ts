import { Row, TextAttributeName } from '../app/outline'

/** String following OutlinePath syntax */
export type OutlinePath = string

/** String following relative OutlinePath syntax (starts with .) */
export type RelativeOutlinePath = string

/** String following absolute OutlinePath syntax (starts with /) */
export type AbsoluteOutlinePath = string

/**
 * A relative OutlinePath (starts with `.`) that matches on the ROW ITSELF only —
 * "self-only". It may test the row's own type, attributes, and text
 * (e.g. `.task @done`, `.@priority > 2`), but must NOT reach other rows: no
 * parent/child/ancestor/descendant/sibling axes, and no position- or time-
 * dependent functions. This keeps a match a pure function of the row, which is
 * what lets Bike maintain derived state (such as summaries) incrementally and
 * correctly — a row's match can only change when that row changes. Paths that
 * traverse or depend on context are rejected when the summary is registered.
 */
export type SelfOnlyOutlinePath = RelativeOutlinePath

/**
 * A self-only OutlinePath VALUE expression: it computes one value from the ROW
 * ITSELF (e.g. `@estimate`, `number(@estimate)`, `@a + @b`, `date(@due)`, or a
 * literal like `1`). Subject to the same self-only restriction as
 * {@link SelfOnlyOutlinePath} — no traversal, no position/time — so the value is
 * a pure function of the row. The produced type depends on the expression
 * (number, string, boolean, …).
 */
export type SelfOnlyValuePath = OutlinePath

/**
 * An OutlinePath VALUE expression: it computes one value from the row
 * (`@estimate`, `summary("todo")`, `@a + @b`, or a literal like `1`). The
 * produced type depends on the expression (number, string, boolean, …).
 *
 * Relative, but not restricted to the row itself — bounded steps (parent,
 * child, ancestor, sibling) are allowed. The consumer declares which
 * traversals it rejects at registration; see {@link SelfOnlyValuePath} for the
 * stricter form summaries require.
 */
export type RelativeValuePath = OutlinePath

/** RowRuns are returned by OutlinePaths that query the `run` axis. */
export interface RowRun {
  /** Row that contains this run. */
  readonly row: Row
  /** Start index of this run in row's text. */
  readonly runStart: number
  /** Substring contained by this run. */
  readonly runString: string
  /** Run's text attributes. */
  readonly runAttributes: Record<TextAttributeName, string>
}

/**
 * Result value of an OutlinePath query.
 *
 * Most outline paths useful in Bike return type "elements" with a list of
 * rows. See user guide for more information on OutlinePath syntax.
 */
export type OutlinePathValue =
  | { type: 'elements'; value: (Row | RowRun)[] }
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'null'; value: undefined }
