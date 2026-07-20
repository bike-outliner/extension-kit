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
   * Includes region and calendar extensions from System Preferences.
   *
   * @example
   * ```typescript
   * new Date().toLocaleDateString(bike.systemLocale)
   * new Intl.DateTimeFormat(bike.systemLocale, { dateStyle: "long" }).format(new Date())
   * ```
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

/**
 * Members of the `bike` global shared by the app and DOM contexts
 * (in addition to {@link BikeCommonGlobals}).
 */
export interface BikeUtilityGlobals extends BikeCommonGlobals {
  /**
   * Extension defaults, backed by UserDefaults with the prefix
   * `bike.ext.<extensionId>.`.
   *
   * @example
   * ```typescript
   * const value = bike.defaults.get('theme')
   * bike.defaults.set('theme', 'dark')
   * bike.defaults.observe('theme', (v) => { console.log('changed:', v) })
   * ```
   */
  readonly defaults: JSONStore

  /**
   * Formats a Date object using a pattern string (date-fns / CLDR-inspired).
   *
   * @see https://date-fns.org/docs/format
   *
   * @example
   * ```typescript
   * bike.formatDate(new Date(), 'yyyy-MM-dd')       // "2026-04-09"
   * bike.formatDate(new Date(), 'MMMM d, yyyy')     // "April 9, 2026"
   * ```
   */
  formatDate(date: Date, pattern: string): string

  /** Returns a URL string for the named SF Symbol. */
  symbolURL(name: SFSymbolName, options?: SFSymbolOptions): string
}
