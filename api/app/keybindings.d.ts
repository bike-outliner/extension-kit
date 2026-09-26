import { CommandName } from './commands'
import { Disposable } from './system'

/** Outline editor keybindings. */
export interface Keybindings {
  isCommandPressed: boolean
  isControlPressed: boolean
  isOptionPressed: boolean
  isShiftPressed: boolean

  /**
   * Held modifiers. Includes both the generic modifier and the side-specific
   * key, e.g. `Command` and `LeftCommand`.
   */
  activeModifiers: Modifiers[]

  /**
   * Adds keybindings to a keymap. Only processed while the outline editor
   * has focus.
   */
  addKeybindings(keybindings: {
    keymap: KeymapName
    keybindings: Record<KeySequence, CommandName>
    priority?: number
  }): Disposable

  /** Lists all keybindings, for debugging. */
  toString(): string
}

/**
 * `text-mode` applies to `caret` and `text` selections, `block-mode` to
 * `block` selections.
 */
export type KeymapName = 'text-mode' | 'block-mode'

export type Modifiers =
  | 'Command'
  | 'LeftCommand'
  | 'RightCommand'
  | 'Control'
  | 'LeftControl'
  | 'RightControl'
  | 'Option'
  | 'LeftOption'
  | 'RightOption'
  | 'Shift'
  | 'LeftShift'
  | 'RightShift'

/**
 * Space-separated keys, each a case-insensitive key joined to zero or more
 * modifiers with `-`, e.g. `a`, `ctrl-shift-a`, `cmd-opt-a`, `ctrl-x ctrl-s`.
 *
 * Modifiers: Command (cmd), Control (ctrl), Option (opt), Shift, and
 * Left/Right variants of each (e.g. LeftCommand), CapsLock, Function, Help,
 * NumericPad.
 *
 * Keys: single typed characters, Return (ret), Enter, Tab, BackTab, Space,
 * Delete (del), ForwardDelete, Escape (esc), Dash (the `-` key), LeftArrow
 * (left), RightArrow (right), UpArrow (up), DownArrow (down), Home, End,
 * PageUp, PageDown, Clear, Insert, F1–F35.
 */
export type KeySequence = string

/** Typed key such as `a` or `;`. */
export type Key = string
