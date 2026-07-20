/// <reference path="./session.d.ts" />
/// <reference path="./drop.d.ts" />

declare module '*.css' {}

declare const bike: import('../core/bike-globals').BikeUtilityGlobals & {
  /**
   * Programmatic access to the same outline/editor automation the `bike`
   * command-line tool and MCP server expose — read, observe, and mutate open
   * outlines from a DOM extension. Methods return Promises; `observe*` methods
   * stream snapshots until disposed.
   *
   * @example
   * ```typescript
   * const outlines = await bike.session.getOutlines()
   * const sub = await bike.session.observeOutline({ path: '//task' }, doc => render(doc.root))
   * // sub.dispose() // stop streaming (also auto-disposed when the script unloads)
   * ```
   */
  readonly session: BikeSession

  /**
   * Build a `bike-attachment://` URL string serving an attachment (embed
   * asset) of an open outline — usable directly in `<img src>` and with
   * `fetch()`.
   *
   * An app context handing srcs to its DOM half should send the outline
   * root's persistent id along (`outline.root.ensuredPersistentId`) so the
   * DOM side can build these URLs.
   *
   * @param outlineId - The outline's persistent id (`SessionOutline.persistentId`).
   * @param src - The embed src (e.g. `'assets/photo.png'`).
   * @returns A `bike-attachment://` URL string.
   */
  attachmentURL(outlineId: OutlineId, src: string): string
}
