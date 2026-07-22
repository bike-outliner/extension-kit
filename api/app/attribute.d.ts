/**
 * Attribute definitions: configure how the editor treats a specific attribute.
 * Today that covers completion and default-badge rendering.
 *
 * Completion: typing `@name` / `@name:value` at the END of a row's text
 * completes and commits row attributes. That works for ANY attribute; a
 * definition adds what only the owning extension knows:
 *
 * - `shortcuts` — quick effects under the bare `@` popup ("Due Tomorrow⏎").
 * - `values` — suggestions after `@name:` ("Today", "Friday (Jul 24)").
 * - `parse` — free text → a committed value (`@due:next fri`).
 * - `sigil` — a one-character alias: `^fri` ≡ `@due:fri`.
 *
 * Rendering: unclaimed attributes get a generic `name:value` badge from the
 * built-in catch-all badge; `defaultBadge: false` opts an attribute out.
 */

/**
 * Declared value type — a serialization convention readers and writers agree
 * on (row attribute values are always strings):
 *
 * - `'string'` — any text (the default).
 * - `'number'` — a decimal via `String(n)` ("2", "3.5").
 * - `'date'` — `YYYY-MM-DD` (local calendar day), or a full ISO-8601 UTC
 *   timestamp when timed ("2026-07-24T17:00:00Z").
 * - `'duration'` — `<n><unit>` with unit `m` / `h` / `d` ("30m", "2h",
 *   "1.5h", "1d").
 * - `'flag'` — valueless only: present with the empty string, or absent.
 */
export type AttributeType = 'string' | 'number' | 'date' | 'duration' | 'flag'

/** A quick effect offered under the bare `@` popup. */
export interface AttributeShortcut {
  /** Stable id within this attribute's shortcuts; defaults to `name`. */
  id?: string
  /** Display text, fuzzy-matched ("Due Tomorrow"). */
  name: string
  /** The attribute value committed when picked. */
  value: string
}

/** A value suggestion for `@name:` / sigil completion. */
export interface AttributeValue {
  /** Display text, fuzzy-matched ("Friday"). */
  name: string
  /** The attribute value committed when picked. */
  value: string
  /** Right-aligned popup detail ("Jul 24"). Display only — not matched. */
  detail?: string
}

/** A successful free-text parse. */
export interface AttributeParseResult {
  /** The attribute value to commit. */
  value: string
  /** Display label for the fallback row ("Fri, Jul 24"). */
  label: string
}

/**
 * Configuration for {@link Bike.attribute}. Every member is optional —
 * `bike.attribute('done', {})` simply names the attribute in completion.
 * Callbacks run on the main thread per keystroke while a token popup is
 * live; keep them cheap and pure.
 */
export interface AttributeConfig {
  /**
   * Display name for shortcut rows and undo labels ("Due"). Defaults to the
   * capitalized attribute name.
   */
  title?: string
  /**
   * Declared value type — purely declarative, carried through
   * {@link AttributeInfo} so other extensions read and write the value the
   * same way. Default 'string'. A 'flag' attribute is valueless:
   * registering one with `standardValues`, `values`, `parse`, or `list` is
   * rejected.
   */
  type?: AttributeType
  /**
   * Single-character token alias: `<sigil>text` at the end of a row's text
   * is values mode for this attribute (`^fri` ≡ `@due:fri`). Must not be a
   * letter, digit, whitespace, `@`, `:`, or the reserved `#`. First
   * registration wins a contested sigil.
   */
  sigil?: string
  /**
   * Quick effects for the bare `@` popup, grouped above the attribute
   * names. Built fresh per popup — date-relative values roll over.
   */
  shortcuts?: () => AttributeShortcut[]
  /**
   * The attribute's small canonical value set ("1"/"2"/"3" for priority).
   * Static — it travels with the definition (`AttributeInfo`), so the
   * built-in catch-all badge's menu offers these as pick rows, and completion
   * offers them ahead of `values(pattern)`. Use `values` instead for
   * dynamic or open-ended suggestion sets.
   */
  standardValues?: AttributeValue[]
  /**
   * Value suggestions given the typed pattern (may be empty — `@due:` shows
   * them all). Merged above the values already used in the document,
   * deduplicated by committed value.
   */
  values?: (pattern: string) => AttributeValue[]
  /**
   * Parse free text into a value ("next fri" → 2026-07-24). A successful
   * parse backs the popup's fallback row ("Due → Fri, Jul 24") in place of
   * the literal `Set name = text`; return undefined when the text doesn't
   * resolve.
   */
  parse?: (text: string) => AttributeParseResult | undefined
  /**
   * Whether the built-in catch-all badge may render this attribute as a
   * generic `name: value` badge when no dedicated badge does. Default true.
   * Set false when your extension presents the attribute itself (a
   * dedicated `bike.badge`, or row styling like `done`) — an EXPLICIT
   * opt-out; registering a definition alone never changes rendering.
   */
  defaultBadge?: boolean
  /**
   * `standardValues` is the COMPLETE legal set: completion drops the
   * literal `Set name = text` fallback (a successful `parse` still backs
   * it), and sharing extensions may exhaustively switch on the values.
   * Default false.
   */
  strict?: boolean
  /**
   * The value is a comma-separated list. The convention readers and writers
   * agree on: split on ',', trim each item, join with ','. Completion
   * disables its ','-chain commit in values mode so commas are typable.
   * Default false.
   */
  list?: boolean
  /**
   * Present ⇒ a bare valueless `@name` is meaningful, displayed with this
   * label ("Soon" for due, "Done" for done). Names completion's bare-commit
   * row and the built-in catch-all badge's valueless rendering.
   */
  emptyLabel?: string
  /** One-line documentation, surfaced through {@link AttributeInfo}. */
  description?: string
}

/** A registered definition snapshot, as reported by `bike.observeAttributes`. */
export interface AttributeInfo {
  name: string
  title: string
  type: AttributeType
  strict: boolean
  list: boolean
  emptyLabel?: string
  description?: string
  defaultBadge: boolean
  standardValues: AttributeValue[]
}
