import { OutlineEditor } from './outline-editor'
import { Row } from './outline'

/**
 * Value pickers: `editor.showPicker(row, options)` presents the standalone
 * value-picker SHELL — its own key window (Esc/Return/arrows work
 * natively), anchored to a row like a menu but NON-modal: a filter field,
 * a fuzzy-filterable suggestion list, and — when the presentation has a
 * `kind` (or derives one from an attribute definition) — that kind's
 * picker fixed below the list. This is the same UI the attribute palette's
 * value stage and the badge menu's "Value…" item present.
 *
 * What the shell edits, by precedence:
 * - `attribute` — bind to a registered attribute (`bike.attribute`): the
 *   suggestion list, parse row, strictness, document values, and current
 *   value all derive live from its definition.
 * - Otherwise the inline fields (`values`, `parse`, `strict`,
 *   `emptyLabel`) describe an ad-hoc suggestion list.
 * - `kind` adds (or, with `attribute`, overrides) the embedded picker.
 * At least one of `attribute` / `kind` / `values` / `parse` is required.
 *
 * The embedded picker config is a snapshot — it never re-renders while
 * open (no refresh; re-present instead); the suggestion list is live (it
 * refilters per keystroke). Exactly one of `onAccept` / `onRemove` /
 * `onCancel` fires per presentation: accept on a suggestion row, a
 * single-gesture pick (a day click, a swatch), or Return; remove on a flag
 * attribute's "Off" row; cancel on Esc, click-out, `dismiss()`, or
 * replacement by a newer presentation.
 *
 * Values are STRINGS in each kind's wire encoding, documented on its
 * options interface — the same conventions {@link AttributeType} declares
 * where they overlap, so accepted values can be written straight into row
 * attributes.
 */

/** The picker kinds (the `kind` discriminant of {@link ShowPickerOptions}). */
export type PickerKind =
  | 'string'
  | 'number'
  | 'boolean'
  | 'color'
  | 'date'
  | 'time'
  | 'dateTime'
  | 'duration'
  | 'dateRange'
  | 'recurrence'
  | 'choice'
  | 'rating'

/** Context passed to `showPicker` handlers: the picker's row and its editor. */
export interface PickerContext {
  readonly editor: OutlineEditor
  readonly row: Row
}

/** A suggestion row of the shell's list. */
export interface PickerValue {
  /** Display name ("Tomorrow"). */
  name: string
  /** The wire value the row commits. */
  value: string
  /** Dimmed detail beside the name ("Jul 24"). Display only. */
  detail?: string
}

/** The members every picker presentation shares. */
export interface PickerOptionsBase {
  /** Small-caps header naming the target ("Due"). Omit for none. */
  label?: string
  /**
   * Initial value, in the kind's wire encoding — drives the embedded
   * picker's state and the suggestion checkmark. Omit/null for empty.
   * (Unparseable values are treated as empty, never an error.)
   */
  value?: string
  /**
   * A registered attribute name (`bike.attribute`): the shell's suggestion
   * list, parse row, strictness, document values, and current value all
   * derive LIVE from its definition — exactly the attribute palette's
   * value stage. When given, the inline `values`/`parse`/`strict`/
   * `emptyLabel` fields are ignored. Without `kind`, the embedded picker
   * derives from the definition (date/duration when not strict).
   */
  attribute?: string
  /**
   * Suggestion rows for an ad-hoc shell: a static array, or a
   * pattern → rows function called per keystroke (empty pattern = the
   * unfiltered list). Ignored when `attribute` is given.
   */
  values?: PickerValue[] | ((pattern: string) => PickerValue[])
  /**
   * Free-text parse driving the shell's resolving fallback row
   * ("Due → Fri, Jul 24"): return the committed value and a display
   * label, or undefined when the text doesn't resolve. Ignored when
   * `attribute` is given.
   */
  parse?: (text: string) => { value: string; label: string } | undefined
  /**
   * The offered rows are the COMPLETE legal set — no literal
   * `Set … = text` fallback row. Default false. Ignored when `attribute`
   * is given.
   */
  strict?: boolean
  /**
   * Present ⇒ the bare empty value (`""`) is meaningful: the shell offers
   * its `""` row. Ignored when `attribute` is given.
   */
  emptyLabel?: string
  /**
   * Badge name, character index, or — for one image of a keyed multi-image
   * badge — `{ badge, key }` (the key from the badge's `onClick`). The same
   * forms as `showMenu`'s anchor. Defaults to end of row text.
   */
  anchor?: string | number | { badge: string; key?: string }
  /** The picker was accepted with `value` in the kind's wire encoding. */
  onAccept: (value: string, context: PickerContext) => void
  /**
   * A remove row was chosen — a flag attribute's "Off". Presence is what
   * OFFERS remove rows: omit it and they're suppressed.
   */
  onRemove?: (context: PickerContext) => void
  /** The picker closed without a value (Esc, click-out, dismiss, replace). */
  onCancel?: (context: PickerContext) => void
}

/**
 * An attribute-bound presentation with no explicit `kind` — the embedded
 * picker (when any) derives from the attribute's definition.
 */
export interface AttributeValuePickerOptions extends PickerOptionsBase {
  attribute: string
  kind?: undefined
}

/**
 * An ad-hoc suggestion shell with no embedded picker — inline `values`
 * and/or `parse` (at least one) are the whole editor.
 */
export type SuggestionsPickerOptions = PickerOptionsBase & { kind?: undefined } & (
  | { values: PickerValue[] | ((pattern: string) => PickerValue[]) }
  | { parse: (text: string) => { value: string; label: string } | undefined }
)

/**
 * A native text field. Encoding: the text itself, verbatim
 * ({@link AttributeType} `'string'`). Return accepts.
 */
export interface StringPickerOptions extends PickerOptionsBase {
  kind: 'string'
  /** Placeholder shown in the empty field. */
  placeholder?: string
}

/**
 * A numeric field with Up/Down stepping. Encoding: decimal via `String(n)`,
 * integers without a trailing `.0` ("2", "3.5") — {@link AttributeType}
 * `'number'`. Return accepts; out-of-range or non-numeric text is simply
 * not a value.
 */
export interface NumberPickerOptions extends PickerOptionsBase {
  kind: 'number'
  /** Smallest accepted value. */
  min?: number
  /** Largest accepted value. */
  max?: number
  /** Up/Down step increment. Default 1. */
  step?: number
  /** Restrict accepted values to integers. Default false. */
  integer?: boolean
}

/**
 * A two-option yes/no list. Encoding: `"true"` / `"false"` — for attribute
 * values where false is a real value, distinct from the attribute being
 * absent (a valueless flag stays presence/absence and doesn't need a
 * picker). Single-gesture: a click accepts; `y`/`n` (and `t`/`f`) accept
 * directly, arrows toggle, Return accepts the highlight.
 */
export interface BooleanPickerOptions extends PickerOptionsBase {
  kind: 'boolean'
  /** Display label for the true row. Default "Yes". */
  trueLabel?: string
  /** Display label for the false row. Default "No". */
  falseLabel?: string
}

/**
 * A grid of color swatches. Encoding: CSS-compatible lowercase sRGB hex —
 * `#rrggbb`, or `#rrggbbaa` when not fully opaque. Single-gesture: a click
 * accepts; arrows move the cursor, Return accepts it.
 */
export interface ColorPickerOptions extends PickerOptionsBase {
  kind: 'color'
  /**
   * Swatches to offer, as hex encodings (invalid entries are dropped).
   * Omit for a default system palette.
   */
  presets?: string[]
}

/**
 * A month calendar. Encoding: `YYYY-MM-DD`, a local calendar day — the
 * {@link AttributeType} `'date'` day form. Initial values may also be an ISO
 * week date (`YYYY-Www`, `YYYY-Www-D`) or ordinal date (`YYYY-DDD`); these are
 * normalized to `YYYY-MM-DD`. Single-gesture: clicking a day accepts it;
 * arrows move a day cursor (±1 / ±7), Page Up/Down a month, `t` today, Return
 * accepts the cursor day.
 */
export interface DatePickerOptions extends PickerOptionsBase {
  kind: 'date'
}

/**
 * A localized segmented time-of-day editor (12/24h, segment order,
 * separators, and AM/PM all follow the viewer's locale). Encoding: fixed
 * 24-hour `HH:mm:ss` (an `HH:mm` initial value is accepted). Left/Right
 * move between segments, Up/Down adjust, digits accumulate, Return accepts.
 */
export interface TimePickerOptions extends PickerOptionsBase {
  kind: 'time'
  /** Which segments to show. Default hour+minute. */
  fields?: ('hour' | 'minute' | 'second')[]
}

/**
 * A calendar plus an hour+minute time row. Encoding: ISO-8601 UTC with a
 * trailing `Z` ("2026-07-24T17:00:00Z") — the {@link AttributeType}
 * `'date'` timed form. Clicking a day SETS the date (no close); Tab moves
 * between calendar and time, Return accepts.
 */
export interface DateTimePickerOptions extends PickerOptionsBase {
  kind: 'dateTime'
}

/**
 * A compound duration editor: one whole-number field per component. Encoding:
 * an ISO 8601 duration — `P1Y2M10DT2H30M`, `PT30M`, `P2W`; an all-zero
 * duration is `PT0S`. Whole numbers only (no fractional seconds). Left/Right
 * between fields, Up/Down adjust, digits type, Return accepts.
 */
export interface DurationPickerOptions extends PickerOptionsBase {
  kind: 'duration'
  /**
   * Which components the editor shows, in canonical order. Default all seven.
   */
  components?: (
    | 'years'
    | 'months'
    | 'weeks'
    | 'days'
    | 'hours'
    | 'minutes'
    | 'seconds'
  )[]
}

/**
 * One calendar, two endpoints — an ISO 8601 time interval at day granularity.
 * Encoding out is always `YYYY-MM-DD/YYYY-MM-DD` (start ≤ end, `/` is the ISO
 * interval separator). Initial values may also use the other ISO interval
 * shapes — `<start>/<end>` with datetime endpoints (time dropped),
 * `<start>/<duration>`, or `<duration>/<end>` — and either date may be a week
 * or ordinal form; all reduce to the day pair. The first pick anchors the
 * start, the second completes the range (picks swap into order; picking again
 * starts over); Space picks the cursor day, Return accepts (a lone anchor
 * accepts as `start/start`).
 */
export interface DateRangePickerOptions extends PickerOptionsBase {
  kind: 'dateRange'
}

/**
 * A repeat-rule editor: interval, unit, and weekday toggles for weekly rules.
 * Encoding: an ISO 8601 repeating interval whose interval is a single-component
 * period — `R/P1D`, `R/P2W`, `R/P1M`, `R/P1Y`, or bounded `R5/P1D` (`R/` with
 * no count is unbounded). Weekly-on-specific-weekdays has no ISO 8601 form, so
 * it is kept as a NON-STANDARD suffix on the weekly period only:
 * `R/P1W:mon,wed` (weekdays in canonical mon…sun order). Return accepts.
 */
export interface RecurrencePickerOptions extends PickerOptionsBase {
  kind: 'recurrence'
}

/** One option of a `choice` picker. */
export interface PickerChoiceOption {
  /** Display name. */
  name: string
  /** The wire value, reported verbatim. */
  value: string
  /** Dimmed detail beside the name. Display only. */
  detail?: string
}

/**
 * A list of options. Encoding: the picked option's `value` verbatim;
 * with `multiple: true`, the comma-joined selection — exactly the
 * {@link AttributeConfig.list} contract (split on ',', trim each item,
 * join with ','). SINGLE-select renders as the shell's suggestion rows
 * (fuzzy-filterable, strict, checkmark on the current value) — there is
 * no separate list widget under the filter field. Multi-select keeps an
 * embedded toggling list: click/Space toggles, Return accepts the list.
 */
export interface ChoicePickerOptions extends PickerOptionsBase {
  kind: 'choice'
  /** The options, in display order. Must be non-empty. */
  options: PickerChoiceOption[]
  /** Multi-select (comma-joined list value). Default false. */
  multiple?: boolean
}

/**
 * A row of stars. Encoding: the decimal rating ("3"), 1…max — zero is not
 * a rating (clearing reports cancel, not "0"). Single-gesture: clicking a
 * star or typing its digit accepts; Left/Right adjust, `0`/delete clear,
 * Return accepts.
 */
export interface RatingPickerOptions extends PickerOptionsBase {
  kind: 'rating'
  /** The top rating. Default 5. */
  max?: number
}

/**
 * The options for one `showPicker` presentation, discriminated by `kind`
 * (or attribute-bound with none). An unknown kind — or no attribute, kind,
 * values, or parse at all — is a caller error (`showPicker` returns
 * undefined); unknown KEYS are ignored (forward compatibility).
 */
export type ShowPickerOptions =
  | AttributeValuePickerOptions
  | SuggestionsPickerOptions
  | StringPickerOptions
  | NumberPickerOptions
  | BooleanPickerOptions
  | ColorPickerOptions
  | DatePickerOptions
  | TimePickerOptions
  | DateTimePickerOptions
  | DurationPickerOptions
  | DateRangePickerOptions
  | RecurrencePickerOptions
  | ChoicePickerOptions
  | RatingPickerOptions

/** A handle to one `showPicker` presentation. */
export interface PickerHandle {
  /**
   * Close the picker if this presentation is still the live one (cancel
   * semantics: `onCancel` fires, no value delivers). There is no
   * `refresh()` — the picker is a snapshot; re-present for new options.
   */
  dismiss(): void
}
