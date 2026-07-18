import { SelfOnlyOutlinePath, SelfOnlyValuePath } from '../core/outline-path'

/**
 * Summaries: efficient reductions over an outline branch for outline paths to read.
 *
 * Outline paths efficiently read row values at each step, but there is no
 * efficient way to read a value reduced over a row's whole branch. Summaries fill
 * that gap. You declare the reduction you want, and Bike maintains it incrementally
 * so outline paths can read it back in O(1) via the `summary("name")` function.
 *
 * A summary reduces in one direction (`axis`), named for the matching outline-path
 * axis: DOWN over a row's subtree (`descendant-or-self`, the default) or UP over its
 * ancestor chain (`ancestor-or-self`). Every reduce works on both axes.
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
  /**
   * The `value` of the CLOSEST contributing row: the nearest ancestor-or-self
   * (`ancestor-or-self`) or the first descendant-or-self in document order
   * (`descendant-or-self`). Resolved at read, so `value` may be a string or a number.
   */
  | 'nearest'
  /**
   * The ordered list of contributing `value`s, joined by `separator` at read:
   * root→self breadcrumb (`ancestor-or-self`) or subtree document order
   * (`descendant-or-self`).
   */
  | {
      type: 'list'
      /** Delimiter joining the values at read. Defaults to `'/'`. */
      separator?: string
    }

/** Config for a named summary. Last registration for a name wins. */
export interface SummaryConfig {
  /** Selects the contributing rows. See {@link SelfOnlyOutlinePath}. */
  where: SelfOnlyOutlinePath
  /**
   * Each contributing row's value; defaults to the constant `1`. See
   * {@link SelfOnlyValuePath}. `sum`/`min`/`max` need a numeric result;
   * `nearest`/`list` resolve it at read, so it may be a string (row attributes are
   * strings, so a numeric `nearest` needs e.g. `number(@estimate)`).
   */
  value?: SelfOnlyValuePath
  /** How contributions combine over the selected axis. */
  reduce: SummaryReduce
  /**
   * The set of rows to reduce over, named for the matching outline-path axis
   * relative to the reading row. Defaults to `descendant-or-self` (the subtree).
   * `descendant-or-self` and `ancestor-or-self` are incrementally cached (O(1)
   * reads); the rest resolve at read with a bounded walk. (`following`,
   * `preceding`, and `run` are not supported.)
   */
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
