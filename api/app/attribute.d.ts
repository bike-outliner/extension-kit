import { JSONValue } from '../core/json'

/**
 * Canonical wire encoding stored in the row attribute, per type:
 *
 * - text        any text, trimmed
 * - boolean     "true" / "false"
 * - number      decimal, integers without `.0` ("2", "3.5")
 * - date        YYYY-MM-DD, or an ISO-8601 UTC timestamp when timed
 * - time        24-hour HH:mm:ss (HH:mm accepted on input)
 * - duration    ISO-8601 ("PT30M", "P1DT2H30M"); D/H/M/S carry up to days,
 *               never weeks; authored Y/M/W are kept as written
 * - interval    YYYY-MM-DD/YYYY-MM-DD, start ≤ end
 * - recurrence  R[n]/P<interval>, plus the non-standard `R/P1W:mon,wed`
 * - choice      a declared choice's `value` verbatim
 *
 * Input also accepts ISO week and ordinal dates and `<start>/<duration>`
 * intervals.
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

/** In canonical order. */
export type DurationComponent =
  | 'years'
  | 'months'
  | 'weeks'
  | 'days'
  | 'hours'
  | 'minutes'
  | 'seconds'

export type TimeField = 'hour' | 'minute' | 'second'

/** A named wire value, used wherever values are offered. */
export interface AttributeChoice {
  /** Displayed and fuzzy-matched. */
  name: string
  /** Canonical wire value. */
  value: string
  /** Dimmed, not matched, e.g. "Jul 24". */
  detail?: string
  /**
   * Also offer in the attribute's built-in menu. Read only from the unfiltered
   * suggestion list; ignored by boolean and choice attributes.
   */
  menu?: boolean
}

/** Canonical wire value and display label. */
export interface AttributeParseResult {
  value: string
  label: string
}

/** Called synchronously per keystroke. An empty pattern asks for the unfiltered list. */
export type AttributeSuggest = (pattern: string) => AttributeChoice[]

// MARK: - Facets (per-type options shared by attributes and pickers)

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

interface AttributeCommon {
  /** Default the capitalized attribute name. */
  title?: string
  /** One line. */
  description?: string
  /** When set, a valueless `@name` is valid and displays this label. */
  emptyLabel?: string
  /** Render with the built-in catch-all badge. Default true. */
  defaultBadge?: boolean
  /** Listed above the built-in suggestions. */
  suggestions?: AttributeSuggest
  /**
   * Arbitrary JSON echoed back in {@link AttributeInfo}. Known keys:
   *
   * - `calendar: false`: not shown by the calendar extension.
   * - `user: false`: written only by code. Never suggested, logged, or listed
   *   in the Attributes settings table; still shown on rows and removable.
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

/** For `bike.attribute(name, config)`. */
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

export interface AttributeInfoCommon {
  name: string
  title: string
  description?: string
  emptyLabel?: string
  defaultBadge: boolean
  metadata: Record<string, JSONValue>
}

/** Definition with defaults resolved. */
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
