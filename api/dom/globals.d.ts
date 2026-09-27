/// <reference path="./session.d.ts" />
/// <reference path="./drop.d.ts" />

declare module '*.css' {}

declare const bike: import('../core/bike-globals').BikeUtilityGlobals & {
  /** The outline/editor automation the `bike` CLI and MCP server expose. */
  readonly session: BikeSession

  /**
   * `bike-attachment://` URL for an open outline's attachment, usable in
   * `<img src>` and `fetch()`.
   * @param outlineId The outline root's persistent id.
   * @param src The embed src, e.g. `'assets/photo.png'`.
   */
  attachmentURL(outlineId: OutlineId, src: string): string
}
