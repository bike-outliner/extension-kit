import { JSONStore } from './json'

/** SF Symbol name, e.g. `'chevron.left'`. */
export type SFSymbolName = string

export interface SFSymbolOptions {
  weight?: 'ultralight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'
  scale?: 'small' | 'medium' | 'large'
}

/** `bike` members in app, DOM, and style contexts. */
export interface BikeCommonGlobals {
  /**
   * macOS locale as a BCP 47 tag including region and calendar extensions,
   * e.g. "en-JP-u-ca-japanese".
   */
  readonly systemLocale: string

  /** macOS first weekday, 0 = Sunday … 6 = Saturday. */
  readonly systemFirstWeekday: number

  /**
   * `bike-extension://` URL for a file in this extension's folder.
   * @param path Relative, e.g. "images/icon.png".
   */
  extensionURL(path: string): string
}

/** A bare `YYYY-MM-DD` decodes to local midnight with `hasTime` false. */
export interface DecodedDate {
  date: Date
  hasTime: boolean
}

/** A decoded `recurrence` wire value. */
export interface DecodedRecurrence {
  /** Absent repeats forever. */
  count?: number
  /** ISO duration, e.g. "P1W". */
  interval: string
  /** From the non-standard `R/P1W:mon,wed` extension. */
  weekdays: string[]
}

/** `bike` members in app and DOM contexts. */
export interface BikeUtilityGlobals extends BikeCommonGlobals {
  /** UserDefaults with prefix `bike.ext.<extensionId>.`. */
  readonly defaults: JSONStore

  /**
   * date-fns style pattern, e.g. `'yyyy-MM-dd'`. Week tokens `w`, `e`, `c`,
   * `Y` use {@link systemFirstWeekday}; ISO `I` weeks start Monday.
   * @see https://date-fns.org/docs/format
   */
  formatDate(date: Date, pattern: string): string

  symbolURL(name: SFSymbolName, options?: SFSymbolOptions): string

  /**
   * Encodes a JS value as a canonical, locale-free wire string. Returns
   * undefined for an unknown type or unencodable value; never throws.
   * Durations are seconds (output uses no weeks; years and months are 365 and
   * 30 days). A `date` encodes its local day; `{ time: true }` gives the UTC
   * instant without fractional seconds, the same stamp Toggle Done writes.
   */
  encodeValue(type: 'date', value: Date, options?: { time?: boolean }): string | undefined
  encodeValue(type: 'duration' | 'time', value: number): string | undefined
  encodeValue(type: 'number', value: number): string | undefined
  encodeValue(type: 'boolean', value: boolean): string | undefined
  encodeValue(type: 'text' | 'choice', value: string): string | undefined
  encodeValue(type: 'interval', value: { start: Date; end: Date }): string | undefined
  encodeValue(type: 'recurrence', value: { count?: number; interval: string; weekdays?: string[] }): string | undefined

  /**
   * Decodes a canonical wire string only; lenient forms `parseValue` accepts
   * (unpadded `2026-7-1`) and impossible dates return undefined, as do unknown
   * types. Never throws. Durations decode to seconds as query `duration()`
   * does.
   */
  decodeValue(type: 'date', wire: string): DecodedDate | undefined
  decodeValue(type: 'duration' | 'time' | 'number', wire: string): number | undefined
  decodeValue(type: 'boolean', wire: string): boolean | undefined
  decodeValue(type: 'text' | 'choice', wire: string): string | undefined
  decodeValue(type: 'interval', wire: string): { start: DecodedDate; end: DecodedDate } | undefined
  decodeValue(type: 'recurrence', wire: string): DecodedRecurrence | undefined
}
