import { OutlineEditor } from './outline-editor'
import { Row, Range } from './outline'
import { Disposable } from './system'

/**
 * Passed to `handle` after typed text is inserted, never during IME
 * composition. `caret` is after the typed character; for Return (`'\n'`) the
 * row is already split, `row` is the original row and `caret` its end.
 */
export interface InputContext {
  readonly editor: OutlineEditor
  readonly row: Row
  readonly caret: number
  readonly typed: string
}

/** Passed to `provideCompletions`; caret selections only, never during IME composition. */
export interface CompletionContext {
  readonly editor: OutlineEditor
  readonly row: Row
  readonly caret: number
}

/** `id` defaults to `name`. Extra properties are passed through to `accept`. */
export interface CompletionItem {
  id?: string
  name: string
  [key: string]: any
}

/**
 * `pick`: Return or click, final. `complete`: Tab or a `completeChars`
 * character; fill in the item and continue (e.g. `@name:` then values).
 */
export type CompletionAcceptKind = 'pick' | 'complete'

/**
 * The popup fuzzy-filters `items` by `pattern` and anchors under `range`. It
 * closes when nothing matches (unless `fallback` is set) or the selection
 * changes.
 */
export interface CompletionResult {
  /** Range in the row being replaced, e.g. the typed token. */
  range: Range
  /** Item names are fuzzy-matched against this. */
  pattern: string
  items: CompletionItem[]
  /**
   * Commits the literal typed text. Pinned last, unranked and not
   * auto-highlighted, when `pattern` is non-empty; the only, auto-selected,
   * row when nothing matches. ⌥⏎ picks it directly.
   */
  fallback?: CompletionItem
  /**
   * Characters that accept the highlighted item as `complete` instead of
   * being typed; `accept` supplies the character itself.
   */
  completeChars?: string
  /** Providers are re-queried at the caret after this returns. */
  accept(item: CompletionItem, kind: CompletionAcceptKind): void
}

/** A bare `handle` function, or an object with at least one of `handle` and `provideCompletions`. */
export type InputHandler =
  | ((context: InputContext) => boolean)
  | {
      /** Higher runs first. Default 0. */
      priority?: number
      /**
       * Runs after each typed insertion or Return. Returning true stops later
       * handlers and the editor's built-in replacements (autocorrect, smart
       * quotes) for that keystroke.
       */
      handle?(context: InputContext): boolean
      /**
       * Called after each typed character. The first result, by priority,
       * drives the popup.
       */
      provideCompletions?(context: CompletionContext): CompletionResult | undefined
    }

export interface Input {
  addHandler(handler: InputHandler): Disposable
}
