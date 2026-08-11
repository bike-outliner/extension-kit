// The wire codecs ride in this bundle so both contexts load them with
// format: the app JSC evaluates Runtime/format.js, the DOM pages load
// common.js (whose common.ts imports ./format).
import './value-codec'
import { format } from 'date-fns'

/**
 * Formats a Date using a date-fns pattern string (CLDR-inspired).
 * See: https://date-fns.org/docs/format
 *
 * The LOCAL week tokens (`w`, `ww`, `e`, `c`, `Y`) follow the Mac's first day
 * of the week rather than date-fns's built-in en-US default, so a week number
 * formatted here matches the one a calendar grid draws for the same week.
 * `I`/`II` are ISO by definition and always count weeks from Monday.
 */
function formatDate(date: Date, pattern: string): string {
  return format(date, pattern, weekOptions())
}

/**
 * date-fns week options for the Mac's calendar.
 *
 * Read per call, not once at load: this module installs the `bike` global's
 * first member, so `systemFirstWeekday` isn't on it yet when we run.
 *
 * `firstWeekContainsDate` is the other half of a week-numbering scheme, and it
 * is NOT independent of the start day: a Monday start means ISO rules (week 1
 * is the first with 4+ days in the new year), while Sunday- and Saturday-start
 * calendars number from whichever week contains Jan 1. That's the same split
 * react-calendar makes between its `iso8601` and `gregory`/`islamic` types, so
 * pairing them this way is what keeps formatted text and grid agreeing.
 */
function weekOptions() {
  const first = (globalThis as any).bike?.systemFirstWeekday
  const weekStartsOn = first === 0 ? 0 : first === 6 ? 6 : 1
  return { weekStartsOn, firstWeekContainsDate: weekStartsOn === 1 ? 4 : 1 } as const
}

globalThis.bike = globalThis.bike || {} as any
globalThis.bike.formatDate = formatDate
