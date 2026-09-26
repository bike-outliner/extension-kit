import { Affinity, AttributedString, Outline, Range, Row, TransactionOptions } from './outline'
import { OutlinePath } from '../core/outline-path'
import { Disposable } from './system'
import { ShowMenuOptions } from './menu'
import { PickerSpec } from './picker'
import { View } from './workspace'

export interface OutlineEditor extends View {
  readonly outline: Outline

  /** Makes this editor first responder in its window. */
  activate(): void

  /** Displayed root. Default outline root. */
  focus: Row
  /** @param row Default the selected row. */
  focusIn(row?: Row): void
  /** Pops one level of the focus stack. */
  focusOut(): void

  /** Relative paths resolve from `focus`. */
  get filter(): { path: OutlinePath; label?: string; emptyMessage?: string } | undefined
  set filter(
    value:
      | OutlinePath
      | { 
        path: OutlinePath;
        /** Shown in the filter field instead of the query. */
        label?: string; 
        /** Shown when nothing matches. */
        emptyMessage?: string; 
        /** False to not push a navigation location. */
        pushLocation?: boolean 
      }
      | undefined
  )

  /** In the focused branch and not filtered out or collapsed. */
  isFocused(row: Row): boolean
  prevFocused(row: Row): Row | undefined
  nextFocused(row: Row): Row | undefined

  isExpanded(row: Row): boolean
  isCollapsed(row: Row): boolean
  expand(rows?: Row[], options?: FoldOptions): void
  collapse(rows?: Row[], options?: FoldOptions): void

  readonly selection?: Selection
  /** @param debounce Milliseconds. Default 1000. */
  observeSelection(observer: (selection?: Selection) => void, debounce?: number): Disposable
  /** Creates a `block` selection. */
  selectRows(anchor: Row, head?: Row): void
  /** Creates a `text` selection. */
  selectText(row: Row, anchor: number, head?: number): void
  /** Creates a `caret` selection. */
  selectCaret(row: Row, anchor: number, runAffinity?: Affinity, lineAffinity?: Affinity): void
  /** Focuses out and expands as needed. */
  revealRow(row: Row, revealChildren?: boolean): void

  /** Centered in the editor without `placement`. */
  showMenu(options: ShowMenuOptions): void
  showMenu(placement: Placement, options: ShowMenuOptions): void
  /** Centered in the editor without `placement`. */
  showPicker(spec: PickerSpec): void
  showPicker(placement: Placement, spec: PickerSpec): void
  /** Built-in type-aware menu for one attribute. */
  showAttributeMenu(attribute: string): void
  showAttributeMenu(placement: Placement, attribute: string): void
  showAttributesEditor(row: Row): void
  /** Shows `message` in the status bar. */
  showStatusMessage(message: string, timeout?: number): Disposable
  /** No-op when there are no completions at the caret. */
  showCompletions(): void

  /** Groups changes so the view updates once. */
  transaction(options: TransactionOptions, update: () => any): any
}

export interface Placement {
  row: Row
  /** Badge name, character index, or one image of a keyed badge. Default end of text. */
  anchor?: string | number | { badge: string; key?: string }
}

/**
 * `caret`: an offset in one row. `text`: a character range in one row.
 * `block`: a range of rows. The anchor is fixed; the head moves.
 */
export type Selection = Readonly<SelectionCommon & SelectionTypeDetail>

type SelectionCommon = {
  /** Head row. */
  row: Row
  /** Word touching the head. */
  word: string
  /** Sentence touching the head. */
  sentence: string
  rows: Row[]
  /** Common ancestors of `rows`. */
  coverRows: Row[]
}

type SelectionTypeDetail =
  | {
      type: 'caret'
      detail: {
        /** Offset in `row`. */
        char: number
        /** Line the caret shows on at a wrap. */
        lineAffinity: Affinity
        /** Run the caret belongs to at a run boundary. */
        runAffinity?: Affinity
      }
    }
  | {
      type: 'text'
      detail: {
        /** Range in `row`. */
        range: Range
        text: AttributedString
        headChar: number
        anchorChar: number
      }
    }
  | {
      type: 'block'
      detail: {
        headRow: Row
        anchorRow: Row
        startRow: Row
        endRow: Row
      }
    }

/**
 * `row`: the row only. `completely`: the row and all non-leaf descendants.
 * `byLevel`: one level deeper or shallower than the deepest visible descendant.
 */
export type FoldOptions = 'row' | 'completely' | 'byLevel'
