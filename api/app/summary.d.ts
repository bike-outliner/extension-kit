import { SelfOnlyOutlinePath, SelfOnlyValuePath } from '../core/outline-path'

/**
 * Summaries: incremental & cached reductions over an outline axis.
 *
 * A summary reduces in one direction (`axis`). For example reduce a row's
 * subtree (`descendant-or-self`, the default) and then it's efficient to read
 * that value later in outline path queries. This example is used to count total
 * and completed tasks in a branch and then display the progress in a badge.
 */

/** How contributions combine over the selected axis. */
export type SummaryReduce =
  /** Number of contributing rows. */
  | 'count'
  /** Sum of `value` over contributing rows. */
  | 'sum'
  /** Minimum / maximum of `value` (numeric). */
  | 'min'
  | 'max'
  /** The `value` of the CLOSEST contributing row in axis order (numeric or string). */
  | 'nearest'
  /** The ordered list of contributing `value`s */
  | {
      type: 'list'
      separator?: string // defaults to `/`
    }

/** Config for a named summary. Last registration for a name wins. */
export interface SummaryConfig {
  /** Selects the contributing rows. See {@link SelfOnlyOutlinePath}. */
  where: SelfOnlyOutlinePath
  /** Each contributing row's value; defaults to the constant `1`. */
  value?: SelfOnlyValuePath
  /** How contributions combine over the selected axis. */
  reduce: SummaryReduce
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
