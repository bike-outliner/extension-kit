import { Disposable } from '../app/system'

export type JSONValue = string | number | boolean | null | { [property: string]: JSONValue } | JSONValue[]

/** A key-value store of JSON values. */
export interface JSONStore {
  /** Get value for key. */
  get(key: string): JSONValue | undefined
  /** Set value for key. */
  set(key: string, value: JSONValue | undefined): void
  /** Delete value for key. */
  delete(key: string): void
  /** Observe value changes for key. */
  observe(key: string, handler: (value: JSONValue | undefined) => void): Disposable
  /** Register fallback values returned when no explicit value exists. */
  registerDefaults(defaults: Record<string, JSONValue>): void
}