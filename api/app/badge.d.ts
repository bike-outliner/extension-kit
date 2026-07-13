import { Image, Font, Color } from '../core/graphics'
import { RelativeOutlinePath } from '../core/outline-path'
import { CommandName } from './commands'
import { OutlineEditor } from './outline-editor'
import { Row } from './outline'

/**
 * Badges: value-aware glyphs rendered trailing a row's text.
 *
 * A style rule can *test* a value in its selector (`.@priority = 1`), but it
 * emits a static style — it can't render the value itself (the number `3`, a
 * due date, a percent complete), only switch styling on or off per case. A
 * badge fills that gap: it injects a trailing-flow decoration whose glyph is
 * computed from the row's live values.
 *
 * It selects rows with a `where` path (same syntax as style rules), reads
 * `inputs` off each match, and hands them to `render`. That's how you surface
 * data inline — a `@priority` chip, a `summary("openTasks")` aggregate, a live
 * `@due` countdown (see `tick`), a progress bar. A badge can also be clicked
 * to open a small card of items — commands, actions, editable fields — so it
 * doubles as a lightweight inline control.
 */

/** The presentation context passed to `render`. */
export interface BadgeEnvironment {
  /**
   * The outline's BASE text font (the stylesheet's `viewport.font`), not the
   * row's — the same badge renders identically on a bold heading and a body
   * row.
   */
  readonly font: Font
  /** The row's inherited text color, so the glyph tints with its text. */
  readonly color: Color
  /** Epoch seconds; present only for `tick: true` badges. */
  readonly now?: number
}

/** Where a card interaction happened: the clicked row and its editor. */
export interface BadgeContext {
  readonly editor: OutlineEditor
  readonly row: Row
}

/** Checkmark state for a card item, mirroring cocoa menu item state. */
export type BadgeItemState = 'on' | 'off' | 'mixed'

/**
 * An entry in a badge's click card, discriminated by `kind`. Items are pure
 * data — `render` stays a cacheable pure function — so behavior lives
 * elsewhere: command items dispatch through the command registry, and every
 * other interactive kind routes its `id` to the badge-level
 * `onAction`/`onChange` callbacks. Valued kinds (`field`, `radio`, `toggle`,
 * `date`, `color`) commit through `onChange` with string-serialized values;
 * future kinds (submenus, sliders) extend the union the same way.
 *
 * Every visible kind (and each radio option) accepts an optional `filter`:
 * an outline path query (`//@priority = 1`). The item then reserves
 * trailing space for a filter affordance — clicking it filters the outline
 * to the query and dismisses the card. That keeps "act on this row" and
 * "find rows like this" on one card row instead of doubling the item list.
 */
export type BadgeItem =
  | BadgeCommandItem
  | BadgeActionItem
  | BadgeFieldItem
  | BadgeRadioItem
  | BadgeToggleItem
  | BadgeDateItem
  | BadgeDurationItem
  | BadgeColorItem
  | BadgeHeaderItem
  | BadgeSeparatorItem

/**
 * Dispatches a registered command; the clicked row becomes the command's
 * selection. `title` defaults to the command's display name. Items naming an
 * unregistered command are hidden.
 */
export interface BadgeCommandItem {
  kind: 'command'
  command: CommandName
  /** Overrides the command's display name. */
  title?: string
  /** SF Symbol name shown leading the title. */
  symbol?: string
  state?: BadgeItemState
  /**
   * Outline path query (`//@priority = 1`). Reserves trailing space on this
   * item for a filter affordance; clicking it filters the outline to the
   * query and dismisses the card.
   */
  filter?: string
}

/** A choice handled by the badge's `onAction(id, context)`. */
export interface BadgeActionItem {
  kind: 'action'
  id: string
  title: string
  /** SF Symbol name shown leading the title. */
  symbol?: string
  state?: BadgeItemState
  /** Render as destructive (red), e.g. Remove. */
  destructive?: boolean
  /**
   * Outline path query (`//@priority = 1`). Reserves trailing space on this
   * item for a filter affordance; clicking it filters the outline to the
   * query and dismisses the card.
   */
  filter?: string
}

/**
 * A labeled editable text field. Commits — end of editing, Return, card
 * dismissal — call the badge's `onChange(id, value, context)`; Esc discards.
 */
export interface BadgeFieldItem {
  kind: 'field'
  id: string
  label: string
  value: string
  placeholder?: string
  /**
   * Outline path query (`//@priority = 1`). Reserves trailing space on this
   * item for a filter affordance; clicking it filters the outline to the
   * query and dismisses the card.
   */
  filter?: string
}

/**
 * Exclusive choice rendered as a group of checkmark rows. Choosing an
 * option commits its `value` via `onChange(id, value, ctx)` and dismisses
 * the card, like a menu radio group.
 */
export interface BadgeRadioItem {
  kind: 'radio'
  id: string
  options: BadgeRadioOption[]
  /** Currently selected option value (shows the checkmark). */
  value?: string
}

/** One choice in a {@link BadgeRadioItem}. */
export interface BadgeRadioOption {
  value: string
  label: string
  /** SF Symbol name shown leading the label. */
  symbol?: string
  /**
   * Outline path query (`//@priority = 1`). Reserves trailing space on this
   * item for a filter affordance; clicking it filters the outline to the
   * query and dismisses the card.
   */
  filter?: string
}

/**
 * Checkbox row. Toggling commits `'true'`/`'false'` via `onChange`; the
 * card stays open and the checkmark flips in place.
 */
export interface BadgeToggleItem {
  kind: 'toggle'
  id: string
  title: string
  /** SF Symbol name shown leading the title. */
  symbol?: string
  value: boolean
  /**
   * Outline path query (`//@priority = 1`). Reserves trailing space on this
   * item for a filter affordance; clicking it filters the outline to the
   * query and dismisses the card.
   */
  filter?: string
}

/**
 * Labeled date picker. Every change commits ISO-8601 via `onChange` —
 * `YYYY-MM-DD` when `time` is false (the default), a full timestamp when
 * true. Card stays open.
 */
export interface BadgeDateItem {
  kind: 'date'
  id: string
  label: string
  /** ISO-8601 initial value; empty/omitted shows today. */
  value?: string
  time?: boolean
  /**
   * `'compact'` (default): editable text field with a calendar popover on
   * click. `'calendar'`: inline graphical month calendar (plus a clock when
   * `time`), always visible in the card.
   */
  display?: 'compact' | 'calendar'
  /**
   * Outline path query (`//@priority = 1`). Reserves trailing space on this
   * item for a filter affordance; clicking it filters the outline to the
   * query and dismisses the card.
   */
  filter?: string
}

/**
 * Labeled duration picker: keyboard-editable hour/minute/second digit
 * fields (0–24h; arrows step, typed digits accumulate, delete clears).
 * Every change commits the duration as WHOLE SECONDS (a decimal string,
 * e.g. `'5400'` for 1h 30m) via `onChange`, so values sort and compare
 * numerically in outline paths. Card stays open.
 */
export interface BadgeDurationItem {
  kind: 'duration'
  id: string
  label: string
  /** Initial duration in whole seconds (decimal string); empty/omitted = 0. */
  value?: string
  /**
   * Outline path query (`//@priority = 1`). Reserves trailing space on this
   * item for a filter affordance; clicking it filters the outline to the
   * query and dismisses the card.
   */
  filter?: string
}

/**
 * Labeled color row: swatch dots plus a trailing custom color well.
 * Clicking a swatch commits its string and dismisses; the well opens the
 * shared color panel and commits `#rrggbb` (debounced) with the card open.
 */
export interface BadgeColorItem {
  kind: 'color'
  id: string
  label?: string
  /** Swatch colors: `#rgb`/`#rrggbb`/`#rrggbbaa` hex strings. */
  swatches?: string[]
  /** Current value; the matching swatch shows a selection ring. */
  value?: string
  /**
   * Outline path query (`//@priority = 1`). Reserves trailing space on this
   * item for a filter affordance; clicking it filters the outline to the
   * query and dismisses the card.
   */
  filter?: string
}

export interface BadgeHeaderItem {
  kind: 'header'
  title: string
  /**
   * Outline path query (`//@priority = 1`). Reserves trailing space on this
   * item for a filter affordance; clicking it filters the outline to the
   * query and dismisses the card.
   */
  filter?: string
}

export interface BadgeSeparatorItem {
  kind: 'separator'
}

/** What `render` returns: a glyph plus optional click behavior. */
export interface BadgeSpec {
  /** The rendered glyph, e.g. `Image.fromSymbol(...)` or `Image.fromText(...)`. */
  image: Image
  /** Items shown in a card on click. When present, wins over `command`. */
  items?: BadgeItem[]
  /** Command dispatched on click (the clicked row is its `selection`). */
  command?: CommandName
}

/** A value-aware badge rendered trailing a row's text. */
export interface BadgeConfig {
  /** Relative outline path selecting the rows that show this badge (`.@priority`) */
  where: RelativeOutlinePath
  /** Map of result-name → outline-path value expression evaluated on the row */
  inputs?: Record<string, string>
  /** Re-render every second with `env.now` set */
  tick?: boolean
  /** Render input values to a `BadgeSpec`. Must be a pure function. */
  render: (values: Readonly<Record<string, string | undefined>>, env: BadgeEnvironment) => BadgeSpec | null
  /** Called when a `kind: 'action'` item is chosen. */
  onAction?: (id: string, context: BadgeContext) => void
  /** Called when a valued item (`field`, `radio`, `toggle`, `date`, `color`) commits a new value. */
  onChange?: (id: string, value: string, context: BadgeContext) => void
}
