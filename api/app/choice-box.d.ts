import { SFSymbolName } from '../core/bike-globals'

export interface ChoiceBoxItem {
  name: string
  /** Shown after the name. */
  container?: string
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
  /** Used when an item has no `symbol`. */
  defaultSymbol?: SFSymbolName
  /** Can dismiss without selecting. Default false. */
  allowsEmptySelection?: boolean
  /** Default false. */
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
