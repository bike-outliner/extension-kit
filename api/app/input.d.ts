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
export interface InputContext {
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
 * How the user accepted a completion item. `'pick'` (Return, click) is the
 * terminal choice; `'complete'` (Tab, or a typed {@link
 * CompletionResult.completeChars} character) asks the provider to fill in
 * the item's text and keep going — e.g. expanding an attribute name to
 * `@name:` so its values can be completed next.
 */
export type CompletionAcceptKind = 'pick' | 'complete'

/**
 * What `provideCompletions` offers at the caret. The popup fuzzy-filters
 * `items` by `pattern`, anchors under `range`, and calls `accept` when the
 * user picks an item (Enter/Tab/click). The popup closes itself when
 * nothing matches (unless `fallback` is provided) and when the selection
 * changes.
 */
export interface CompletionResult {
  /** Character range in the context row being completed (e.g. the typed token). */
  range: Range
  /** Text the item names are fuzzy-matched against (e.g. the token's text). */
  pattern: string
  items: CompletionItem[]
  /**
   * The escape hatch for committing the literal typed text (e.g. an
   * `Add @pri` action while `priority` matches): pinned as the last popup
   * row behind a separator whenever the pattern is non-empty — never
   * fuzzy-ranked, never auto-highlighted — and the only (auto-selected)
   * row when nothing matches. Reached by arrowing down, or directly with
   * ⌥⏎. Convention: omit it when the typed text exactly equals an
   * existing item, so the escape never duplicates a match.
   */
  fallback?: CompletionItem
  /**
   * Characters that accept the highlighted item with kind `'complete'`
   * instead of being typed — `accept` supplies the character itself. Omit
   * where those characters must stay typable (e.g. `:` inside a value).
   */
  completeChars?: string
  /**
   * Commit the picked item (typically inside `editor.transaction`). After
   * `accept` returns, the popup re-queries providers at the caret — a
   * `'complete'` accept that rewrote the token gets its follow-up popup
   * immediately.
   */
  accept(item: CompletionItem, kind: CompletionAcceptKind): void
}

/**
 * A text input handler: either a bare `handle` function, or an object
 * combining the typed-text hook with a completion provider. Both members
 * are optional, but at least one must be present.
 */
export type InputHandler =
  | ((context: InputContext) => boolean)
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
      handle?(context: InputContext): boolean
      /**
       * Offer completions at the caret, or `undefined` to pass. Called
       * after each typed character; the first provider (by priority)
       * returning a result drives the autocomplete popup.
       */
      provideCompletions?(context: CompletionContext): CompletionResult | undefined
    }

/** Interface for reacting to typed text and offering completions. */
export interface Input {
  /**
   * Adds a text input handler.
   * @returns Disposable removes the handler.
   */
  addHandler(handler: InputHandler): Disposable
}
