import { SelfOnlyOutlinePath, SelfOnlyValuePath } from '../../core/outline-path'
import { AttributeType, MeasurementDimension } from './attribute2'

/**
 * Summaries v2: incremental & cached reductions over an outline axis,
 * readable as `summary("name")` in outline-path queries, style rules, and
 * badge `where`/`inputs`.
 *
 * A summary reduces in one direction (`axis`) — for example a row's
 * subtree (`descendant-or-self`, the default) to count total and completed
 * tasks in a branch and display progress in a badge.
 *
 * TYPED summaries: declare `type` (an {@link AttributeType}) and the
 * reduction understands the wire encoding — durations add, dates compare
 * chronologically — and the RESULT is emitted in that same canonical
 * encoding, so it composes with everything else that speaks wire values:
 * a badge formats it with `env.formatValue(type, …)`, queries compare it,
 * and it can even be written back into a row attribute of that type.
 */

/** How contributions combine over the selected axis. */
export type SummaryReduce =
  /** Number of contributing rows. Always a plain number — `type` is
   * irrelevant to the result. */
  | 'count'
  /** Sum of `value` over contributing rows. Typed: `number`;
   * `duration` (components add); `measurement` (converted within the
   * declared dimension, result in `unit`). */
  | 'sum'
  /**
   * Minimum / maximum of `value`. Typed: `number`, `measurement`, and
   * `rating` numerically; `date` and `time` chronologically; `duration`
   * by total length (the fixed 365-day-year / 30-day-month
   * approximations, matching the query engine). Untyped: numeric.
   */
  | 'min'
  | 'max'
  /** The `value` of the CLOSEST contributing row in axis order — any
   * type, reported verbatim. */
  | 'nearest'
  /**
   * The ordered list of contributing `value`s, joined with `separator`
   * (default `,` — the attribute LIST contract, so the result of a
   * list-safe type round-trips as a `list` attribute value).
   */
  | {
      type: 'list'
      separator?: string
    }

/** Config for a named summary. Last registration for a name wins. */
export interface SummaryConfig {
  /** Selects the contributing rows. See {@link SelfOnlyOutlinePath}. */
  where: SelfOnlyOutlinePath
  /** Each contributing row's value; defaults to the constant `1`. */
  value?: SelfOnlyValuePath
  /** How contributions combine over the selected axis. */
  reduce: SummaryReduce
  /**
   * The wire type of the contributing values (an {@link AttributeType}).
   * When set, each row's `value` is parsed per that type's encoding —
   * rows whose value doesn't parse contribute NOTHING (they don't poison
   * the reduction) — and the result is emitted canonically encoded.
   * Omitted, values reduce as plain numbers/strings (v1 behavior).
   * Registration rejects `type`s the chosen `reduce` can't combine
   * (`sum` of dates, `min` of colors).
   */
  type?: AttributeType
  /** `measurement` only: the dimension values convert within. */
  dimension?: MeasurementDimension
  /** `measurement` only: the unit the result is emitted in. Defaults to
   * the dimension's base unit. */
  unit?: string
  /** The axis of rows to reduce over relative to the reading row */
  axis?:
    | 'self'
    | 'parent'
    | 'child'
    | 'ancestor'
    | 'ancestor-or-self'
    | 'descendant'
    | 'descendant-or-self'
    | 'following-sibling'
    | 'preceding-sibling'
}
