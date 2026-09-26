import { View } from './workspace'
import { CommandName } from './commands'
import { Row } from './outline'
import { Disposable } from './system'
import { SFSymbolName } from '../core/bike-globals'

export interface Sidebar extends View {
  /**
   * Adds a navigation item to the top of the sidebar. It highlights whenever
   * the editor shows its represented row.
   */
  addLocation(item: LocationItem): Disposable
}

export type LocationItem = Readonly<{
  /** Adding an existing id replaces that item. */
  id: string
  text: string
  symbol: SFSymbolName
  /** Row may not exist yet. */
  representedRowId: string
  /** Returns the row, creating it if needed. */
  prepareRow: () => Row
  /** Run on click; typically navigates to the row. */
  action: CommandName | (() => void)
}>
