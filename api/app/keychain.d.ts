/**
 * Secure storage for secrets (API tokens, passwords, OAuth tokens),
 * backed by the macOS Keychain — `bike.keychain`.
 *
 * Each extension has its own isolated keychain namespace. Demonstrated by
 * kitchensink.bkext's `kitchensink:keychain-demo`.
 *
 * @requires `keychain` permission
 */
export interface Keychain {
  /** List all stored key names for this extension. */
  keys(): string[]
  /** Get a secret by key. Returns null if not found. */
  get(key: string): string | null
  /** Store a secret. Returns true on success. */
  set(key: string, value: string | undefined): boolean
  /** Delete a secret. Returns true on success. */
  delete(key: string): boolean
}
