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
