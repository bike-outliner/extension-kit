/**
 * The shared value-type system.
 *
 * `bike.attribute(name, config)` declares how the editor treats attribute
 * `name` in the Attributes Editor, in pickers, and in badges.
 */

import { JSONValue } from '../core/json'

/**
 * The attribute value types. Each member's WIRE ENCODING — the canonical string
 * stored in the row attribute — pickers, badges, summaries, and queries all
 * read and write these.
 *
 * - text        any text, trimmed
 * - boolean     "true" / "false"
 * - number      decimal, integers without `.0` ("2", "3.5")
 * - date        YYYY-MM-DD, or an ISO-8601 UTC timestamp when timed
 * - time        24-hour HH:mm:ss (HH:mm accepted on input)
 * - duration    an ISO-8601 duration ("PT30M", "P1DT2H30M", "P2W")
 * - interval    YYYY-MM-DD/YYYY-MM-DD, start ≤ end
 * - recurrence  R[n]/P<interval>, plus the non-standard `R/P1W:mon,wed`
 * - choice      a declared choice's `value` verbatim
 *
 * Input is more lenient than the canonical form (ISO week and ordinal dates,
 * `<start>/<duration>` intervals); canonicalization reduces it.
 */
export type AttributeType =
  | 'text'
  | 'boolean'
  | 'number'
  | 'date'
  | 'time'
  | 'duration'
  | 'interval'
  | 'recurrence'
  | 'choice'

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

/** A named wire value — the one row shape used wherever a value is offered. */
export interface AttributeChoice {
  /** Display text, fuzzy-matched ("Friday"). */
  name: string
  /** The canonical wire value committed when picked. */
  value: string
  /** Dimmed detail ("Jul 24"). Display only — not matched. */
  detail?: string
  /**
   * Also offer this value in the attribute's built-in menu (badge click, row
   * context menu). Meaningful only on the unfiltered suggestion list; boolean
   * and choice menus derive their own rows and ignore it.
   */
  menu?: boolean
}

/** A successful free-text parse: the canonical wire value plus its human label. */
export interface AttributeParseResult {
  value: string
  label: string
}

/**
 * Pattern → suggestion rows, called synchronously per keystroke. An empty
 * pattern means the unfiltered list — built fresh per call, so date-relative
 * values roll over.
 */
export type AttributeSuggest = (pattern: string) => AttributeChoice[]

// MARK: - Facets
//
// A facet is a type's constraint/parameter set, shared between the attribute
// configuration and the picker options.

export interface TextFacet {
  placeholder?: string
}

export interface NumberFacet {
  min?: number
  max?: number
  step?: number
  integer?: boolean
}

export interface DateFacet {
  time?: 'optional' | 'required' | 'never'
}

export interface TimeFacet {
  fields?: TimeField[]
}

export interface DurationFacet {
  components?: DurationComponent[]
}

export interface ChoiceFacet {
  choices: AttributeChoice[]
  open?: boolean
}

// MARK: - Definition

/** The members every attribute definition shares. */
interface AttributeCommon {
  /** Display name ("Due"). Defaults to the capitalized attribute name. */
  title?: string
  /** One-line documentation, surfaced through {@link AttributeInfo}. */
  description?: string
  /** Present ⇒ a bare valueless `@name` is meaningful, displayed with this label. */
  emptyLabel?: string
  /** Let the built-in catch-all badge render this attribute. Default true. */
  defaultBadge?: boolean
  /** Extra value suggestions, merged above the host's built-in ones. */
  suggestions?: AttributeSuggest
  /**
   * Free-form JSON the host stores and echoes back through
   * {@link AttributeInfo} — consumers define their own keys. Known ones:
   *
   * - `calendar: false` keeps a date attribute off the calendar extension.
   * - `user: false` says this is a field your extension writes and reads, not
   *   one anyone sets by hand (the `log-*` fields on a log entry, the clock's
   *   duration). Such a field is never suggested, never recorded in a row's
   *   log, and does not appear in the Attributes settings table at all. Rows
   *   that carry it still show it, and it stays removable.
   */
  metadata?: Record<string, JSONValue>
}

export interface TextAttribute extends AttributeCommon, TextFacet {
  type: 'text'
}

export interface BooleanAttribute extends AttributeCommon {
  type: 'boolean'
}

export interface NumberAttribute extends AttributeCommon, NumberFacet {
  type: 'number'
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

export interface ChoiceAttribute extends AttributeCommon, ChoiceFacet {
  type: 'choice'
}

/** Configuration for `bike.attribute(name, config)` */
export type AttributeConfig =
  | TextAttribute
  | BooleanAttribute
  | NumberAttribute
  | DateAttribute
  | TimeAttribute
  | DurationAttribute
  | IntervalAttribute
  | RecurrenceAttribute
  | ChoiceAttribute

// MARK: - Info

/** The resolved members every {@link AttributeInfo} carries. */
export interface AttributeInfoCommon {
  name: string
  title: string
  description?: string
  emptyLabel?: string
  defaultBadge: boolean
  metadata: Record<string, JSONValue>
}

/** A lossless, defaults-resolved definition snapshot. Switch on `type` for the facet. */
export type AttributeInfo = AttributeInfoCommon &
  (
    | ({ type: 'text' } & TextFacet)
    | { type: 'boolean' }
    | ({ type: 'number' } & NumberFacet & { step: number; integer: boolean })
    | ({ type: 'date' } & Required<DateFacet>)
    | ({ type: 'time' } & { fields: TimeField[] })
    | ({ type: 'duration' } & { components: DurationComponent[] })
    | { type: 'interval' }
    | { type: 'recurrence' }
    | ({ type: 'choice' } & { choices: AttributeChoice[]; open: boolean })
  )
