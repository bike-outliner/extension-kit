// The `bike/components` module. A plain module reached through the
// `bike/components` path mapping, the same way `bike/dom` and `bike/app` are
// reached — NOT a `declare module 'bike/components'` block, which cannot
// import through a relative path: `SFSymbolName` would silently resolve to an
// error type and leave `SFSymbol`'s `name` prop unchecked.

import * as React from 'react'
import { SFSymbolName } from '../core/bike-globals'

// SFSymbol

/** Renders an SF Symbol using CSS mask-image, colored by `currentColor`. */
export function SFSymbol(props: SFSymbolProps): React.JSX.Element

export interface SFSymbolProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** SF Symbol name (e.g. "chevron.left", "star.fill") */
  name: SFSymbolName
  weight?: 'ultralight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'
  scale?: 'small' | 'medium' | 'large'
}

// Checkbox

/**
 * A macOS-styled checkbox with label.
 *
 * ```tsx
 * import { Checkbox } from 'bike/components'
 * <Checkbox checked={value} onChange={setValue}>Show week numbers</Checkbox>
 * ```
 */
export function Checkbox(props: CheckboxProps): React.JSX.Element

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label text displayed next to the checkbox */
  children?: React.ReactNode
}

// Button

/**
 * A macOS-styled capsule button.
 *
 * `size` scales the text as well as the metrics, on the same
 * `NSFont.systemFontSize(for:)` scale as `Label`'s `size`: mini 9px, small
 * 11px, regular and large 13px. `large` shares Regular's text size because
 * AppKit enlarges a large control's metrics, not its text.
 */
export function Button(props: ButtonProps): React.JSX.Element

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button size (default: "regular") */
  size?: 'mini' | 'small' | 'regular' | 'large'
}

// Label

/**
 * Text label with system font and color variants.
 *
 * Two independent ways to size text, matching the two scales AppKit itself
 * uses. `font` picks a semantic TEXT STYLE — the label's role, where the size
 * follows from the role. `size` picks a CONTROL SIZE: the Large / Regular /
 * Small / Mini scale Interface Builder shows, taken from
 * `NSFont.systemFontSize(for:)`.
 *
 * They compose — `font` supplies the family and weight, `size` overrides the
 * point size. `<Label font="headline" size="small">` is semibold at 11px.
 */
export function Label(props: LabelProps): React.JSX.Element

export interface LabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Text color (default: primary/--label) */
  color?: 'secondary' | 'tertiary'
  /** Semantic text style — the label's role (default: body) */
  font?: 'headline' | 'subheadline' | 'caption' | 'footnote'
  /**
   * Control size, as in Interface Builder: regular 13px, small 11px, mini 9px.
   * `large` matches `regular` — AppKit scales a large control's metrics, not
   * its text, so there is no larger label font.
   */
  size?: 'large' | 'regular' | 'small' | 'mini'
}

// FormRow

/**
 * A label + content row for inspector-style forms.
 * Set `--bike-form-label-width` to adjust label column width.
 */
export function FormRow(props: FormRowProps): React.JSX.Element

export interface FormRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label text shown in the left column */
  label: React.ReactNode
}

// FormGroup

/**
 * Groups FormRows so their labels auto-size to the widest label using CSS Grid subgrid.
 */
export function FormGroup(props: FormGroupProps): React.JSX.Element

export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

// Box

/**
 * A grouped container ("box") matching macOS grouped content — a filled,
 * hairline-bordered rounded rectangle for visually grouping related controls.
 * An optional `label` renders a header above the content.
 *
 * ```tsx
 * import { Box, FormGroup, FormRow } from 'bike/components'
 * <Box label="Row templates">
 *   <FormGroup>
 *     <FormRow label="Year"><input type="text" /></FormRow>
 *   </FormGroup>
 * </Box>
 * ```
 */
export function Box(props: BoxProps): React.JSX.Element

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Header shown above the box content */
  label?: React.ReactNode
}

// Disclosure

/**
 * A macOS-style disclosure triangle with a label.
 * Collapsed: shows the label with a right-pointing triangle.
 * Expanded: shows the label with a down-pointing triangle and reveals children.
 *
 * Content layout is adjustable with two custom properties, both no-ops unless
 * set: `--bike-disclosure-content-indent` insets the content's leading edge,
 * and `--bike-disclosure-content-spacing-after` adds separation below it. The
 * component publishes `--bike-disclosure-triangle-width`, so to align content
 * with the label rather than the triangle, set the indent to
 * `calc(var(--bike-disclosure-triangle-width) + 4px)` (4px is the header gap).
 * Bike's extension-settings pane sets both; the inspector sets neither.
 */
export function Disclosure(props: DisclosureProps): React.JSX.Element

export interface DisclosureProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Label text shown next to the disclosure triangle */
  label: React.ReactNode
  /** Whether the disclosure is expanded (controlled) */
  expanded?: boolean
  /** Whether the disclosure starts expanded (uncontrolled, default: false) */
  defaultExpanded?: boolean
  /** Called when the expanded state changes */
  onChange?: (expanded: boolean) => void
  /** Optional accessory content (e.g. buttons) rendered in the header */
  accessory?: React.ReactNode
  /** Where to place the accessory: 'leading' (inline after label, default) or 'trailing' (right side) */
  accessoryAlignment?: 'leading' | 'trailing'
}

// Separator

/** A horizontal divider line matching macOS separator appearance. */
export function Separator(props: SeparatorProps): React.JSX.Element

export interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {}

// SegmentedControl

/**
 * A tab-like segmented control matching NSSegmentedControl appearance.
 *
 * `size` scales the text as well as the metrics, on the same
 * `NSFont.systemFontSize(for:)` scale as `Button` and `Label`'s `size`: mini
 * 9px, small 11px, regular and large 13px. `large` shares Regular's text size
 * because AppKit enlarges a large control's metrics, not its text.
 */
export function SegmentedControl(props: SegmentedControlProps): React.JSX.Element

export interface SegmentedControlItem {
  /** Value identifier for this segment */
  value: string
  label: React.ReactNode
}

export interface SegmentedControlProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: SegmentedControlItem[]
  /** Currently selected value */
  value?: string
  /** Called when selection changes */
  onChange?: (value: string) => void
  /** Control size (default: "regular") */
  size?: 'mini' | 'small' | 'regular' | 'large'
}

// RadioGroup

/**
 * A vertical group of radio buttons — one mutually exclusive choice, matching
 * how Interface Builder presents an NSButton radio group. Use it over
 * `SegmentedControl` when the options are a settings choice rather than a view
 * switch, and over several `Checkbox`es when exactly one must be selected.
 *
 * ```tsx
 * import { RadioGroup } from 'bike/components'
 * <RadioGroup
 *   items={[
 *     { value: 'pie', label: 'Pie chart' },
 *     { value: 'fraction', label: 'Fraction' },
 *     { value: 'none', label: 'None' },
 *   ]}
 *   value={style}
 *   onChange={setStyle}
 * />
 * ```
 *
 * The type parameter is inferred from `items`, so `onChange` receives that union
 * rather than a bare `string`.
 */
export function RadioGroup<T extends string = string>(props: RadioGroupProps<T>): React.JSX.Element

export interface RadioGroupItem<T extends string = string> {
  /** Value identifier for this option */
  value: T
  /** Display label */
  label: React.ReactNode
}

export interface RadioGroupProps<T extends string = string> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: RadioGroupItem<T>[]
  /** Currently selected value */
  value?: T
  /** Called when selection changes */
  onChange?: (value: T) => void
  /**
   * Shared `name` for the underlying inputs. Defaults to a generated
   * per-instance id, which is what keeps two groups on one page from behaving
   * as a single group — only set this to join an existing form.
   */
  name?: string
  /**
   * Dims every option and stops the group responding to clicks. The whole
   * group is what gets disabled — there is no per-item flag.
   */
  disabled?: boolean
}
