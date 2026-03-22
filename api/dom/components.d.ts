declare module 'bike/components' {
  import * as React from 'react'

  // SFSymbol

  /** Renders an SF Symbol using CSS mask-image, colored by `currentColor`. */
  export function SFSymbol(props: SFSymbolProps): React.JSX.Element

  export interface SFSymbolProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** SF Symbol name (e.g. "chevron.left", "star.fill") */
    name: string
    /** Symbol weight */
    weight?: 'ultralight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'
    /** Symbol scale */
    scale?: 'small' | 'medium' | 'large'
  }

  // Button

  /** A macOS-styled capsule button in three sizes. */
  export function Button(props: ButtonProps): React.JSX.Element

  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Button size (default: "regular") */
    size?: 'mini' | 'small' | 'regular' | 'large'
  }

  // Label

  /** Text label with system font and color variants. */
  export function Label(props: LabelProps): React.JSX.Element

  export interface LabelProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Text color (default: primary/--label) */
    color?: 'secondary' | 'tertiary'
    /** Font style */
    font?: 'headline' | 'subheadline' | 'caption' | 'footnote'
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

  // Disclosure

  /**
   * A macOS-style disclosure triangle with a label.
   * Collapsed: shows the label with a right-pointing triangle.
   * Expanded: shows the label with a down-pointing triangle and reveals children.
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

  /** A tab-like segmented control matching NSSegmentedControl appearance. */
  export function SegmentedControl(props: SegmentedControlProps): React.JSX.Element

  export interface SegmentedControlItem {
    /** Value identifier for this segment */
    value: string
    /** Display label */
    label: React.ReactNode
  }

  export interface SegmentedControlProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
    /** Segment items */
    items: SegmentedControlItem[]
    /** Currently selected value */
    value?: string
    /** Called when selection changes */
    onChange?: (value: string) => void
    /** Control size (default: "regular") */
    size?: 'mini' | 'small' | 'regular' | 'large'
  }
}
