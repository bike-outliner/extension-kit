import { SFSymbolName } from '../core/bike-globals'

/** An item to display in a choice box. */
export interface ChoiceBoxItem {
  /** The display name for this item. */
  name: string
  /** Optional container/category shown after the name (separated by tab). */
  container?: string
  /** Optional SF Symbol name to display beside the item. */
  symbol?: SFSymbolName
}

export interface ChoiceBoxSource {
  /**
   * Active while the search text begins with `prefix`. With several sources,
   * exactly one omits `prefix` (the default); the rest need unique non-empty
   * prefixes.
   */
  prefix?: string
  placeholder?: string
  /** Default SF Symbol to use when an item doesn't specify one. */
  defaultSymbol?: SFSymbolName
  /** Whether the user can dismiss without selecting (default: false). */
  allowsEmptySelection?: boolean
  /** Whether multiple items can be selected (default: false). */
  allowsMultipleSelection?: boolean
  /** A function is called once, on first activation, and cached. */
  items: ChoiceBoxItem[] | (() => ChoiceBoxItem[])
}

export interface ChoiceBoxResult {
  /** `null` for the default source. */
  prefix: string | null
  /** Into the active source's items. */
  indices: number[]
  /** Same order as `indices`. */
  items: ChoiceBoxItem[]
}
