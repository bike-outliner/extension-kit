import { RelativeOutlinePath } from '../core/outline-path'

/**
 * Summaries: efficient subtree aggregates for outline paths to read.
 *
 * Outline paths efficiently read row values at each step, but there is no
 * efficient way to read an aggregate over a row's whole branch. Summaries fill
 * that gap. You declare the aggregate you want to read, and Bike maintains it
 * for you so that outline paths can read it back in O(1). In your outline
 * paths, use the `summary("name")` function to read the aggregate value.
 */

/** Config for a named subtree summary. Last registration for a name wins. */
export interface SummaryConfig {
  /** Self-only relative path selecting contributing rows, e.g. `.task @done`. */
  where: RelativeOutlinePath
  /** Self-only numeric value expression per contributing row, e.g. `@estimate`. */
  value?: string
  /** How contributions combine up the subtree. */
  reduce: 'count' | 'sum' | 'min' | 'max'
}
