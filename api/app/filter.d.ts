import { OutlinePath } from '../core/outline-path'

/**
 * Filters: labeled outline filter queries contributed by extensions.
 */

/** Config for a labeled filter query. Last registration for a name wins. */
export interface FilterConfig {
  /** The label shown in the completions list and the collapsed filter field. */
  label: string
  /** The outline filter applied when the user picks this filter. */
  query: OutlinePath
}
