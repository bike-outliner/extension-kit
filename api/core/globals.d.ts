/**
 * The user's macOS system locale as a BCP 47 language tag (e.g. "en-US",
 * "en-JP-u-ca-japanese", "de-DE").
 *
 * Includes region and calendar extensions from System Preferences. These
 * settings aren't otherwise accessible to web content, so this is provided as a
 * global variable for convenience. Pass to JavaScript's built-in formatting
 * APIs:
 *
 * @example
 * ```typescript
 * new Date().toLocaleDateString(systemLocale)
 * new Intl.DateTimeFormat(systemLocale, { dateStyle: "long" }).format(new Date())
 * (1234.56).toLocaleString(systemLocale)
 * ```
 */
declare const systemLocale: string

/**
 * The user's preferred first day of the week from macOS System Preferences,
 * as a JavaScript day number (0 = Sunday, 1 = Monday, ..., 6 = Saturday).
 *
 * Matches the convention used by `Date.getDay()`.
 */
declare const systemFirstWeekday: number

/**
 * Extension defaults, backed by UserDefaults with the prefix
 * `bike.ext.<extensionId>.`.
 *
 * @example
 * ```typescript
 * const value = defaults.get('theme')
 * defaults.set('theme', 'dark')
 * defaults.observe('theme', (v) => { console.log('changed:', v) })
 * ```
 */
declare const defaults: import('./json').JSONStore

/**
 * Returns a `bike-extension://` URL for a file in this extension's folder.
 *
 * Use the returned URL in `new Image()` (style context), `<img src>` (DOM
 * context), `fetch()`, `postMessage`, or anywhere a URL string is accepted.
 *
 * @param path - Relative path within the extension folder (e.g., "images/icon.png")
 * @returns A `bike-extension://` URL string.
 */
declare function extensionURL(path: string): string

/**
 * Formats a Date object using a pattern string (date-fns / CLDR-inspired).
 *
 * Common tokens: `yyyy` (year), `MM` (month), `dd` (day),
 * `HH` (24h hour), `mm` (minute), `ss` (second).
 *
 * @see https://date-fns.org/docs/format
 *
 * @example
 * ```typescript
 * formatDate(new Date(), 'yyyy-MM-dd')       // "2026-04-09"
 * formatDate(new Date(), 'MMMM d, yyyy')     // "April 9, 2026"
 * formatDate(new Date(), 'HH:mm')            // "14:30"
 * ```
 */
declare function formatDate(date: Date, pattern: string): string