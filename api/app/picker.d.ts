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

/** Uses the registered attribute's type, facet, suggestions, and parse. */
export interface AttributeSource {
  attribute: string
  values?: never
  parse?: never
  strict?: never
  emptyLabel?: never
}

export interface ListSource {
  /** Static, or called per keystroke. */
  values?: AttributeChoice[] | AttributeSuggest
  /** Undefined when the text doesn't resolve. */
  parse?: (text: string) => AttributeParseResult | undefined
  /** Only offered values are accepted. Default false. */
  strict?: boolean
  /** When set, the empty value is offered under this label. */
  emptyLabel?: string
}

export type PickerSource = AttributeSource | ListSource

/**
 * Values come from `source`; `kind` picks the embedded editor. With both,
 * `kind` overrides the attribute's editor.
 */
export interface PickerSpecCommon {
  label?: string
  /** Initial value. */
  value?: string
  onAccept: (value: string) => void
  onRemove?: () => void
  onCancel?: () => void
}

/** Editor from the attribute. */
export type AttributePickerSpec = PickerSpecCommon & { source: AttributeSource; kind?: undefined }

/** No embedded editor. */
export type SuggestionsPickerSpec = PickerSpecCommon & { kind?: undefined } & {
  source: ListSource &
    ({ values: AttributeChoice[] | AttributeSuggest } | { parse: (text: string) => AttributeParseResult | undefined })
}

export type TextPickerSpec = PickerSpecCommon & { kind: 'text'; source?: PickerSource } & TextFacet

/** Yes / No rows. */
export type BooleanPickerSpec = PickerSpecCommon & { kind: 'boolean'; source?: PickerSource }

export type NumberPickerSpec = PickerSpecCommon & { kind: 'number'; source?: PickerSource } & NumberFacet

/** Calendar, plus time per `time`. */
export type DatePickerSpec = PickerSpecCommon & { kind: 'date'; source?: PickerSource } & DateFacet

export type TimePickerSpec = PickerSpecCommon & { kind: 'time'; source?: PickerSource } & TimeFacet

export type DurationPickerSpec = PickerSpecCommon & { kind: 'duration'; source?: PickerSource } & DurationFacet

/** A lone endpoint accepts as `start/start`. */
export type IntervalPickerSpec = PickerSpecCommon & { kind: 'interval'; source?: PickerSource }

/** Interval, unit, and weekdays for weekly rules. */
export type RecurrencePickerSpec = PickerSpecCommon & { kind: 'recurrence'; source?: PickerSource }

/** Choices are the suggestion rows. */
export type ChoicePickerSpec = PickerSpecCommon & { kind: 'choice'; source?: PickerSource } & ChoiceFacet

/** Unknown keys are ignored. */
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
