import { OutlineEditor } from './outline-editor'
import { Row, Range } from './outline'
import { Disposable } from './system'

/**
 * Context passed to a text input `handle` after typed text is inserted
 * (never during IME composition).
 *
 * For a typed Return (`typed === '\n'`) the row has already been split:
 * `row` is the original row (now truncated at the split point) and `caret`
 * is the old caret — the split point at the end of that row's text. For
 * ordinary characters `caret` is the position after the typed character.
 */
export interface TextInputContext {
  readonly editor: OutlineEditor
  readonly row: Row
  readonly caret: number
  readonly typed: string
}

/**
 * Context passed to `provideCompletions` after each typed character while
 * the editor has a plain caret (never during IME composition).
 */
export interface CompletionContext {
  readonly editor: OutlineEditor
  readonly row: Row
  readonly caret: number
}

/**
 * One completion option. `name` is displayed and fuzzy-matched against the
 * result's `pattern`; `id` defaults to `name`. Extra properties survive the
 * round trip and are visible to {@link CompletionResult.accept}.
 */
export interface CompletionItem {
  id?: string
  name: string
  [key: string]: any
}

/**
 * What `provideCompletions` offers at the caret. The popup fuzzy-filters
 * `items` by `pattern`, anchors under `range`, and calls `accept` when the
 * user picks an item (Enter/Tab/click). The popup closes itself when
 * nothing matches (unless `emptyFallback` is provided) and when the
 * selection changes.
 */
export interface CompletionResult {
  /** Character range in the context row being completed (e.g. the typed token). */
  range: Range
  /** Text the item names are fuzzy-matched against (e.g. the token's text). */
  pattern: string
  items: CompletionItem[]
  /** Shown as the only row when a non-empty pattern matches no item. */
  emptyFallback?: CompletionItem
  /** Commit the picked item (typically inside `editor.transaction`). */
  accept(item: CompletionItem): void
}

/**
 * A text input handler: either a bare `handle` function, or an object
 * combining the typed-text hook with a completion provider. Both members
 * are optional, but at least one must be present.
 */
export type TextInputHandler =
  | ((context: TextInputContext) => boolean)
  | {
      /** Higher priority handlers/providers run first. Defaults to 0. */
      priority?: number
      /**
       * Runs after each typed insertion or Return, in priority order; the
       * first to return true marks the keystroke handled, stopping later
       * handlers AND the editor's built-in text replacements (autocorrect,
       * smart quotes, …) for that keystroke. Perform edits via
       * `editor.transaction`.
       */
      handle?(context: TextInputContext): boolean
      /**
       * Offer completions at the caret, or `undefined` to pass. Called
       * after each typed character; the first provider (by priority)
       * returning a result drives the autocomplete popup.
       */
      provideCompletions?(context: CompletionContext): CompletionResult | undefined
    }

/** Interface for reacting to typed text and offering completions. */
export interface TextInput {
  /**
   * Adds a text input handler.
   * @param handler - A `handle` function, or `{ priority?, handle?, provideCompletions? }`.
   * @returns Disposable removes the handler.
   */
  addHandler(handler: TextInputHandler): Disposable
}
