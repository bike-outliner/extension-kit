// `bike/components`. A path-mapped module, not `declare module`, so the
// relative `SFSymbolName` import type-checks.

import * as React from 'react'
import { SFSymbolName } from '../core/bike-globals'

// SFSymbol

/** Colored by `currentColor`. */
export function SFSymbol(props: SFSymbolProps): React.JSX.Element

export interface SFSymbolProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: SFSymbolName
  weight?: 'ultralight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'
  scale?: 'small' | 'medium' | 'large'
}

// Checkbox

export function Checkbox(props: CheckboxProps): React.JSX.Element

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label. */
  children?: React.ReactNode
}

// Button

/** Capsule button. */
export function Button(props: ButtonProps): React.JSX.Element

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Same scale as `Label.size`. Default `regular`. */
  size?: 'mini' | 'small' | 'regular' | 'large'
}

// Label

/**
 * `font` sets family and weight; `size` overrides the point size, e.g.
 * `<Label font="headline" size="small">` is semibold 11px.
 */
export function Label(props: LabelProps): React.JSX.Element

export interface LabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Default primary (`--label`). */
  color?: 'secondary' | 'tertiary'
  /** Semantic text style. Default body. */
  font?: 'headline' | 'subheadline' | 'caption' | 'footnote'
  /**
   * Control size per `NSFont.systemFontSize(for:)`: regular and large 13px,
   * small 11px, mini 9px. Scales text as well as control metrics.
   */
  size?: 'large' | 'regular' | 'small' | 'mini'
}

// FormRow

/** Label column width is `--bike-form-label-width`. */
export function FormRow(props: FormRowProps): React.JSX.Element

export interface FormRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Left column. */
  label: React.ReactNode
}

// FormGroup

/** Sizes contained FormRow labels to the widest one. */
export function FormGroup(props: FormGroupProps): React.JSX.Element

export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

// Box

/** macOS grouped-content box. */
export function Box(props: BoxProps): React.JSX.Element

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Header above the content. */
  label?: React.ReactNode
}

// Disclosure

/**
 * Disclosure triangle revealing children. Unset by default,
 * `--bike-disclosure-content-indent` and
 * `--bike-disclosure-content-spacing-after` adjust content layout. Indent
 * `calc(var(--bike-disclosure-triangle-width) + 4px)` aligns content with the
 * label.
 */
export function Disclosure(props: DisclosureProps): React.JSX.Element

export interface DisclosureProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  label: React.ReactNode
  /** Controlled. */
  expanded?: boolean
  /** Uncontrolled. Default false. */
  defaultExpanded?: boolean
  onChange?: (expanded: boolean) => void
  /** Header content, e.g. buttons. */
  accessory?: React.ReactNode
  /** `leading` (after the label, default) or `trailing`. */
  accessoryAlignment?: 'leading' | 'trailing'
}

// Separator

export function Separator(props: SeparatorProps): React.JSX.Element

export interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {}

// SegmentedControl

export function SegmentedControl(props: SegmentedControlProps): React.JSX.Element

export interface SegmentedControlItem {
  value: string
  label: React.ReactNode
}

export interface SegmentedControlProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: SegmentedControlItem[]
  /** Selected value. */
  value?: string
  onChange?: (value: string) => void
  /** Same scale as `Label.size`. Default `regular`. */
  size?: 'mini' | 'small' | 'regular' | 'large'
}

// RadioGroup

/** Vertical radio buttons. `T` is inferred from `items`. */
export function RadioGroup<T extends string = string>(props: RadioGroupProps<T>): React.JSX.Element

export interface RadioGroupItem<T extends string = string> {
  value: T
  label: React.ReactNode
}

export interface RadioGroupProps<T extends string = string> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: RadioGroupItem<T>[]
  /** Selected value. */
  value?: T
  onChange?: (value: T) => void
  /** Input `name`. Default a generated per-instance id. */
  name?: string
  /** Disables the whole group; there is no per-item flag. */
  disabled?: boolean
}
