import { Disposable } from '../app/system'

export type JSONValue = string | number | boolean | null | { [property: string]: JSONValue } | JSONValue[]

/** A key-value store of JSON values. */
export interface JSONStore {
  get(key: string): JSONValue | undefined
  set(key: string, value: JSONValue | undefined): void
  delete(key: string): void
  observe(key: string, handler: (value: JSONValue | undefined) => void): Disposable
  /** Register fallback values returned when no explicit value exists. */
  registerDefaults(defaults: Record<string, JSONValue>): void
}