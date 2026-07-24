/**
 * Presented with `editor.showMenu(row, { items, ... })`
 */

import { SFSymbolName } from '../core/bike-globals'
import { CommandName } from './commands'

export type MenuItemState = 'on' | 'off' | 'mixed'

export type MenuItem = MenuButtonItem | MenuSeparatorItem

export interface MenuButtonItem {
  type: 'button'
  id: `command:${CommandName}` | (string & {})
  title: string
  symbol?: SFSymbolName
  state?: MenuItemState
  enabled?: boolean
}

export interface MenuSeparatorItem {
  type: 'separator'
}
