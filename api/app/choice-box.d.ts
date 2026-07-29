import { SFSymbolName } from '../core/bike-globals'

/**
 * Sources, items, and results for `bike.showChoiceBox` — the fuzzy-filtering
 * picker. Demonstrated by kitchensink.bkext's `kitchensink:choice-box-demo`.
 */

/** An item to display in a choice box. */
export interface ChoiceBoxItem {
  /** The display name for this item. */
  name: string
  /** Optional container/category shown after the name (separated by tab). */
  container?: string
  /** Optional SF Symbol name to display beside the item. */
  symbol?: SFSymbolName
}

/** A single source of items for a choice box. */
export interface ChoiceBoxSource {
  /** When set, this source activates while the search field text begins with `prefix`. */
  prefix?: string
  /** Placeholder text shown in the search field while this source is active. */
  placeholder?: string
  /** Default SF Symbol to use when an item doesn't specify one. */
  defaultSymbol?: SFSymbolName
  /** Whether the user can dismiss without selecting (default: false). */
  allowsEmptySelection?: boolean
  /** Whether multiple items can be selected (default: false). */
  allowsMultipleSelection?: boolean
  /** Items shown when this source is active. A function is called once on first
   *  activation and cached for the lifetime of the choice box, so expensive lists
   *  (e.g. every row in a large outline) only pay their cost if the user actually
   *  triggers the source. */
  items: ChoiceBoxItem[] | (() => ChoiceBoxItem[])
}

/** Result from a successful choice-box submission. */
export interface ChoiceBoxResult {
  /** The submitted source's prefix, or `null` for the default (no-prefix) source. */
  prefix: string | null
  /** Indices into the active source's items array. */
  indices: number[]
  /** The picked items, in the same order as `indices`. */
  items: ChoiceBoxItem[]
}
