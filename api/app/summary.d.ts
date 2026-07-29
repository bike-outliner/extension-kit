import { SelfOnlyOutlinePath, SelfOnlyValuePath } from '../core/outline-path'
import { AttributeType } from './attribute'

/**
 * Incremental, cached reductions over an outline axis.
 *
 * Registered with `bike.summary(name, config)` and read as `summary("name")` in
 * queries. `where` selects contributing rows, `value` is each one's
 * contribution, `reduce` combines them over `axis`.
 *
 * A typed summary declares `type` and reduces in that wire encoding, emitting
 * its result in the same encoding — so badges, queries, and row attributes can
 * all read it. The type also decides which reduces are meaningful: registration
 * throws for a reduce the type has no order or addition for (summing dates,
 * ordering choices).
 *
 * `count` is always a plain number — `type` is irrelevant to it.
 */

/** How contributions combine over the selected axis. */
export type SummaryReduce =
  /** Number of contributing rows. Always a plain number. */
  | 'count'
  | 'sum'
  /** Minimum / maximum in the type's own order. */
  | 'min'
  | 'max'
  /** The closest contributing row's value in axis order. */
  | 'nearest'
  /** The contributing values in axis order, joined by `separator` (default `,`). */
  | {
      type: 'list'
      separator?: string
    }

/** Config for a named summary. Last registration for a name wins. */
export interface SummaryConfig {
  /** Selects the contributing rows. */
  where: SelfOnlyOutlinePath
  /** Each contributing row's value. Defaults to the constant `1`. */
  value?: SelfOnlyValuePath
  /** How to combine the contributions. Defaults to `count`. */
  reduce: SummaryReduce
  /** Reduce and report in this wire encoding. Omitted, values reduce as numbers. */
  type?: AttributeType
  /** The axis of rows to reduce over, relative to the reading row. Default `descendant-or-self`. */
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
