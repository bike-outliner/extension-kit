// bike.encodeValue / bike.decodeValue — the machine-facing wire codecs.
//
// The API grid has four corners. Two are for HUMANS and live natively in the
// app (localized): `parseValue` (free text → wire) and `displayValue`
// (wire → label). These two are for PROGRAMS: encode (typed JS value → wire)
// and decode (wire → typed JS value). The wire grammar is locale-free
// mechanical ISO, and DOM panels have no synchronous native bridge, so this
// pair is pure JS loaded into BOTH contexts — the same single-source pattern
// as bike.formatDate (app: Runtime/format.js, DOM: common.js via ./format).
// Conformance tests in core-extensions (value-codec.test.ts) pin this grammar
// to the native one through parseValue/displayValue round-trips.
//
// Decode is STRICT-CANONICAL: it reads what documents store (the wire forms
// documented in bike/app attribute.d.ts), not the lenient variants
// parseValue accepts from typed text. Unknown types, unencodable values, and
// unparseable wire all return undefined — never throw.

export interface DecodedDate {
  date: Date
  hasTime: boolean
}

export interface DecodedRecurrence {
  count?: number
  /** The period as an ISO duration wire string ("P1W"). */
  interval: string
  weekdays: string[]
}

// ISO weekday tokens in the recurrence extension ("R/P1W:mon,wed"), Monday
// first to match the wire ordering.
const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

// Fixed calendar approximations, matching the query engine and typed
// summaries (SummaryValueCodec / AttributeDuration.totalSeconds): a year is
// 365 days, a month 30, a week 7 — durations are amounts of time, not
// calendar arithmetic.
const SECONDS_PER = {
  year: 365 * 86400,
  month: 30 * 86400,
  week: 7 * 86400,
  day: 86400,
  hour: 3600,
  minute: 60,
}

function encodeValue(type: string, value: unknown, options?: Record<string, unknown>): string | undefined {
  switch (type) {
    case 'text':
      return typeof value === 'string' ? value.trim() : undefined
    case 'choice':
      // A choice's wire form is the declared option value verbatim; without
      // the definition there is nothing to validate against here.
      return typeof value === 'string' ? value : undefined
    case 'boolean':
      return typeof value === 'boolean' ? String(value) : undefined
    case 'number':
      // Decimal wire form; integers carry no ".0" (String() already
      // guarantees that for safe integers).
      return typeof value === 'number' && Number.isFinite(value) ? String(value) : undefined
    case 'date':
      return value instanceof Date && !Number.isNaN(value.getTime())
        ? options?.['time'] === true
          ? encodeTimestamp(value)
          : encodeDay(value)
        : undefined
    case 'time':
      return typeof value === 'number' ? encodeTimeOfDay(value) : undefined
    case 'duration':
      return typeof value === 'number' ? encodeDuration(value) : undefined
    case 'interval': {
      const { start, end } = (value ?? {}) as { start?: unknown; end?: unknown }
      if (!(start instanceof Date) || !(end instanceof Date)) return undefined
      const startWire = encodeDay(start)
      const endWire = encodeDay(end)
      // The canonical interval is day/day with start ≤ end — lexical compare
      // works because the day form is fixed-width.
      return startWire <= endWire ? `${startWire}/${endWire}` : undefined
    }
    case 'recurrence': {
      const { count, interval, weekdays } = (value ?? {}) as Partial<DecodedRecurrence>
      if (typeof interval !== 'string' || decodeDuration(interval) == null) return undefined
      if (count != null && (!Number.isInteger(count) || count < 1)) return undefined
      if (weekdays != null && (!Array.isArray(weekdays) || weekdays.some((d) => !WEEKDAYS.includes(d))))
        return undefined
      const days = weekdays && weekdays.length > 0 ? `:${weekdays.join(',')}` : ''
      return `R${count ?? ''}/${interval}${days}`
    }
    default:
      return undefined
  }
}

function decodeValue(type: string, wire: string): unknown {
  if (typeof wire !== 'string') return undefined
  switch (type) {
    case 'text':
      return wire
    case 'choice':
      return wire
    case 'boolean':
      // Exactly 'true' / 'false' — the only wire encodings.
      return wire === 'true' ? true : wire === 'false' ? false : undefined
    case 'number': {
      if (wire.trim() === '') return undefined
      const n = Number(wire)
      return Number.isFinite(n) ? n : undefined
    }
    case 'date':
      return decodeDate(wire)
    case 'time':
      return decodeTimeOfDay(wire)
    case 'duration':
      return decodeDuration(wire)
    case 'interval': {
      const slash = wire.indexOf('/')
      if (slash < 0) return undefined
      const start = decodeDate(wire.slice(0, slash))
      const end = decodeDate(wire.slice(slash + 1))
      if (!start || !end || start.date.getTime() > end.date.getTime()) return undefined
      return { start, end }
    }
    case 'recurrence': {
      const match = wire.match(/^R(\d*)\/([^:]+)(?::(.+))?$/)
      if (!match) return undefined
      const interval = match[2]
      if (decodeDuration(interval) == null) return undefined
      const weekdays = match[3] ? match[3].split(',') : []
      if (weekdays.some((d) => !WEEKDAYS.includes(d))) return undefined
      const result: DecodedRecurrence = { interval, weekdays }
      if (match[1]) result.count = parseInt(match[1], 10)
      return result
    }
    default:
      return undefined
  }
}

// ---- date ----

/** LOCAL calendar day of the instant, as the fixed-width day wire form. */
function encodeDay(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/**
 * Full ISO-8601 UTC instant without fractional seconds — byte-identical to
 * the stamp native Toggle Done writes for `done`.
 */
function encodeTimestamp(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/**
 * The two canonical date wire forms only. A bare day is built from LOCAL
 * components (`new Date('YYYY-MM-DD')` would parse as UTC midnight, shifting
 * the day west of Greenwich) and validated as a REAL day (2026-13-40 and
 * unpadded 2026-7-1 are both rejected); a timed value carries its own zone
 * and lands on whatever local instant it names.
 */
function decodeDate(wire: string): DecodedDate | undefined {
  const day = wire.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (day) {
    const year = +day[1]
    const month = +day[2]
    const dayOfMonth = +day[3]
    const date = new Date(year, month - 1, dayOfMonth)
    // Out-of-range components roll over (month 13 → January); a real day
    // round-trips exactly.
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== dayOfMonth)
      return undefined
    return { date, hasTime: false }
  }
  if (wire.includes('T')) {
    const date = new Date(wire)
    return Number.isNaN(date.getTime()) ? undefined : { date, hasTime: true }
  }
  return undefined
}

// ---- time ----

/** Seconds-of-day → fixed 24-hour `HH:mm:ss`. */
function encodeTimeOfDay(seconds: number): string | undefined {
  if (!Number.isFinite(seconds) || seconds < 0 || seconds >= 86400) return undefined
  const total = Math.round(seconds)
  return `${pad2(Math.floor(total / 3600))}:${pad2(Math.floor((total % 3600) / 60))}:${pad2(total % 60)}`
}

/** `HH:mm` or `HH:mm:ss` → seconds of day. */
function decodeTimeOfDay(wire: string): number | undefined {
  const match = wire.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (!match) return undefined
  const hours = +match[1]
  const minutes = +match[2]
  const seconds = +(match[3] ?? '0')
  if (hours > 23 || minutes > 59 || seconds > 59) return undefined
  return hours * 3600 + minutes * 60 + seconds
}

// ---- duration ----

/**
 * Whole seconds → normalized ISO duration, the same shape a duration-typed
 * summary re-emits: days/hours/minutes/seconds, deliberately no weeks or
 * above (the fixed 365/30-day approximations don't justify a calendar
 * precision the number doesn't have). Negative amounts are unencodable.
 */
function encodeDuration(seconds: number): string | undefined {
  if (!Number.isFinite(seconds) || seconds < 0) return undefined
  const total = Math.round(seconds)
  if (total === 0) return 'PT0S'
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  let out = 'P'
  if (days) out += `${days}D`
  if (hours || minutes || secs) {
    out += 'T'
    if (hours) out += `${hours}H`
    if (minutes) out += `${minutes}M`
    if (secs) out += `${secs}S`
  }
  return out
}

/**
 * Full ISO duration grammar `P[nY][nM][nW][nD][T[nH][nM][nS]]` → seconds,
 * with the fixed conversions above and fractional seconds preserved
 * (`PT0.5S` → 0.5).
 */
function decodeDuration(wire: string): number | undefined {
  const match = wire.match(
    /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/
  )
  // The grammar above also matches a bare "P" / "PT" — require at least one
  // component.
  if (!match || !match.slice(1).some((part) => part != null)) return undefined
  const [years, months, weeks, days, hours, minutes, seconds] = match.slice(1)
  return (
    (+(years ?? 0)) * SECONDS_PER.year +
    (+(months ?? 0)) * SECONDS_PER.month +
    (+(weeks ?? 0)) * SECONDS_PER.week +
    (+(days ?? 0)) * SECONDS_PER.day +
    (+(hours ?? 0)) * SECONDS_PER.hour +
    (+(minutes ?? 0)) * SECONDS_PER.minute +
    +(seconds ?? 0)
  )
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

globalThis.bike = globalThis.bike || ({} as any)
globalThis.bike.encodeValue = encodeValue
globalThis.bike.decodeValue = decodeValue
