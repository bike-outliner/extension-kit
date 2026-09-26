import { JSONValue } from '../core/json'

declare global {
  /**
   * Partial Fetch API. The URL must match a `manifest.json` `host_permissions`
   * match pattern, e.g. `https://example.com/*`, `https://*.example.com/*`
   * (subdomains only, not example.com), `*://example.com/*` (any scheme).
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns
   * @requires `host_permissions` match URL
   */
  function fetch(input: string, options?: Options): Promise<Response>

  interface Options {
    readonly method?: string
    readonly headers?: Record<string, string>
    readonly body?: string | Uint8Array | DataView | ArrayBuffer
    readonly signal?: AbortSignal
  }

  interface Response {
    readonly ok: boolean
    readonly status: number
    readonly statusText: string
    readonly url: string
    readonly headers: Headers
    readonly body: ReadableStream<Uint8Array>
    readonly bodyUsed: boolean
    text(): Promise<string>
    json(): Promise<JSONValue | any>
    bytes(): Promise<Uint8Array>
    arrayBuffer(): Promise<ArrayBuffer>
  }

  /** Read-only subset of the Fetch API `Headers` interface. */
  interface Headers {
    get(name: string): string | null
    has(name: string): boolean
    forEach(callback: (value: string, name: string, headers: Headers) => void): void
    keys(): string[]
    values(): string[]
    entries(): [string, string][]
  }

  /** Controls an AbortSignal, e.g. to abort an in-flight `fetch`. */
  class AbortController {
    constructor()
    readonly signal: AbortSignal
    abort(reason?: any): void
  }

  /** AbortSignal (abort state, reason, and listeners). */
  class AbortSignal {
    readonly aborted: boolean
    readonly reason: any
    throwIfAborted(): void
    onabort: ((event: { type: 'abort'; target: AbortSignal }) => void) | null
    addEventListener(type: 'abort', listener: (event: { type: 'abort'; target: AbortSignal }) => void): void
    removeEventListener(type: 'abort', listener: (event: { type: 'abort'; target: AbortSignal }) => void): void
    static abort(reason?: any): AbortSignal
    static timeout(milliseconds: number): AbortSignal
  }

  /** Result of a `ReadableStreamDefaultReader.read()` call. */
  interface ReadableStreamReadResult<T> {
    readonly value?: T
    readonly done: boolean
  }

  /** Subset of the web `ReadableStreamDefaultReader` interface. */
  interface ReadableStreamDefaultReader<T = Uint8Array> {
    read(): Promise<ReadableStreamReadResult<T>>
    cancel(reason?: any): Promise<void>
    releaseLock(): void
  }

  /** `getReader()` subset of the web `ReadableStream` interface. */
  interface ReadableStream<T = Uint8Array> {
    readonly locked: boolean
    getReader(): ReadableStreamDefaultReader<T>
    cancel(reason?: any): Promise<void>
  }

  /** Decodes UTF-8 bytes to a string. */
  class TextDecoder {
    constructor(encoding?: string)
    readonly encoding: string
    decode(input?: Uint8Array | DataView | ArrayBuffer | number[], options?: { stream?: boolean }): string
  }

  /** Encodes a string to UTF-8 bytes. */
  class TextEncoder {
    constructor()
    encode(input: string): Uint8Array
  }
}
