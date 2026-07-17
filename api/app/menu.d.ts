/**
 * Menus: pure-data descriptions of a small modal menu of items (commands,
 * actions, editable fields) rendered as a real native menu. Presented with
 * `editor.showMenu(row, { items, ... })`, which routes interactions to that
 * presentation's `onAction`/`onChange` handlers.
 */

/** Checkmark state for a menu `button`, mirroring cocoa menu item state. */
export type MenuItemState = 'on' | 'off' | 'mixed'

/**
 * An entry in a menu, discriminated by `type` (the menu is a real native
 * menu). Items are pure data — behavior lives in the presentation: `button`s
 * whose id has the form `command:<commandId>` dispatch through the command
 * registry (unregistered ones are hidden), every other interactive item
 * routes its `id` to the `showMenu` options' `onAction`/`onChange`
 * handlers. Valued items commit through `onChange` with TYPED values: a
 * string (`field`, `calendar`, `choice`, `palette`), a number (`duration`,
 * whole seconds), or a boolean (`toggle`).
 *
 * Unknown `type`s and items missing required keys are skipped, never
 * errors — a menu written against a future schema still renders.
 *
 * The menu is MODAL and dismisses natively: Esc discards pending field
 * edits; click-out / Return / choosing an item commits them first.
 * Choosing a `button` (unless `dismisses: false`), `toggle`, `choice`
 * option, `palette` option, or `calendar` day closes the menu; `field` and
 * `duration` edits keep it open. Menus require macOS 26.
 */
export type MenuItem =
  | MenuButtonItem
  | MenuToggleItem
  | MenuChoiceItem
  | MenuFieldItem
  | MenuRowItem
  | MenuCalendarItem
  | MenuDurationItem
  | MenuSubmenuItem
  | MenuPaletteItem
  | MenuHeaderItem
  | MenuSeparatorItem

/**
 * A menu button row. Choosing it reports `onAction(id, context)` and closes
 * the card — unless `dismisses: false`, which keeps the card open (for
 * affordances that mutate the open card). An id of the form
 * `command:<commandId>` instead dispatches that command with the clicked
 * row as its selection (never reaching `onAction`); buttons naming an
 * unregistered command are hidden.
 */
export interface MenuButtonItem {
  type: 'button'
  id: string
  title: string
  /** SF Symbol name shown leading the title. */
  symbol?: string
  state?: MenuItemState
  /** Render as destructive (red), e.g. Remove. (Accepted, not yet styled.) */
  destructive?: boolean
  /**
   * `false` keeps the card OPEN on activation (a hosted button row instead
   * of a native item). Default `true`.
   */
  dismisses?: boolean
  enabled?: boolean
}

/**
 * Checkbox row. Toggling commits the flipped value as a BOOLEAN via
 * `onChange(id, value, ctx)` and closes the card.
 */
export interface MenuToggleItem {
  type: 'toggle'
  id: string
  title: string
  /** SF Symbol name shown leading the title. */
  symbol?: string
  value: boolean
  enabled?: boolean
}

/**
 * Exclusive choice rendered as a group of checkmark rows. Choosing an
 * option commits its `value` (string) via `onChange(id, value, ctx)` and
 * closes the card, like a menu radio group.
 */
export interface MenuChoiceItem {
  type: 'choice'
  id: string
  options: MenuChoiceOption[]
  /** Currently selected option value (shows the checkmark). */
  value?: string
  enabled?: boolean
}

/** One option in a {@link MenuChoiceItem} or {@link MenuPaletteItem}. */
export interface MenuChoiceOption {
  value: string
  title: string
  /** SF Symbol name (palette default: `circle.fill`). */
  symbol?: string
  /** `#rrggbb` tint — palette options render the symbol in this color. */
  color?: string
}

/**
 * An editable text field row. Commits — Return, end of editing (focus left
 * the field), card dismissal — call `onChange(id, value, ctx)` with the
 * text; Esc discards. An unchanged field never reports.
 */
export interface MenuFieldItem {
  type: 'field'
  id: string
  placeholder?: string
  value?: string
  /** Caption above the field, in small secondary text. */
  label?: string
  /** Minimum bezel width in points; the card widens as needed. */
  minWidth?: number
  enabled?: boolean
}

/**
 * A gap inside a `row`, REPLACING the row's uniform spacing where it sits:
 * a fixed `width` gives exactly that gap (`0` butts two controls together);
 * omitting it gives a FLEXIBLE spacer that pushes its neighbors apart.
 */
export interface MenuSpacerItem {
  type: 'spacer'
  width?: number
}

/**
 * Controls side by side in one menu row, in the order listed (POSITIONAL —
 * buttons render where they appear, they do not auto-trail). Unlike a
 * `button`, a row owns NO highlight of its own — each control highlights
 * independently under the pointer, which is what makes it the shape for "a
 * thing plus an affordance beside it".
 *
 * Children may be fields, buttons, and spacers; a row with no field or button
 * is skipped. A button child with a `symbol` is a compact ICON accessory; one
 * without is a TITLED button that flexes to fill the row and can carry a
 * `state` checkmark (which also puts the whole menu into checkbox layout,
 * like a native checked item).
 *
 * `spacing` is the uniform gap between adjacent controls (default 8); a
 * `spacer` child replaces the gap where it sits.
 *
 * In a row of BUTTONS (no fields), the first titled button is the row's
 * PRIMARY: the keyboard highlights it and Return activates it. Icon
 * accessories are pointer-only — a row has no field whose focus ring the
 * keyboard could land on.
 */
export interface MenuRowItem {
  type: 'row'
  /** Names the row in logs; the children keep their own ids. */
  id?: string
  /** Uniform gap between adjacent controls, in points. Default 8. */
  spacing?: number
  items: (MenuFieldItem | MenuButtonItem | MenuSpacerItem)[]
}

/**
 * An inline month calendar. Picking a day commits ISO-8601 `YYYY-MM-DD`
 * (string, current time zone) via `onChange` and closes the card.
 *
 * Set `time` to also show a localized time-of-day picker under the grid. The
 * card then commits the combined `YYYY-MM-DDTHH:mm:ss` — local, no zone, the
 * same fixed contract extended — and **stops closing when a day is picked**,
 * since the time is still editable: the day becomes selection, time edits
 * commit as they happen, and the card closes on dismiss. Nothing is committed
 * until a day exists, so with no `value` the time is silent until one is
 * picked.
 */
export interface MenuCalendarItem {
  type: 'calendar'
  id: string
  /**
   * ISO-8601 initial value; empty/omitted shows today and selects nothing.
   * Accepts `YYYY-MM-DD` or the combined `YYYY-MM-DDTHH:mm:ss`, so you can
   * hand back exactly what `onChange` gave you. The selected day is filled,
   * and the card opens on its month. A time here wins over `time`, which is
   * only the default.
   */
  value?: string
  /**
   * `HH:mm:ss` — include a time picker, starting at this time. Omit for a
   * date-only calendar. `true` means include it at midnight. Displays hour and
   * minute; seconds you set are kept even though they aren't shown.
   */
  time?: string | boolean
  /** Caption above the calendar, in small secondary text. */
  label?: string
  enabled?: boolean
}

/**
 * A duration picker: keyboard-editable digit fields (arrows step, typed
 * digits accumulate, delete clears). Every change commits the duration as
 * WHOLE SECONDS — a NUMBER — via `onChange`; the card stays open.
 */
export interface MenuDurationItem {
  type: 'duration'
  id: string
  /** Initial duration in whole seconds (number); omitted = 0. */
  value?: number
  /** Caption above the picker, in small secondary text. */
  label?: string
  /**
   * Which component fields to show, any order (they render canonically);
   * omitted/empty = hour/minute/second. Hidden fields are zero in the
   * reported value.
   */
  fields?: ('year' | 'day' | 'hour' | 'minute' | 'second')[]
  enabled?: boolean
}

/**
 * A nested menu of any item types. AVOID focusable children (`field`,
 * `row`, `duration`) in submenus — they are not keyboard-coordinated there
 * and disturb the root card's typing while the submenu is open.
 */
export interface MenuSubmenuItem {
  type: 'submenu'
  id: string
  title: string
  /** SF Symbol name (required for `style: 'icon'`). */
  symbol?: string
  /**
   * `'row'` (default): a native titled item. `'icon'`: a hosted row with a
   * compact icon button; the submenu shows while the pointer is over the
   * button.
   */
  style?: 'row' | 'icon'
  /** Caption above the icon button (`style: 'icon'` only). */
  label?: string
  items: MenuItem[]
  enabled?: boolean
}

/**
 * A palette row: the options render inline as a horizontal strip of tinted
 * symbols (this is where color swatches map). Choosing an option commits
 * its `value` (string) via `onChange` and closes the card.
 */
export interface MenuPaletteItem {
  type: 'palette'
  id: string
  title?: string
  /**
   * `'one'` (default): exclusive. `'any'`: multi-select — each activation
   * reports the toggled option and the extension owns the resulting state.
   */
  selection?: 'one' | 'any'
  /** Selected value (`selection: 'one'`). */
  value?: string
  /** Selected values (`selection: 'any'`). */
  values?: string[]
  options: MenuChoiceOption[]
  enabled?: boolean
}

/** A non-interactive section header. */
export interface MenuHeaderItem {
  type: 'header'
  title: string
}

export interface MenuSeparatorItem {
  type: 'separator'
}
