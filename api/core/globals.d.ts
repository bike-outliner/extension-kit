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
 * The user's macOS system locale as a BCP 47 language tag
 * (e.g. "en-US", "en-JP-u-ca-japanese", "de-DE").
 *
 * Includes region and calendar extensions from System Preferences.
 * Pass to JavaScript's built-in formatting APIs:
 *
 * @example
 * ```typescript
 * new Date().toLocaleDateString(systemLocale)
 * new Intl.DateTimeFormat(systemLocale, { dateStyle: "long" }).format(new Date())
 * (1234.56).toLocaleString(systemLocale)
 * ```
 */
declare const systemLocale: string
