import { Disposable } from '../app/system'

export type JSONValue = string | number | boolean | null | { [property: string]: JSONValue } | JSONValue[]

export interface JSONStore {
  get(key: string): JSONValue | undefined
  set(key: string, value: JSONValue | undefined): void
  delete(key: string): void
  observe(key: string, handler: (value: JSONValue | undefined) => void): Disposable
  /** Fallbacks returned when no value is set. */
  registerDefaults(defaults: Record<string, JSONValue>): void
}