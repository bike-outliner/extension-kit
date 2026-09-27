import { SelfOnlyOutlinePath, SelfOnlyValuePath } from '../core/outline-path'
import { AttributeType } from './attribute'

/**
 * Incremental, cached reductions over an outline axis.
 *
 * With `type`, values reduce and emit in that wire encoding; registration
 * throws for a reduce the type can't order or add (summing dates, ordering
 * choices). `count` is always a plain number.
 */
export type SummaryReduce =
  | 'count'
  | 'sum'
  /** In the type's own order. */
  | 'min'
  | 'max'
  /** The closest contributing row's value in axis order. */
  | 'nearest'
  /** Values in axis order joined by `separator` (default `,`). */
  | {
      type: 'list'
      separator?: string
    }

/** Last registration for a name wins. */
export interface SummaryConfig {
  /** Selects contributing rows. */
  where: SelfOnlyOutlinePath
  /** Each contributing row's value. Defaults to the constant `1`. */
  value?: SelfOnlyValuePath
  reduce: SummaryReduce
  /** Omitted, values reduce as numbers. */
  type?: AttributeType
  /** Relative to the reading row. Default `descendant-or-self`. */
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
