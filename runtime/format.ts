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
