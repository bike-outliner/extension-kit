/**
 * macOS Keychain storage, namespaced per extension.
 * @requires `keychain` permission
 */
export interface Keychain {
  keys(): string[]
  get(key: string): string | null
  /** @returns True on success. */
  set(key: string, value: string | undefined): boolean
  /** @returns True on success. */
  delete(key: string): boolean
}
