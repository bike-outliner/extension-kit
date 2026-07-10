import { RelativeOutlinePath } from '../core/outline-path'

/**
 * Summaries: efficient subtree aggregates for outline paths.
 *
 * Outline paths efficiently read row values at each step, but there is no
 * efficient way to read an aggregate over a row's whole branch — for example,
 * the sum of every task estimate under the current row. Summaries fill that
 * gap. You declare the aggregate you want to read, and Bike maintains it for
 * you so that outline paths can read it back in O(1). In your outline paths,
 * use the `summary("name")` function to read the aggregate value.
 */

/** Config for a named subtree summary. Last registration for a name wins. */
export interface SummaryConfig {
  /**
   * Self-only relative path selecting contributing rows, e.g. `.task @done`.
   * Must be a pure function of the row: only self axes and pure per-row
   * functions are allowed; positional, sibling, structural, time, and custom
   * functions are rejected at registration.
   */
  where: RelativeOutlinePath
  /**
   * Numeric value expression per contributing row, e.g. `@estimate` (same
   * self-only rules). Defaults to `1`. Ignored by `count`; for sum/min/max a
   * missing or non-numeric value contributes nothing (not 0).
   */
  value?: string
  /** How contributions combine up the subtree. */
  reduce: 'count' | 'sum' | 'min' | 'max'
}
