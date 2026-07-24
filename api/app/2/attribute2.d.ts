/**
 * Attributes v2 — the shared value-type system.
 *
 * `bike.attribute(name, config)` declares how the editor treats attribute
 * `name` EVERYWHERE it appears: palette completion and its value stage,
 * standalone pickers (`editor.showPicker`), badges (the built-in catch-all
 * and the default badge menu), summaries, and — eventually — query
 * coercion. One declaration, many consumers.
 *
 * Division of labor:
 *
 * - The HOST implements, once and natively, everything derivable from a
 *   type: wire-format parsing and canonicalization, natural-language input
 *   ("next fri", "2h 30m", "3pm"), localized display labels ("Today",
 *   "2h 3m"), and standard suggestions (Today / Tomorrow / weekdays, common
 *   durations, a choice's options). Extensions never reimplement these.
 * - A DEFINITION adds only what the host can't know: the type, its
 *   constraints (the facet fields), and optional domain `shortcuts` and
 *   extra `suggestions`.
 *
 * Registration is CONFIGURATION, not behavior: registering a definition
 * never changes rendering by itself — behaviors are explicit flags
 * (`defaultBadge`). Consumers reconstruct an attribute's complete behavior
 * from {@link AttributeInfo} (via `bike.observeAttributes`), a lossless,
 * defaults-resolved snapshot of the registered config.
 */

/**
 * The attribute value types. Each member's WIRE ENCODING — the canonical
 * string stored in the row attribute — is defined here and NOWHERE ELSE;
 * pickers, badges, summaries, and queries all read and write these
 * encodings. (`showPicker`'s `kind` is this same union — see picker2.)
 *
 * - `'text'` — any text, trimmed.
 * - `'flag'` — VALUELESS: present with the empty string, or absent
 *   (`@done`). There is no other legal value.
 * - `'boolean'` — `"true"` / `"false"`. Unlike a flag, false is a real
 *   value distinct from the attribute being absent.
 * - `'number'` — decimal via `String(n)`, integers without `.0` ("2",
 *   "3.5").
 * - `'measurement'` — `"<number> <unit symbol>"` ("5 kg", "72 °F",
 *   "3.5 mi"); the unit must belong to the declared
 *   {@link MeasurementFacet.dimension}.
 * - `'date'` — `YYYY-MM-DD` (a local calendar day), or a full ISO-8601 UTC
 *   timestamp when timed ("2026-07-24T17:00:00Z"). Input also accepts ISO
 *   week (`YYYY-Www[-D]`) and ordinal (`YYYY-DDD`) forms; canonicalization
 *   reduces them.
 * - `'time'` — 24-hour `HH:mm:ss` (`HH:mm` accepted on input).
 * - `'duration'` — an ISO-8601 duration ("PT30M", "P1DT2H30M", "P2W").
 * - `'interval'` — `YYYY-MM-DD/YYYY-MM-DD` (start ≤ end; `/` is the ISO
 *   interval separator). Input also accepts `<start>/<duration>`,
 *   `<duration>/<end>`, and datetime endpoints; canonicalization reduces
 *   to the ordered day pair.
 * - `'recurrence'` — an ISO-8601 repeating period: `R/P1D`, `R5/P2W` (`R/`
 *   with no count is unbounded), plus the NON-STANDARD weekly-weekday
 *   extension `R/P1W:mon,wed` (weekdays in canonical mon…sun order).
 * - `'rating'` — decimal `"1"`…max; zero is not a rating (clearing removes
 *   the attribute).
 * - `'color'` — lowercase `#rrggbb`, or `#rrggbbaa` when not fully opaque.
 * - `'choice'` — one of the declared choices' `value`s verbatim (any
 *   trimmed text when {@link ChoiceFacet.open}).
 *
 * LIST attributes ({@link AttributeCommon.list}) wrap a base encoding as a
 * comma-separated list — split on `,`, trim each item, join with `,`.
 * Registration rejects `list` for `flag` (valueless) and for types whose
 * encoding can itself contain a comma (`recurrence`).
 */
export type AttributeType =
  | 'text'
  | 'flag'
  | 'boolean'
  | 'number'
  | 'measurement'
  | 'date'
  | 'time'
  | 'duration'
  | 'interval'
  | 'recurrence'
  | 'rating'
  | 'color'
  | 'choice'

/** The physical dimensions a `measurement` attribute can declare. */
export type MeasurementDimension =
  | 'length'
  | 'mass'
  | 'volume'
  | 'area'
  | 'temperature'
  | 'speed'
  | 'acceleration'
  | 'angle'
  | 'pressure'
  | 'energy'
  | 'power'
  | 'frequency'
  | 'information'

/** The components of an ISO-8601 duration, in canonical order. */
export type DurationComponent =
  | 'years'
  | 'months'
  | 'weeks'
  | 'days'
  | 'hours'
  | 'minutes'
  | 'seconds'

/** The segments of a time-of-day editor. */
export type TimeField = 'hour' | 'minute' | 'second'

/**
 * A named wire value — the ONE row shape used everywhere a value is offered
 * or displayed: choice options, suggestions, picker rows, shortcuts.
 */
export interface AttributeValue {
  /** Display text, fuzzy-matched ("Friday"). */
  name: string
  /** The canonical wire value committed when picked. */
  value: string
  /** Right-aligned dimmed detail ("Jul 24"). Display only — not matched. */
  detail?: string
}

/** A quick name+value effect offered under the bare `@` popup ("Due Tomorrow"). */
export interface AttributeShortcut extends AttributeValue {
  /** Stable id within this attribute's shortcuts; defaults to `name`. */
  id?: string
}

/**
 * A successful free-text parse: the canonical wire `value` plus its human
 * `label` ("Fri, Jul 24"). What `bike.parseAttribute` and a picker's
 * resolving fallback row report.
 */
export interface AttributeParseResult {
  value: string
  label: string
}

/**
 * The suggestion callback contract, shared by attribute definitions and
 * ad-hoc pickers: pattern → suggestion rows, sync or async (`signal` aborts
 * a superseded async call). An empty pattern means "the unfiltered list".
 */
export type AttributeSuggest = (
  pattern: string,
  signal: AbortSignal,
) => AttributeValue[] | Promise<AttributeValue[]>

// MARK: - Facets
//
// A facet is a type's constraint/parameter set, shared VERBATIM between the
// attribute config variant (`NumberAttribute`) and the picker options
// variant (`NumberPickerOptions` in picker2) — so an attribute-bound picker
// derives its embedded editor completely from the definition, and the two
// surfaces cannot drift.

/** `text` parameters. */
export interface TextFacet {
  /** Placeholder shown in an empty text field. */
  placeholder?: string
}

/** `number` parameters. */
export interface NumberFacet {
  /** Smallest accepted value (inclusive). */
  min?: number
  /** Largest accepted value (inclusive). */
  max?: number
  /** Up/Down step increment in the number editor. Default 1. */
  step?: number
  /** Restrict accepted values to integers. Default false. */
  integer?: boolean
}

/** `measurement` parameters. */
export interface MeasurementFacet {
  /** The physical dimension; the value's unit must belong to it. */
  dimension: MeasurementDimension
  /**
   * Default unit symbol ("kg") — assumed when input omits a unit, and the
   * unit summaries convert into. Omit for the dimension's base unit.
   */
  unit?: string
  /** Smallest accepted magnitude (inclusive, in the value's own unit). */
  min?: number
  /** Largest accepted magnitude (inclusive, in the value's own unit). */
  max?: number
}

/** `date` parameters. */
export interface DateFacet {
  /**
   * Whether values carry a time of day: `'optional'` (either form,
   * default), `'required'` (always the timed form), `'never'` (day only —
   * canonicalization strips any time).
   */
  time?: 'optional' | 'required' | 'never'
}

/** `time` parameters. */
export interface TimeFacet {
  /** Which segments the time editor shows. Default hour+minute. */
  fields?: TimeField[]
}

/** `duration` parameters. */
export interface DurationFacet {
  /** Which components the duration editor shows, in canonical order. Default all seven. */
  components?: DurationComponent[]
}

/** `rating` parameters. */
export interface RatingFacet {
  /** The top rating. Default 5. */
  max?: number
}

/** `color` parameters. */
export interface ColorFacet {
  /**
   * Swatches to offer, as hex encodings (invalid entries are dropped).
   * Omit for a default system palette.
   */
  presets?: string[]
}

/** `choice` parameters. */
export interface ChoiceFacet {
  /**
   * The legal values, in display order. A bare string is shorthand for
   * `{ name: s, value: s }`. Must be non-empty.
   */
  choices: Array<string | AttributeValue>
  /**
   * Values outside `choices` are also legal (free text). Default false —
   * the choices are the complete set.
   */
  open?: boolean
}

// MARK: - Definition

/** The members every attribute definition shares. */
interface AttributeCommon {
  /**
   * Display name for shortcut rows, picker headers, and undo labels
   * ("Due"). Defaults to the capitalized attribute name.
   */
  title?: string
  /** One-line documentation, surfaced through {@link AttributeInfo}. */
  description?: string
  /**
   * Present ⇒ a bare valueless `@name` is meaningful, displayed with this
   * label ("Soon" for due). For a `flag` attribute this is the ON label
   * ("Done"); it defaults to `title`.
   */
  emptyLabel?: string
  /**
   * Whether the built-in catch-all badge may render this attribute (as a
   * type-aware `name: value` badge) when no dedicated badge does. Default
   * true. Set false when your extension presents the attribute itself — an
   * EXPLICIT opt-out; registering a definition alone never changes
   * rendering.
   */
  defaultBadge?: boolean
  /**
   * The value is a comma-separated LIST of the base type (see
   * {@link AttributeType}). For `choice` this makes the picker
   * multi-select. Default false. Rejected for `flag` and `recurrence`.
   */
  list?: boolean
  /**
   * Quick effects for the bare `@` popup, grouped above the attribute
   * names. Built fresh per popup — date-relative values roll over. The
   * host already offers standard per-type entries; these ADD domain ones.
   */
  shortcuts?: () => AttributeShortcut[]
  /**
   * Extra value suggestions, merged ABOVE the host's built-in per-type
   * suggestions and the values already used in the document (deduplicated
   * by wire value). Rejected for `flag`.
   */
  suggestions?: AttributeSuggest
  /**
   * Who filters `suggestions` against the typed pattern: `'window'`
   * (default) fuzzy-filters your rows like any others; `'provider'` means
   * you already filtered (a server search) so the window must not.
   */
  filter?: 'provider' | 'window'
}

export interface TextAttribute extends AttributeCommon, TextFacet {
  /** `text` is the default type. */
  type?: 'text'
}

export interface FlagAttribute extends AttributeCommon {
  type: 'flag'
}

export interface BooleanAttribute extends AttributeCommon {
  type: 'boolean'
}

export interface NumberAttribute extends AttributeCommon, NumberFacet {
  type: 'number'
}

export interface MeasurementAttribute extends AttributeCommon, MeasurementFacet {
  type: 'measurement'
}

export interface DateAttribute extends AttributeCommon, DateFacet {
  type: 'date'
}

export interface TimeAttribute extends AttributeCommon, TimeFacet {
  type: 'time'
}

export interface DurationAttribute extends AttributeCommon, DurationFacet {
  type: 'duration'
}

export interface IntervalAttribute extends AttributeCommon {
  type: 'interval'
}

export interface RecurrenceAttribute extends AttributeCommon {
  type: 'recurrence'
}

export interface RatingAttribute extends AttributeCommon, RatingFacet {
  type: 'rating'
}

export interface ColorAttribute extends AttributeCommon, ColorFacet {
  type: 'color'
}

export interface ChoiceAttribute extends AttributeCommon, ChoiceFacet {
  type: 'choice'
}

/**
 * Configuration for `bike.attribute(name, config)`, discriminated by
 * `type` (default `'text'`). Invalid configs are REJECTED at registration
 * (throw): `list` on `flag`/`recurrence`, `suggestions` on `flag`, empty
 * `choices`, `min` > `max`, rating `max` < 1.
 */
export type AttributeConfig =
  | TextAttribute
  | FlagAttribute
  | BooleanAttribute
  | NumberAttribute
  | MeasurementAttribute
  | DateAttribute
  | TimeAttribute
  | DurationAttribute
  | IntervalAttribute
  | RecurrenceAttribute
  | RatingAttribute
  | ColorAttribute
  | ChoiceAttribute

// MARK: - Info

/** The resolved members every {@link AttributeInfo} carries. */
export interface AttributeInfoCommon {
  name: string
  title: string
  description?: string
  emptyLabel?: string
  defaultBadge: boolean
  list: boolean
}

/**
 * A registered definition snapshot, as reported by
 * `bike.observeAttributes` — a LOSSLESS, defaults-resolved image of the
 * config: every facet field is present with its default filled in, and
 * `choices` strings are normalized to {@link AttributeValue}s. Switch on
 * `type` to recover exactly the facet the definition declared; nothing a
 * consumer needs (a derived picker, a badge menu, a summary coercion) is
 * dropped.
 */
export type AttributeInfo = AttributeInfoCommon &
  (
    | ({ type: 'text' } & TextFacet)
    | { type: 'flag' }
    | { type: 'boolean' }
    | ({ type: 'number' } & NumberFacet & { step: number; integer: boolean })
    | ({ type: 'measurement' } & MeasurementFacet)
    | ({ type: 'date' } & Required<DateFacet>)
    | ({ type: 'time' } & { fields: TimeField[] })
    | ({ type: 'duration' } & { components: DurationComponent[] })
    | { type: 'interval' }
    | { type: 'recurrence' }
    | ({ type: 'rating' } & { max: number })
    | ({ type: 'color' } & ColorFacet)
    | ({ type: 'choice' } & { choices: AttributeValue[]; open: boolean })
  )
