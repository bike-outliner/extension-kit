import { Affinity, AttributedString, Outline, Range, Row, TransactionOptions } from './outline'
import { OutlinePath } from '../core/outline-path'
import { Disposable } from './system'
import { ShowMenuOptions } from './menu'
import { PickerSpec } from './picker'
import { View } from './workspace'

/** OutlineEditor is a view that displays an outline. */
export interface OutlineEditor extends View {
  /** Edited outline. */
  readonly outline: Outline

  /** Make this editor the first responder within its window */
  activate(): void

  /** Root of focused outline in editor. (Defaults to outline root) */
  focus: Row
  /** Focus in to the given row, or the selected row if none provided. */
  focusIn(row?: Row): void
  /** Focus out one level in the focus stack. */
  focusOut(): void

  /** Filter the display by an OutlinePath, resolved from the focus row when relative. */
  get filter(): { path: OutlinePath; label?: string; emptyMessage?: string } | undefined
  set filter(
    value:
      | OutlinePath
      | { 
        path: OutlinePath;
        /** Stands in for the raw query in the filter field */
        label?: string; 
        /** Message to show when nothing matches */
        emptyMessage?: string; 
        /** If false, don't push a new location for each change in the filter */
        pushLocation?: boolean 
      }
      | undefined
  )

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
  /** Observe selection. `debounce` is in milliseconds (default 1000). */
  observeSelection(observer: (selection?: Selection) => void, debounce?: number): Disposable
  /** Select rows to create a "block" selection. */
  selectRows(anchor: Row, head?: Row): void
  /** Select a single row's text to create a "text" selection. */
  selectText(row: Row, anchor: number, head?: number): void
  /** Place caret in a single rows text to create a "caret" selection. */
  selectCaret(row: Row, anchor: number, runAffinity?: Affinity, lineAffinity?: Affinity): void
  /** Reveal a row, focusing out and expanding as needed. */
  revealRow(row: Row, revealChildren?: boolean): void

  /** Present a menu, centered in the editor unless a placement is given. */
  showMenu(options: ShowMenuOptions): void
  showMenu(placement: Placement, options: ShowMenuOptions): void
  /** Present a value picker, centered in the editor unless a placement is given. */
  showPicker(spec: PickerSpec): void
  showPicker(placement: Placement, spec: PickerSpec): void
  /** Present the built-in type-aware menu for one attribute. */
  showAttributeMenu(attribute: string): void
  showAttributeMenu(placement: Placement, attribute: string): void
  /** Present the row’s Attributes Editor */
  showAttributesEditor(row: Row): void
  /** Show a message in the editor's status bar. */
  showStatusMessage(message: string, timeout?: number): Disposable
  /** Show autocomplete for current caret if any completions exist */
  showCompletions(): void

  /** Group several changes so the view updates once. */
  transaction(options: TransactionOptions, update: () => any): any
}

/** Where a menu or picker appears. Omitted entirely, it centers in the editor. */
export interface Placement {
  row: Row
  /** Badge name, character index, or one image of a keyed badge. Default end of row text. */
  anchor?: string | number | { badge: string; key?: string }
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
