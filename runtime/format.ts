// The wire codecs ride in this bundle so both contexts load them with
// format: the app JSC evaluates Runtime/format.js, the DOM pages load
// common.js (whose common.ts imports ./format).
import './value-codec'
import { format, type Locale } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'

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
  return format(date, pattern, { ...weekOptions(), locale: systemDateLocale() })
}

/**
 * A date-fns locale whose month, weekday and day-period names come from
 * `Intl` for `bike.systemLocale`, so `MMMM`/`EEEE` follow the Mac's language
 * without bundling every date-fns locale. Ordinals stay plain numbers outside
 * English, where date-fns's English suffixes would be wrong.
 */
function systemDateLocale(): Locale {
  const tag: string | undefined = (globalThis as any).bike?.systemLocale
  if (!tag || tag.startsWith('en')) return enUS
  if (cachedLocale?.code === tag) return cachedLocale
  const name = (options: Intl.DateTimeFormatOptions, date: Date, part: Intl.DateTimeFormatPartTypes) =>
    new Intl.DateTimeFormat(tag, { ...options, timeZone: 'UTC' }).formatToParts(date).find(p => p.type === part)?.value ?? ''
  const monthDate = (month: number) => new Date(Date.UTC(2021, month, 15))
  // 2021-01-03 is a Sunday; date-fns days count from Sunday.
  const dayDate = (day: number) => new Date(Date.UTC(2021, 0, 3 + day))
  const style = (width?: string) => (width === 'narrow' ? 'narrow' : width === 'wide' || !width || width === 'any' ? 'long' : 'short')
  cachedLocale = {
    ...enUS,
    code: tag,
    localize: {
      ...enUS.localize,
      ordinalNumber: (n: number) => String(n),
      month: (month, options) => {
        const month_ = style(options?.width)
        return options?.context === 'standalone'
          ? name({ month: month_ }, monthDate(month), 'month')
          : name({ month: month_, day: 'numeric' }, monthDate(month), 'month')
      },
      day: (day, options) => name({ weekday: style(options?.width) }, dayDate(day), 'weekday'),
      dayPeriod: (period) => {
        const hour = period === 'pm' || period === 'afternoon' || period === 'evening' ? 15 : 9
        return name({ hour: 'numeric', hour12: true }, new Date(Date.UTC(2021, 0, 4, hour)), 'dayPeriod') || enUS.localize.dayPeriod(period)
      },
    },
  }
  return cachedLocale
}
let cachedLocale: Locale | undefined

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
