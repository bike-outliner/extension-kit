import { Affinity, AttributedString, Outline, Range, Row, TransactionOptions } from './outline'
import { OutlinePath } from '../core/outline-path'
import { Disposable } from './system'
import { MenuItem } from './menu'
import { View } from './bike'

/** OutlineEditor is a view that displays an outline. */
export interface OutlineEditor extends View {
  /** Edited outline. */
  readonly outline: Outline

  /**
   * Root of focused outline in editor. Defaults to outline root, but can be
   * set to "focus in" to a portion of the outline.
   */
  focus: Row

  /** Focus in to the given row, or the selected row if none provided. */
  focusIn(row?: Row): void
  /** Focus out one level in the focus stack. */
  focusOut(): void

  /**
   * Applies a filter to the outline editor display using an OutlinePath.
   * If the path is relative, it is resolved from the focus row.
   *
   * Set a plain path, or `{ path, label }` — the label displays in the
   * filter field in place of the raw query while the field is unfocused.
   * Paths matching a saved sidebar query display that query's title
   * automatically.
   */
  get filter(): { path: OutlinePath; label?: string } | undefined
  set filter(value: OutlinePath | { path: OutlinePath; label?: string } | undefined)

  /** True when row is in focused branch and not filtered or collapsed */
  isFocused(row: Row): boolean
  /** Return prev focused row from given row */
  prevFocused(row: Row): Row | undefined
  /** Return next focused row from given row */
  nextFocused(row: Row): Row | undefined

  /** True if row is expanded */
  isExpanded(row: Row): boolean
  /** True if row is collapsed */
  isCollapsed(row: Row): boolean
  /** Expand the given rows with given options. */
  expand(rows?: Row[], options?: FoldOptions): void
  /** Collapse the given rows with given options. */
  collapse(rows?: Row[], options?: FoldOptions): void

  /** Read editor selection. */
  readonly selection?: Selection

  /**
   * Observe selection.
   * @param observer - The closure for new selections.
   * @param debounce - The debounce delay in milliseconds. (default 1000ms)
   */
  observeSelection(observer: (selection?: Selection) => void, debounce?: number): Disposable

  /** Select rows to create a "block" selection. */
  selectRows(anchor: Row, head?: Row): void
  /** Select a single row's text to create a "text" selection. */
  selectText(row: Row, anchor: number, head?: number): void
  /** Place caret in a single rows text to create a "caret" selection. */
  selectCaret(row: Row, anchor: number, runAffinity?: Affinity, lineAffinity?: Affinity): void

  /**
   * Reveal the given row in editor.
   *
   * Use when you want to move (and maintain) the selection to a row that might
   * not be visible. Note that when you `select` that row is automatically
   * revealed so you don't need to call this method.
   *
   * @param row - The row to reveal. May focus out and expand rows as needed.
   * @param revealChildren - Whether to also reveal the row's children.
   */
  revealRow(row: Row, revealChildren?: boolean): void

  /**
   * Make this editor the first responder within its window, bring the
   * window to the front, and activate the bike application. Use when a
   * window contains multiple split editors and you want a specific one
   * to receive keyboard input.
   */
  activate(): void

  /**
   * Group outline changes into a single view update.
   *
   * You don't need to use this method when making changes to the editor. This
   * just gives you more control over how the view updates when you make
   * changes. Consider this method when making multiple changes to the editor
   * that should be treated as a single change in the view.
   *
   * @param options Options that determine how the view updates.
   * @param update Perform changes to the outline in this closure.
   * @returns The return value of the update closure.
   */
  transaction(options: TransactionOptions, update: () => any): any

  /**
   * Show a message in the editor's status bar.
   *
   * If a timeout is provided the message auto-dismisses after that duration.
   * Dispose the returned handle to clear the message early. Disposing only
   * clears the message if it is still the active one — extensions cannot
   * accidentally clear each other's messages.
   *
   * @param message - The message to display.
   * @param timeout - Optional auto-dismiss duration in milliseconds.
   * @returns A Disposable that clears this specific message.
   */
  showStatusMessage(message: string, timeout?: number): Disposable

  /**
   * Present a menu anchored to a row.
   *
   * @param row - The row the menu is anchored to
   * @param options - The menu's items, anchor, and handlers.
   * @returns A handle for this presentation, or undefined if the menu was not presented (no items).
   */
  showMenu(row: Row, options: ShowMenuOptions): MenuHandle | undefined
}

/** Context passed to `showMenu` handlers: the menu's row and its editor. */
export interface MenuContext {
  readonly editor: OutlineEditor
  readonly row: Row
}

export interface ShowMenuOptions {
  /**
   * Builds the menu's items. Called for the initial menu and re-invoked on
   * every refresh (see `showMenu`), so it must be a pure function of current
   * state. Buttons with a `command:<commandId>` id dispatch that command
   * with the menu's row as its selection; ones naming an unregistered
   * command are hidden (a menu left with no usable items doesn't present).
   */
  items: () => MenuItem[]
  /**
   * A badge name: anchor the menu at that badge's glyph on the row. Falls
   * back to the row's text line when the badge isn't drawn there (so a
   * badge's `onClick` can pass its own name unconditionally). Omit to
   * anchor at the row's text line.
   */
  anchor?: string
  /** A non-`command:` button (or row-embedded button) was chosen. */
  onAction?: (id: string, context: MenuContext) => void
  /**
   * A valued item committed, with a TYPED value: string (`field`,
   * `calendar`, `choice`, `palette`), number (`duration` seconds), or
   * boolean (`toggle`). Values are buffered while the menu is open,
   * delivered on commit-dismissal (Return, item selection, click-out), and
   * dropped on Esc.
   */
  onChange?: (id: string, value: string | number | boolean, context: MenuContext) => void
}

/** A handle to one `showMenu` presentation. */
export interface MenuHandle {
  /**
   * Dismiss the menu if this presentation is still the live one (cancel
   * semantics: buffered values drop). A stale handle no-ops.
   */
  dismiss(): void
  /**
   * Re-render the open menu from its `items` builder — for state that
   * changed OUTSIDE a menu interaction (a timer, an async result).
   * Non-dismissing interactions already refresh automatically. A stale
   * handle no-ops.
   */
  refresh(): void
}

/**
 * Outline editor selection.
 *
 * Selections have an anchor and a head. The anchor is the fixed point where
 * the selection began, and the head is the dynamic point that moves. The head
 * and anchor may be the same value. Depending on the selection type these
 * values may be character offsets or rows.
 *
 * All selections have a set of common properties. Each selection also has a
 * type which determines the fields in `selection.detail`.
 *
 * The selection types are:
 *
 * - caret: A single character in a single row.
 * - text: A range of characters in a single row.
 * - block: A range of rows in the outline.
 */
export type Selection = Readonly<SelectionCommon & SelectionTypeDetail>

type SelectionCommon = {
  /** The head row of the selection */
  row: Row
  /** The word touching the head of the selection */
  word: string
  /** The sentence touching the head of the selection */
  sentence: string
  /** The rows in the selection */
  rows: Row[]
  /** The common ancestors of the rows in the selection */
  coverRows: Row[]
  /**
   * Context values computed at the selection head row: the nearest-wins
   * union of the head row's and its ancestors' attributes (system
   * attributes such as `indent` excluded), merged with each registered
   * summary evaluated at the head row (summary values win on name
   * collision). Selection observers re-fire when these values change even
   * if the selection itself has not moved.
   */
  context: Record<string, string | number | boolean | null>
}

type SelectionTypeDetail =
  | {
      /** A collapsed blinking caret selection */
      type: 'caret'
      detail: {
        /** Character offset in headRow */
        char: number
        /**
         * Line affinity determines which line the caret will appear on when
         * it is located at the end of a wrapped line.
         */
        lineAffinity: Affinity
        /**
         * Run affinity determines which run the caret is associated with when
         * it is located on a boundary between two run.
         */
        runAffinity?: Affinity
      }
    }
  | {
      /** A text range selection within a single row */
      type: 'text'
      detail: {
        /** Character range of the selection in the headRow */
        range: Range
        /** The selected text */
        text: AttributedString
        /** The head character offset of the selection */
        headChar: number
        /** The anchor character offset of the selection */
        anchorChar: number
      }
    }
  | {
      /** A block selection over one or more rows */
      type: 'block'
      detail: {
        headRow: Row
        anchorRow: Row
        startRow: Row
        endRow: Row
      }
    }

/**
 * Options for folding rows in an outline editor.
 *
 * - row - Fold the row itself.
 * - completely - Fold the row and all non leaf children.
 * - byLevel - Fold the row by level. First compute the maximum visible
 *   level of the rows descendants. Then expand/collapse that level by one.
 */
export type FoldOptions = 'row' | 'completely' | 'byLevel'
