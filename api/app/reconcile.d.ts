import { Outline, OutlineChange, RowAttributeName } from './outline'
import { RelativeOutlinePath } from '../core/outline-path'

/**
 * Rules that derive one change from another, for all open outlines.
 *
 * Registered with `bike.reconcile(name, config)`. Three things follow from
 * running there, and they are the reason to prefer this over
 * `outline.observeChanges`:
 *
 * - One registration covers every outline, open now or opened later. There is
 *   no per-outline subscription to set up, and none to tear down.
 * - The transaction is still open, so edits made here join it. The user's
 *   change and everything derived from it are one undo step.
 * - The rule is never called for "undo" operations, only for changes made in
 *   the current transaction.
 */

/** Rows arriving under, or leaving, a parent. */
export interface ReconcileStructuralGuard {
  /**
   * Matched against the PARENT the rows arrived under or left — not against
   * the rows themselves, which are in the payload.
   *
   * The parent is matched as it stands AFTER the change, so a rule asking
   * about a day sees the day, not what it was before the row landed in it.
   *
   * Omit to match every insertion (or removal) regardless of where.
   */
  parent?: RelativeOutlinePath
}

/** A row itself changing — its attributes, type, text, or persistent id. */
export interface ReconcileModifiedGuard {
  /** Matched against the ROW that changed. Omit to match any row. */
  row?: RelativeOutlinePath
  /**
   * Narrows to attribute writes with one of these names.
   *
   * Without it a rule is woken by every edit to a matching row, typing
   * included — usually the whole cost the guard is there to avoid.
   */
  attribute?: RowAttributeName | RowAttributeName[]
}

/**
 * What has to have happened for a rule to be worth waking.
 *
 * The three buckets are ORed — any one satisfied wakes the rule — and the keys
 * inside a bucket are ANDed. A bucket that isn't declared never matches; a
 * bucket declared empty (`inserted: {}`) matches its whole kind.
 *
 * A guard GATES, it does not filter: a woken rule still receives the whole
 * transaction's changes, so it never reads less than it would unguarded.
 *
 * Paths are validated when the rule is registered, and registration throws if
 * one is rejected. They reach bounded axes only — self, parent, ancestor,
 * child and siblings. Descendant (`//` mid-path) and document-order
 * (`following`/`preceding`) axes are rejected, as are `summary(...)`, editor
 * state (`selection`, `focused-*`, `expanded`, `filter-match`), `now()`,
 * `today()` and `position()`/`last()`. A path may be written relative (`.day`)
 * or absolute (`//day`, `/day`) — absolute ones are inverted for you.
 *
 * Changes that carry no row — a reload, and document metadata — cannot satisfy
 * any bucket, so a guarded rule is never woken by them. A rule that needs them
 * declares no `when` at all.
 */
export interface ReconcileGuard {
  /** A row was inserted under a matching parent. */
  inserted?: ReconcileStructuralGuard
  /** A row was removed from a matching parent. */
  removed?: ReconcileStructuralGuard
  /** A matching row changed. */
  modified?: ReconcileModifiedGuard
}

/** Config for a named reconcile rule. Last registration for a name wins. */
export interface ReconcileConfig {
  /**
   * Only wake this rule when the transaction did something it asked for,
   * decided natively without entering JavaScript.
   *
   * ```ts
   * bike.reconcile('refile', {
   *   when: {
   *     inserted: { parent: '.day' },
   *     removed: { parent: '.day' },
   *     modified: { row: '.task', attribute: 'status' },
   *   },
   *   reconcile(outline, changes) { ... },
   * })
   * ```
   *
   * Omit to be woken by every transaction. A move counts as BOTH an insertion
   * under the parent it landed in and a removal from the parent it left, so
   * "a task arrived under this day" is true for a drag as well as for a
   * newly created row.
   */
  when?: ReconcileGuard

  /**
   * Called as each outline transaction closes, with the outline that changed
   * and that transaction's own changes.
   *
   * What `changes` holds is the edit, not the reconciling of it: changes this
   * rule makes, changes another rule makes, and entries Bike derives itself
   * are all absent, so a rule that writes an attribute in response to an
   * attribute is never handed its own write back. The `beginTransaction` and
   * `endTransaction` markers `observeChanges` synthesizes don't appear either
   * — a call IS a transaction.
   *
   * Not called for a transaction that changed nothing, and not called while
   * undoing or redoing: replay restores what the rule derived the first time,
   * and deriving again on the way back would compound it on every ⌘Z.
   *
   * Runs synchronously, and every open outline waits on it — keep it quick,
   * and expect to be called often. A throw is logged and does not disturb the
   * transaction or the other registered rules.
   */
  reconcile(outline: Outline, changes: OutlineChange[]): void
}
