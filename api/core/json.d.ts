export type JSONValue = string | number | boolean | null | { [property: string]: JSONValue } | JSONValue[]

/** A key-value store of JSON values. */
export interface JSONStore {
  /** Get value for key. */
  get(key: string): JSONValue | undefined
  /** Set value for key. */
  set(key: string, value: JSONValue | undefined): void
  /** Delete value for key. */
  delete(key: string): void
}