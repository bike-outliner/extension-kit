import { OutlinePath } from '../core/outline-path'

/**
 * Filters: labeled outline filter queries contributed by extensions.
 *
 * Registered filters appear in the outline filter field's autocomplete list.
 * While the field is empty they list after the document's saved sidebar
 * queries (below a divider), alphabetically by label; once the user types, all
 * queries rank together by fuzzy-match score. Picking one applies `query` as
 * the outline filter, and the collapsed filter field shows `label` (a saved
 * sidebar query's title wins over an extension label for the same query).
 */

/** Config for a labeled filter query. Last registration for a name wins. */
export interface FilterConfig {
  /** The label shown in the completions list and the collapsed filter field. */
  label: string
  /**
   * The outline filter applied when the user picks this filter. Parsed as an
   * outline path; text that doesn't parse filters as contains-text (same as
   * typing it into the filter field).
   */
  query: OutlinePath
}
