// The wire codecs ride in this bundle so both contexts load them with
// format: the app JSC evaluates Runtime/format.js, the DOM pages load
// common.js (whose common.ts imports ./format).
import './value-codec'
import { format } from 'date-fns'

/**
 * Formats a Date using a date-fns pattern string (CLDR-inspired).
 * See: https://date-fns.org/docs/format
 */
function formatDate(date: Date, pattern: string): string {
  return format(date, pattern)
}

globalThis.bike = globalThis.bike || {} as any
globalThis.bike.formatDate = formatDate
