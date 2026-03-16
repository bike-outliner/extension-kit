/** Defines a test suite. */
declare function describe(name: string, fn: () => void): void

/** Defines a test case within a suite. */
declare function it(name: string, fn: () => void | Promise<void>): void

/** The extension's AppExtensionContext, available in tests. */
declare const context: import('./bike').AppExtensionContext

/** Asserts that a condition is truthy. */
declare function assert(condition: unknown, message?: string): void
declare namespace assert {
  /** Asserts strict equality (===). */
  function equal(actual: unknown, expected: unknown, message?: string): void
  /** Asserts strict inequality (!==). */
  function notEqual(actual: unknown, expected: unknown, message?: string): void
  /** Asserts that the function throws. */
  function throws(fn: () => void, message?: string): void
  /** Asserts that the async function rejects. */
  function rejects(fn: () => Promise<unknown>, message?: string): Promise<void>
}
