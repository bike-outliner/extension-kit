import { OutlineEditor } from '../outline-editor'
import { Row } from '../outline'
import {
  AttributeType,
  AttributeValue,
  AttributeParseResult,
  AttributeSuggest,
  TextFacet,
  NumberFacet,
  MeasurementFacet,
  DateFacet,
  TimeFacet,
  DurationFacet,
  RatingFacet,
  ColorFacet,
  ChoiceFacet,
} from './attribute2'

/**
 * Pickers v2: `editor.showPicker(row, options)` presents the standalone
 * value-picker SHELL — its own key window (Esc/Return/arrows work
 * natively), anchored to a row like a menu but non-modal: a filter field,
 * a fuzzy-filterable suggestion list, and — when there is a `kind` — that
 * kind's editor fixed below the list. The same UI the attribute palette's
 * value stage and the default badge menu's "Value…" item present.
 *
 * `kind` IS {@link AttributeType} — there is no separate picker-kind
 * vocabulary, and each kind's options reuse the type's facet from
 * attribute2 verbatim. Wire encodings are NOT restated here: every kind
 * accepts and reports values in its type's encoding as specified on
 * {@link AttributeType}.
 *
 * What the shell edits, by precedence:
 *
 * - `attribute` alone — bind to a registered definition: kind, facet,
 *   suggestions (host + definition + document values), parse, and current
 *   value ALL derive live from it. The common case; most callers pass
 *   nothing else.
 * - `attribute` + `kind` — definition-bound suggestions/current value,
 *   but the embedded editor is the explicit kind+facet (an override).
 * - `kind` alone — an ad-hoc editor; the inline suggestion fields
 *   (`values`, `parse`, `strict`, `emptyLabel`) describe the list.
 * - Neither — a pure suggestion shell; at least one of `values`/`parse`
 *   is required.
 *
 * The embedded editor is a snapshot (no refresh; re-present instead); the
 * suggestion list is live (it refilters per keystroke, and async `values`
 * are awaited with stale calls aborted). Exactly one of `onAccept` /
 * `onRemove` / `onCancel` fires per presentation: accept on a suggestion
 * row, a single-gesture pick (a day click, a swatch), or Return; remove on
 * a flag's "Off" row or a rating's clear; cancel on Esc, click-out,
 * `dismiss()`, or replacement by a newer presentation.
 */

/** Context passed to `showPicker` handlers: the picker's row and its editor. */
export interface PickerContext {
  readonly editor: OutlineEditor
  readonly row: Row
}

/** The members every picker presentation shares. */
export interface PickerOptionsBase {
  /** Small-caps header naming the target ("Due"). Defaults to the bound
   * attribute's title; omit for none. */
  label?: string
  /**
   * Initial value in the kind's wire encoding — drives the embedded
   * editor's state and the suggestion checkmark. Omit/null for empty;
   * defaults to the row's current value when `attribute` is given.
   * (Unparseable values are treated as empty, never an error.)
   */
  value?: string
  /**
   * A registered attribute name (`bike.attribute`). Suggestions, parse,
   * document values, and the current value derive LIVE from the
   * definition; without an explicit `kind`, so does the embedded editor.
   * When given, the inline `values`/`parse`/`strict`/`emptyLabel` fields
   * are ignored.
   */
  attribute?: string
  /**
   * Ad-hoc suggestion rows: a static array, or {@link AttributeSuggest}
   * called per keystroke (async supported; superseded calls are aborted).
   * Ignored when `attribute` is given.
   */
  values?: AttributeValue[] | AttributeSuggest
  /**
   * Ad-hoc free-text parse driving the shell's resolving fallback row
   * ("Due → Fri, Jul 24"); return undefined when the text doesn't
   * resolve. Ignored when `attribute` is given — and unnecessary with a
   * `kind`, whose type already parses natively.
   */
  parse?: (text: string) => AttributeParseResult | undefined
  /**
   * The offered rows are the COMPLETE legal set — no literal
   * `Set … = text` fallback row. Default false. Ignored when `attribute`
   * is given (a choice definition's `open` decides there).
   */
  strict?: boolean
  /**
   * Present ⇒ the bare empty value (`""`) is meaningful: the shell offers
   * its `""` row under this label. Ignored when `attribute` is given.
   */
  emptyLabel?: string
  /**
   * Badge name, character index, or — for one image of a keyed
   * multi-image badge — `{ badge, key }` (the key from the badge's
   * `onClick`). The same forms as `showMenu`'s anchor. Defaults to end of
   * row text.
   */
  anchor?: string | number | { badge: string; key?: string }
  /** The picker was accepted with `value` in the kind's wire encoding. */
  onAccept: (value: string, context: PickerContext) => void
  /**
   * A remove row was chosen — a flag's "Off", a rating's clear. Presence
   * is what OFFERS remove rows: omit it and they're suppressed.
   */
  onRemove?: (context: PickerContext) => void
  /** The picker closed without a value (Esc, click-out, dismiss, replace). */
  onCancel?: (context: PickerContext) => void
}

/**
 * An attribute-bound presentation with no explicit `kind` — everything
 * derives from the definition. The common case.
 */
export interface AttributePickerOptions extends PickerOptionsBase {
  attribute: string
  kind?: undefined
}

/**
 * A pure suggestion shell, no embedded editor — inline `values` and/or
 * `parse` (at least one) are the whole editor.
 */
export type SuggestionsPickerOptions = PickerOptionsBase & { kind?: undefined } & (
  | { values: AttributeValue[] | AttributeSuggest }
  | { parse: (text: string) => AttributeParseResult | undefined }
)

/** A native text field. Return accepts the text, trimmed. */
export interface TextPickerOptions extends PickerOptionsBase, TextFacet {
  kind: 'text'
}

/**
 * Two rows, On / Off — the flag's whole editor (a flag has no value to
 * edit). On accepts `""` (present); Off fires `onRemove` (absent) and is
 * offered only when `onRemove` is given. Single-gesture: a click accepts,
 * arrows move, Return accepts the highlight.
 */
export interface FlagPickerOptions extends PickerOptionsBase {
  kind: 'flag'
  /** Display label for the On row. Defaults to the bound attribute's
   * `emptyLabel`, else "On". */
  onLabel?: string
  /** Display label for the Off row. Default "Off". */
  offLabel?: string
}

/**
 * A two-option yes/no list — for values where false is real, distinct
 * from absent (use `flag` for presence/absence). Single-gesture: a click
 * accepts; `y`/`n` (and `t`/`f`) accept directly, arrows toggle, Return
 * accepts the highlight.
 */
export interface BooleanPickerOptions extends PickerOptionsBase {
  kind: 'boolean'
  /** Display label for the true row. Default "Yes". */
  trueLabel?: string
  /** Display label for the false row. Default "No". */
  falseLabel?: string
}

/** A numeric field with Up/Down stepping per the facet. Return accepts;
 * out-of-range or non-numeric text is simply not a value. */
export interface NumberPickerOptions extends PickerOptionsBase, NumberFacet {
  kind: 'number'
}

/**
 * A numeric field plus a unit menu constrained to the facet's dimension.
 * Free-typed input may name any unit of the dimension ("5kg", "3.5 mi");
 * bare numbers take the facet's `unit`. Return accepts.
 */
export interface MeasurementPickerOptions extends PickerOptionsBase, MeasurementFacet {
  kind: 'measurement'
}

/**
 * A month calendar; per the facet's `time`, plus an hour+minute row
 * (`'required'`, always; `'optional'`, blankable; `'never'`, none).
 * Clicking a day picks it — accepting immediately at `'never'`, otherwise
 * setting the date part. Arrows move a day cursor (±1 / ±7), Page Up/Down
 * a month, `t` today, Tab moves calendar ↔ time, Return accepts.
 */
export interface DatePickerOptions extends PickerOptionsBase, DateFacet {
  kind: 'date'
}

/**
 * A localized segmented time-of-day editor (12/24h, segment order,
 * separators, and AM/PM all follow the viewer's locale), showing the
 * facet's `fields`. Left/Right move between segments, Up/Down adjust,
 * digits accumulate, Return accepts.
 */
export interface TimePickerOptions extends PickerOptionsBase, TimeFacet {
  kind: 'time'
}

/**
 * A compound duration editor: one whole-number field per facet component.
 * Left/Right between fields, Up/Down adjust, digits type, Return accepts.
 */
export interface DurationPickerOptions extends PickerOptionsBase, DurationFacet {
  kind: 'duration'
}

/**
 * One calendar, two endpoints. The first pick anchors the start, the
 * second completes the range (picks swap into order; picking again starts
 * over); Space picks the cursor day, Return accepts (a lone anchor
 * accepts as `start/start`).
 */
export interface IntervalPickerOptions extends PickerOptionsBase {
  kind: 'interval'
}

/**
 * A repeat-rule editor: interval, unit, and weekday toggles for weekly
 * rules. Return accepts.
 */
export interface RecurrencePickerOptions extends PickerOptionsBase {
  kind: 'recurrence'
}

/**
 * A row of stars, 1…max per the facet. Single-gesture: clicking a star or
 * typing its digit accepts; Left/Right adjust, `0`/delete clear (firing
 * `onRemove` when given, else cancel), Return accepts.
 */
export interface RatingPickerOptions extends PickerOptionsBase, RatingFacet {
  kind: 'rating'
}

/**
 * A grid of color swatches from the facet's presets. Single-gesture: a
 * click accepts; arrows move the cursor, Return accepts it.
 */
export interface ColorPickerOptions extends PickerOptionsBase, ColorFacet {
  kind: 'color'
}

/**
 * The facet's choices. SINGLE-select renders as the shell's suggestion
 * rows (fuzzy-filterable, checkmark on the current value; `open` adds the
 * free-text fallback row) — no separate widget under the filter field.
 * With `list: true` an embedded toggling list edits the comma-joined
 * selection: click/Space toggles, Return accepts the list.
 */
export interface ChoicePickerOptions extends PickerOptionsBase, ChoiceFacet {
  kind: 'choice'
  /** Multi-select, committing the comma-joined list encoding. Default
   * false; derived from the definition's `list` when attribute-bound. */
  list?: boolean
}

/**
 * The options for one `showPicker` presentation, discriminated by `kind`
 * (an {@link AttributeType}) or attribute-bound with none. An unknown kind
 * — or no `attribute`, `kind`, `values`, or `parse` at all — is a caller
 * error (`showPicker` returns undefined); unknown KEYS are ignored
 * (forward compatibility).
 */
export type ShowPickerOptions =
  | AttributePickerOptions
  | SuggestionsPickerOptions
  | TextPickerOptions
  | FlagPickerOptions
  | BooleanPickerOptions
  | NumberPickerOptions
  | MeasurementPickerOptions
  | DatePickerOptions
  | TimePickerOptions
  | DurationPickerOptions
  | IntervalPickerOptions
  | RecurrencePickerOptions
  | RatingPickerOptions
  | ColorPickerOptions
  | ChoicePickerOptions

/** A handle to one `showPicker` presentation. */
export interface PickerHandle {
  /**
   * Close the picker if this presentation is still the live one (cancel
   * semantics: `onCancel` fires, no value delivers). There is no
   * `refresh()` — the embedded editor is a snapshot; re-present for new
   * options.
   */
  dismiss(): void
}
