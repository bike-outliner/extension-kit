declare global {
  const bike: {
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
   * @returns A `bike-extension://` URL string.
   */
  extensionURL(path: string): string
  }
}

export * from './geometry'
export * from './graphics'
export * from './editor-style'
export * from '../core/outline-path'
