import { JSONStore } from './json'

/**
 * An SF Symbol name, e.g. `'star'`, `'chevron.left'`, `'calendar'`.
 * Browse the catalog in Apple's SF Symbols app.
 */
export type SFSymbolName = string

/** Options for rendering an SF Symbol. */
export interface SFSymbolOptions {
  weight?: 'ultralight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'
  scale?: 'small' | 'medium' | 'large'
}

/**
 * Members of the `bike` global shared by every extension context
 * (app, DOM, and style).
 */
export interface BikeCommonGlobals {
  /**
   * The user's macOS system locale as a BCP 47 language tag (e.g. "en-US",
   * "en-JP-u-ca-japanese", "de-DE").
   *
   * Includes region and calendar extensions from System Preferences. Pass it
   * to the platform `Intl` APIs and `toLocale*` methods.
   */
  readonly systemLocale: string

  /**
   * The user's preferred first day of the week from macOS System Preferences,
   * as a JavaScript day number (0 = Sunday, 1 = Monday, ..., 6 = Saturday).
   */
  readonly systemFirstWeekday: number

  /**
   * Returns a `bike-extension://` URL for a file in this extension's folder.
   *
   * @param path - Relative path within the extension folder (e.g., "images/icon.png")
   */
  extensionURL(path: string): string
}

/** A decoded `date` wire value: the instant plus whether the wire carried a
 * time (a bare `YYYY-MM-DD` resolves to LOCAL midnight, hasTime false). */
export interface DecodedDate {
  date: Date
  hasTime: boolean
}

/** A decoded `recurrence` wire value. */
export interface DecodedRecurrence {
  /** Repetition count; absent means repeat forever. */
  count?: number
  /** The period as an ISO duration wire string ("P1W"). */
  interval: string
  /** Weekday tokens from the non-standard `R/P1W:mon,wed` extension. */
  weekdays: string[]
}

/**
 * Members of the `bike` global shared by the app and DOM contexts
 * (in addition to {@link BikeCommonGlobals}).
 */
export interface BikeUtilityGlobals extends BikeCommonGlobals {
  /**
   * Extension defaults, backed by UserDefaults with the prefix
   * `bike.ext.<extensionId>.`.
   */
  readonly defaults: JSONStore

  /**
   * Formats a Date object using a pattern string (date-fns / CLDR-inspired,
   * e.g. `'yyyy-MM-dd'`, `'MMMM d, yyyy'`).
   *
   * @see https://date-fns.org/docs/format
   */
  formatDate(date: Date, pattern: string): string

  /** Returns a URL string for the named SF Symbol. */
  symbolURL(name: SFSymbolName, options?: SFSymbolOptions): string

  /**
   * Encode a typed JS value into an attribute's WIRE string — the
   * machine-facing counterpart of `parseValue` (which resolves human free
   * text). Locale-free: the wire grammar is the canonical encoding
   * documented on the attribute types in `bike/app`.
   *
   * Returns undefined for an unknown type or an unencodable value — never
   * throws. Durations are amounts of time in seconds (no weeks in the
   * output; fixed 365/30-day year/month approximations). A `date` encodes
   * its LOCAL calendar day by default; `{ time: true }` emits the full
   * ISO-8601 UTC instant without fractional seconds (the same stamp shape
   * native Toggle Done writes).
   */
  encodeValue(type: 'date', value: Date, options?: { time?: boolean }): string | undefined
  encodeValue(type: 'duration' | 'time', value: number): string | undefined
  encodeValue(type: 'number', value: number): string | undefined
  encodeValue(type: 'boolean', value: boolean): string | undefined
  encodeValue(type: 'text' | 'choice', value: string): string | undefined
  encodeValue(type: 'interval', value: { start: Date; end: Date }): string | undefined
  encodeValue(type: 'recurrence', value: { count?: number; interval: string; weekdays?: string[] }): string | undefined

  /**
   * Decode an attribute's WIRE string into a typed JS value — the
   * machine-facing counterpart of `displayValue` (which formats a localized
   * label). STRICT-CANONICAL: reads what documents store, not the lenient
   * variants `parseValue` accepts from typed text (unpadded `2026-7-1` is
   * rejected; `2026-13-40` is not a real day).
   *
   * Returns undefined for an unknown type or unparseable wire — never
   * throws. A bare `YYYY-MM-DD` resolves to LOCAL midnight with
   * `hasTime: false`; a timed value carries its own zone. Durations decode
   * to seconds with the same fixed conversions the query language's
   * `duration()` uses.
   */
  decodeValue(type: 'date', wire: string): DecodedDate | undefined
  decodeValue(type: 'duration' | 'time' | 'number', wire: string): number | undefined
  decodeValue(type: 'boolean', wire: string): boolean | undefined
  decodeValue(type: 'text' | 'choice', wire: string): string | undefined
  decodeValue(type: 'interval', wire: string): { start: DecodedDate; end: DecodedDate } | undefined
  decodeValue(type: 'recurrence', wire: string): DecodedRecurrence | undefined
}
