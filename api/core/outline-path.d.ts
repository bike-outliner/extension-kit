import { Row, TextAttributeName } from '../app/outline'

export type OutlinePath = string

/** Starts with `.`. */
export type RelativeOutlinePath = string

/** Starts with `/`. */
export type AbsoluteOutlinePath = string

/**
 * Relative path testing only the row's own type, attributes, and text, e.g.
 * `.task @done`. No axes to other rows and no position- or time-dependent
 * functions; others are rejected at registration.
 */
export type SelfOnlyOutlinePath = RelativeOutlinePath

/**
 * Value expression over the row only, e.g. `number(@estimate)` or `1`. Same
 * restrictions as {@link SelfOnlyOutlinePath}.
 */
export type SelfOnlyValuePath = OutlinePath

/**
 * Value expression relative to the row, e.g. `summary("todo")` or `@a + @b`.
 * Bounded steps (parent, child, ancestor, sibling) are allowed; each consumer
 * validates at registration.
 */
export type RelativeValuePath = OutlinePath

/** Returned by paths on the `run` axis. */
export interface RowRun {
  readonly row: Row
  /** Offset in the row's text. */
  readonly runStart: number
  readonly runString: string
  readonly runAttributes: Record<TextAttributeName, string>
}

export type OutlinePathValue =
  | { type: 'elements'; value: (Row | RowRun)[] }
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'null'; value: undefined }
