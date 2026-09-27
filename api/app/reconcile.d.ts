import { Outline, OutlineChange, RowAttributeName } from './outline'
import { RelativeOutlinePath } from '../core/outline-path'

/**
 * Rules registered with `bike.reconcile(name, config)` apply to every outline,
 * open now or later. A rule runs inside the closing transaction, so its writes
 * share that undo step.
 */

/** Rows arriving under, or leaving, a parent. */
export interface ReconcileStructuralGuard {
  /**
   * Matched against the PARENT the rows arrived under or left, not the rows.
   * Omitted, matches any parent.
   */
  parent?: RelativeOutlinePath
}

/** A row itself changing — its attributes, type, text, or persistent id. */
export interface ReconcileModifiedGuard {
  /** Matched against the changed row. Omitted, matches any row. */
  row?: RelativeOutlinePath
  /**
   * Only attribute writes with these names. Omitted, every edit to a matching
   * row matches, typing included.
   */
  attribute?: RowAttributeName | RowAttributeName[]
}

/**
 * What must have happened for a rule to run.
 *
 * Buckets are ORed, keys inside a bucket ANDed. An undeclared bucket never
 * matches; an empty one (`inserted: {}`) matches its whole kind. A guard with no
 * bucket is rejected.
 *
 * A guard gates, it does not filter: a woken rule still receives the whole
 * transaction's changes.
 *
 * Subjects are read as the outline stands once the transaction's changes are in,
 * so a row (or parent) the same transaction went on to remove matches nothing,
 * even though its change is in the payload. Every rule's guard is decided before
 * any rule runs, so within an outline no rule's edits can wake another.
 *
 * Paths are compiled at registration, which throws on anything rejected. Reach
 * is bounded: self, parent, ancestor, child and sibling axes, and a closed list
 * of pure row functions. Descendant (`//` mid-path), document order, the `run`
 * axis, slices, and every function off the list — `summary()`, editor state,
 * `now()`/`today()`, `position()`/`last()` among them — are rejected.
 *
 * Changes carrying no row — a reload, document metadata — satisfy no bucket. A
 * rule that needs them declares no `when`.
 */
export interface ReconcileGuard {
  /** A row was removed from a matching parent. */
  removed?: ReconcileStructuralGuard
  /** A row was inserted under a matching parent. */
  inserted?: ReconcileStructuralGuard
  /** A matching row changed. */
  modified?: ReconcileModifiedGuard
}

/**
 * Config for a named reconcile rule. An unknown key throws. Names are
 * process-global: the last registration of a name wins, whichever extension
 * made it.
 */
export interface ReconcileConfig {
  /**
   * Evaluated natively, without entering JavaScript.
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
   * Omitted, every transaction wakes the rule. A move counts as both an
   * insertion under the new parent and a removal from the old one.
   */
  when?: ReconcileGuard

  /**
   * Called as each outermost outline transaction closes, with the outline that
   * changed and that transaction's own changes.
   *
   * Absent from `changes`: this rule's writes, other rules' writes, the log
   * entries Bike derives after the rules run, and the `beginTransaction` /
   * `endTransaction` markers `observeChanges` synthesizes. The outline itself
   * does reflect what earlier rules wrote — rules run in registration order.
   *
   * Not called for a transaction that changed nothing, nor while undoing or
   * redoing. Called for every other edit, including ones arriving from sync or
   * another extension, and for transient outlines Bike opens internally.
   *
   * Runs synchronously on every edit in every open outline. A throw is logged
   * and leaves the transaction, the other rules, and this rule's writes in place.
   */
  reconcile(outline: Outline, changes: OutlineChange[]): void
}
