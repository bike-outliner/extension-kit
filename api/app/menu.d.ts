/**
 * Presented with `editor.showMenu(row, { items, ... })`
 */

import { SFSymbolName } from '../core/bike-globals'
import { CommandName } from './commands'

export type MenuItemState = 'on' | 'off' | 'mixed'

export type MenuItem =
  | MenuButtonItem
  | MenuSeparatorItem
  | MenuPaletteItem
  | MenuCalendarItem

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

export interface MenuPaletteOption {
  value: string
  title: string
  symbol?: SFSymbolName
  color?: string // #rrggbb
}

export interface MenuPaletteItem {
  type: 'palette'
  id: string
  title?: string
  selection?: 'one' | 'any'
  value?: string
  values?: string[]
  options: MenuPaletteOption[]
  enabled?: boolean
}

export interface MenuCalendarItem {
  type: 'calendar'
  id: string
  value?: string // ISO-8601
  label?: string
  enabled?: boolean
}

// ---------------------------------------------------------------------------
// NOT PUBLIC API (yet).
// ---------------------------------------------------------------------------

// MenuButtonItem — held-out properties:
//   /** Render as destructive (red), e.g. Remove. (Accepted, not yet styled.) */
//   destructive?: boolean
//   /**
//    * `false` keeps the card OPEN on activation (a hosted button row instead
//    * of a native item; `state` is ignored there). Default `true`.
//    */
//   dismisses?: boolean

// /** A non-interactive section header. */
// export interface MenuHeaderItem {
//   type: 'header'
//   title: string
// }
// /**
//  * An editable text field row. Return or end of editing (focus left the
//  * field) stages the text; it is delivered via `onChange(id, value, ctx)`
//  * when the card commit-dismisses. Esc discards. An unchanged field never
//  * reports.
//  */
// export interface MenuFieldItem {
//   type: 'field'
//   id: string
//   placeholder?: string
//   value?: string
//   /** Caption above the field, in small secondary text. */
//   label?: string
//   /** Minimum bezel width in points; the card widens as needed. */
//   minWidth?: number
//   enabled?: boolean
// }
//
// /**
//  * A gap inside a `row`, REPLACING the row's uniform spacing where it sits:
//  * a fixed `width` gives exactly that gap (`0` butts two controls together);
//  * omitting it gives a FLEXIBLE spacer that pushes its neighbors apart.
//  */
// export interface MenuSpacerItem {
//   type: 'spacer'
//   width?: number
// }
//
// /**
//  * Controls side by side in one menu row, in the order listed (POSITIONAL —
//  * buttons render where they appear, they do not auto-trail). Unlike a
//  * `button`, a row owns NO highlight of its own — each control highlights
//  * independently under the pointer, which is what makes it the shape for "a
//  * thing plus an affordance beside it".
//  *
//  * Children may be fields, buttons, and spacers; a row with no field or
//  * button is skipped. A button child with a `symbol` is a compact ICON
//  * accessory; one without is a TITLED button that flexes to fill the row and
//  * can carry a `state` checkmark (which also puts the whole menu into
//  * checkbox layout, like a native checked item).
//  *
//  * `spacing` is the uniform gap between adjacent controls (default 8); a
//  * `spacer` child replaces the gap where it sits.
//  *
//  * In a row of BUTTONS (no fields), the first titled button is the row's
//  * PRIMARY: the keyboard highlights it and Return activates it. Icon
//  * accessories are pointer-only — a row has no field whose focus ring the
//  * keyboard could land on.
//  */
// export interface MenuRowItem {
//   type: 'row'
//   /** Names the row in logs; the children keep their own ids. */
//   id?: string
//   /** Uniform gap between adjacent controls, in points. Default 8. */
//   spacing?: number
//   items: (MenuFieldItem | MenuButtonItem | MenuSpacerItem)[]
// }
//
// /**
//  * A duration picker: keyboard-editable digit fields (arrows step, typed
//  * digits accumulate, delete clears). Edits update the pending duration —
//  * WHOLE SECONDS, a NUMBER — with the card open; it is delivered via
//  * `onChange` on commit-dismissal.
//  */
// export interface MenuDurationItem {
//   type: 'duration'
//   id: string
//   /** Initial duration in whole seconds (number); omitted = 0. */
//   value?: number
//   /** Caption above the picker, in small secondary text. */
//   label?: string
//   /**
//    * Which component fields to show, any order (they render canonically);
//    * omitted/empty = hour/minute/second. Hidden fields are zero in the
//    * reported value.
//    */
//   fields?: ('year' | 'day' | 'hour' | 'minute' | 'second')[]
//   enabled?: boolean
// }
//
// /**
//  * A time-of-day picker: keyboard-editable digit fields, like `duration` but
//  * for a wall-clock time. Edits update the pending `HH:mm:ss` string value
//  * (the display is localized, the wire value is not); the card stays open.
//  */
// export interface MenuTimeItem {
//   type: 'time'
//   id: string
//   /** Initial `HH:mm:ss` value; omitted = midnight. */
//   value?: string
//   /** Caption above the picker, in small secondary text. */
//   label?: string
//   /**
//    * Which component fields to show; omitted/empty = hour/minute. Hidden
//    * fields are zero in the reported value.
//    */
//   fields?: ('hour' | 'minute' | 'second')[]
//   enabled?: boolean
// }
//
// /**
//  * A nested menu of any item types. AVOID focusable children (`field`,
//  * `row`, `duration`) in submenus — they are not keyboard-coordinated there
//  * and disturb the root card's typing while the submenu is open.
//  */
// export interface MenuSubmenuItem {
//   type: 'submenu'
//   id: string
//   title: string
//   /** SF Symbol name (required for `style: 'icon'`). */
//   symbol?: string
//   /**
//    * `'native'` (default): a native titled item. `'icon'`: a hosted row with
//    * a compact icon button; the submenu shows while the pointer is over the
//    * button.
//    */
//   style?: 'native' | 'icon'
//   /** Caption above the icon button (`style: 'icon'` only). */
//   label?: string
//   items: MenuItem[]
//   enabled?: boolean
// }
