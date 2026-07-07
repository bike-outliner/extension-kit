/// <reference path="./session.d.ts" />

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
}
