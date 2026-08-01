import {
  AttributeType,
  AttributeChoice,
  AttributeParseResult,
  AttributeSuggest,
  TextFacet,
  NumberFacet,
  DateFacet,
  TimeFacet,
  DurationFacet,
  ChoiceFacet,
} from './attribute'

/**
 * Presented with `editor.showPicker(spec)`.
 *
 * The picker is a filter field, a suggestion list, and may contain type
 * specific UI such as a calendar. It is similar to a ChoiceBox in some ways,
 * but unlike ChoiceBox is designed for picking typed values.
 *
 * A spec says where its values come from — {@link AttributeSource} for a
 * registered attribute, {@link ListSource} to give the list yourself — and
 * optionally a `kind`, which is the embedded editor. The two are
 * independent: `kind` alone describes an editor with no bound attribute,
 * `attribute` alone derives everything including the editor, and both
 * together bind the values while overriding the editor.
 */

/** Values come from a registered attribute — its type, facet, suggestions, and parse. */
export interface AttributeSource {
  attribute: string
  values?: never
  parse?: never
  strict?: never
  emptyLabel?: never
}

/** The picker's values given as a list, rather than coming from an attribute. */
export interface ListSource {
  /** Suggestion rows, static or called per keystroke. */
  values?: AttributeChoice[] | AttributeSuggest
  /** Free-text parse; return undefined when the text doesn't resolve. */
  parse?: (text: string) => AttributeParseResult | undefined
  /** The offered rows are the complete legal set — no free-text fallback. Default false. */
  strict?: boolean
  /** Present ⇒ the empty value is meaningful, offered under this label. */
  emptyLabel?: string
}

/** Where a picker's values come from. */
export type PickerSource = AttributeSource | ListSource

/** The members every picker spec shares. */
export interface PickerSpecCommon {
  label?: string
  value?: string // initial value
  onAccept: (value: string) => void
  onRemove?: () => void
  onCancel?: () => void
}

/** Bound to a registered attribute, which supplies the editor too. */
export type AttributePickerSpec = PickerSpecCommon & { source: AttributeSource; kind?: undefined }

/** Values only, no embedded editor — so the source must offer rows. */
export type SuggestionsPickerSpec = PickerSpecCommon & { kind?: undefined } & {
  source: ListSource &
    ({ values: AttributeChoice[] | AttributeSuggest } | { parse: (text: string) => AttributeParseResult | undefined })
}

/** A plain text field, showing the facet's `placeholder` while empty. */
export type TextPickerSpec = PickerSpecCommon & { kind: 'text'; source?: PickerSource } & TextFacet

/** Yes / No rows — for values where false is real, distinct from absent. */
export type BooleanPickerSpec = PickerSpecCommon & { kind: 'boolean'; source?: PickerSource }

/** A numeric field, stepping by the facet's `step` and bounded by its `min`/`max`. */
export type NumberPickerSpec = PickerSpecCommon & { kind: 'number'; source?: PickerSource } & NumberFacet

/** A calendar, plus a time editor per the facet's `time`. */
export type DatePickerSpec = PickerSpecCommon & { kind: 'date'; source?: PickerSource } & DateFacet

/** A localized time-of-day editor showing the facet's `fields`. */
export type TimePickerSpec = PickerSpecCommon & { kind: 'time'; source?: PickerSource } & TimeFacet

/** One field per facet component. */
export type DurationPickerSpec = PickerSpecCommon & { kind: 'duration'; source?: PickerSource } & DurationFacet

/** One calendar, two endpoints. A lone anchor accepts as `start/start`. */
export type IntervalPickerSpec = PickerSpecCommon & { kind: 'interval'; source?: PickerSource }

/** A repeat-rule editor: interval, unit, and weekdays for weekly rules. */
export type RecurrencePickerSpec = PickerSpecCommon & { kind: 'recurrence'; source?: PickerSource }

/** The facet's choices, rendered as the suggestion rows themselves. */
export type ChoicePickerSpec = PickerSpecCommon & { kind: 'choice'; source?: PickerSource } & ChoiceFacet

/** Discriminated by `kind`, or attribute-bound with none. Unknown keys are ignored. */
export type PickerSpec =
  | AttributePickerSpec
  | SuggestionsPickerSpec
  | TextPickerSpec
  | BooleanPickerSpec
  | NumberPickerSpec
  | DatePickerSpec
  | TimePickerSpec
  | DurationPickerSpec
  | IntervalPickerSpec
  | RecurrencePickerSpec
  | ChoicePickerSpec
