import { View } from './workspace'
import { CommandName } from './commands'
import { Row } from './outline'
import { Disposable } from './system'
import { SFSymbolName } from '../core/bike-globals'

/** Sidebar is a view that displays a list of navigation items. */
export interface Sidebar extends View {
  /**
   * Add a navigation shortcut to the top of the sidebar.
   *
   * When clicked, the action runs (typically navigating to the represented row,
   * creating it if needed). The location is automatically highlighted when the
   * editor navigates to its represented row by any means.
   *
   * @returns Disposable removing the item.
   */
  addLocation(item: LocationItem): Disposable
}

/** A location item in the sidebar. */
export type LocationItem = Readonly<{
  /** Unique identifier. Adding a location with an existing ID replaces it. */
  id: string
  /** The text to display. */
  text: string
  /** The SF Symbol name to display. */
  symbol: SFSymbolName
  /** The row ID this location represents. (Row may not exist yet) */
  representedRowId: string
  /** Returns the row this location targets, creating it if needed. */
  prepareRow: () => Row
  /** The action to perform, some form of navigating to the represented row. */
  action: CommandName | (() => void)
}>
