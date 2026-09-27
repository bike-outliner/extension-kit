declare function describe(name: string, fn: () => void): void

declare function it(name: string, fn: () => void | Promise<void>): void

/** The extension's context. */
declare const context: import('./bike').AppExtensionContext

declare function assert(condition: unknown, message?: string): void
declare namespace assert {
  /** `===`. */
  function equal(actual: unknown, expected: unknown, message?: string): void
  /** `!==`. */
  function notEqual(actual: unknown, expected: unknown, message?: string): void
  function throws(fn: () => void, message?: string): void
  function rejects(fn: () => Promise<unknown>, message?: string): Promise<void>
}
