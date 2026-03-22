import * as React from 'react'
import './components.css'

// SFSymbol

/**
 * Renders an SF Symbol using CSS mask-image so its color follows the
 * current CSS color (inherits from parent or set via `style`/`className`).
 *
 * ```tsx
 * import { SFSymbol } from 'bike/components'
 * <SFSymbol name="chevron.left" scale="small" weight="medium" />
 * ```
 */
export function SFSymbol({ name, weight, scale, style, className = '', ...rest }: SFSymbolProps) {
  const url = symbolURL(name, { weight, scale })
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null)

  React.useEffect(() => {
    const img = new Image()
    img.src = url
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1
      setSize({ width: img.naturalWidth / dpr, height: img.naturalHeight / dpr })
    }
  }, [url])

  const maskStyle: React.CSSProperties = {
    ...style,
    ...(size ? { width: size.width, height: size.height } : {}),
    maskImage: `url(${url})`,
    WebkitMaskImage: `url(${url})`,
  }
  const classes = ['bike-symbol', className].filter(Boolean).join(' ')
  return <span className={classes} style={maskStyle} role="img" aria-label={name} {...rest} />
}

export interface SFSymbolProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** SF Symbol name (e.g. "chevron.left", "star.fill") */
  name: string
  /** Symbol weight */
  weight?: 'ultralight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'
  /** Symbol scale */
  scale?: 'small' | 'medium' | 'large'
}

// Button

/**
 * A macOS-styled capsule button in three sizes.
 *
 * ```tsx
 * import { Button } from 'bike/components'
 * <Button onClick={handleSave}>Save</Button>
 * <Button size="small">Details</Button>
 * <Button size="large">Continue</Button>
 * ```
 */
export function Button({ size = 'regular', className = '', ...rest }: ButtonProps) {
  const classes = [
    'bike-button',
    size !== 'regular' ? `bike-button--${size}` : '',
    className,
  ].filter(Boolean).join(' ')
  return <button className={classes} {...rest} />
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button size (default: "regular") */
  size?: 'mini' | 'small' | 'regular' | 'large'
}

// Label

/**
 * Text label with system font and color variants.
 *
 * ```tsx
 * import { Label } from 'bike/components'
 * <Label>Primary text</Label>
 * <Label color="secondary" font="caption">Timestamp</Label>
 * <Label color="tertiary" font="footnote">Help text</Label>
 * ```
 */
export function Label({ color, font, className = '', children, ...rest }: LabelProps) {
  const classes = [
    'bike-label',
    color ? `bike-label--${color}` : '',
    font ? `bike-label--${font}` : '',
    className,
  ].filter(Boolean).join(' ')
  return <span className={classes} {...rest}>{children}</span>
}

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
 *
 * ```tsx
 * import { FormRow } from 'bike/components'
 * <FormRow label="Name">
 *   <input type="text" />
 * </FormRow>
 * <FormRow label="Type">
 *   <SegmentedControl ... />
 * </FormRow>
 * ```
 */
export function FormRow({ label, children, className = '', ...rest }: FormRowProps) {
  const classes = ['bike-form-row', className].filter(Boolean).join(' ')
  return (
    <div className={classes} {...rest}>
      <span className="bike-form-row__label">{label}</span>
      <span className="bike-form-row__content">{children}</span>
    </div>
  )
}

export interface FormRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label text shown in the left column */
  label: React.ReactNode
}

// Disclosure

/**
 * A macOS-style disclosure triangle with a label.
 *
 * ```tsx
 * import { Disclosure } from 'bike/components'
 * <Disclosure label="Details" defaultExpanded>
 *   <FormRow label="Name"><input type="text" /></FormRow>
 * </Disclosure>
 * ```
 */
export function Disclosure({ label, expanded, defaultExpanded = false, onChange, accessory, accessoryAlignment = 'leading', children, className = '', ...rest }: DisclosureProps) {
  const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded)
  const isExpanded = expanded !== undefined ? expanded : internalExpanded

  const toggle = () => {
    const next = !isExpanded
    if (expanded === undefined) setInternalExpanded(next)
    onChange?.(next)
  }

  const classes = ['bike-disclosure', className].filter(Boolean).join(' ')
  return (
    <div className={classes} {...rest}>
      <div className="bike-disclosure__header">
        <button className="bike-disclosure__toggle" onClick={toggle} type="button">
          <SFSymbol className={`bike-disclosure__triangle${isExpanded ? ' bike-disclosure__triangle--expanded' : ''}`} name="chevron.forward" weight="semibold" scale="small" />
          <span className="bike-disclosure__label">{label}</span>
          {accessory && accessoryAlignment === 'leading' && <span className="bike-disclosure__accessory bike-disclosure__accessory--leading">{accessory}</span>}
        </button>
        {accessory && accessoryAlignment === 'trailing' && <span className="bike-disclosure__accessory">{accessory}</span>}
      </div>
      {isExpanded && children && <div className="bike-disclosure__content">{children}</div>}
    </div>
  )
}

export interface DisclosureProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  label: React.ReactNode
  expanded?: boolean
  defaultExpanded?: boolean
  onChange?: (expanded: boolean) => void
  /** Optional accessory content (e.g. buttons) rendered in the header */
  accessory?: React.ReactNode
  /** Where to place the accessory: 'trailing' (right side, default) or 'leading' (inline after label) */
  accessoryAlignment?: 'leading' | 'trailing'
}

// FormGroup

/**
 * Groups FormRows so their labels auto-size to the widest label using CSS Grid subgrid.
 *
 * ```tsx
 * import { FormGroup, FormRow } from 'bike/components'
 * <FormGroup>
 *   <FormRow label="Name"><input type="text" /></FormRow>
 *   <FormRow label="Description"><input type="text" /></FormRow>
 * </FormGroup>
 * ```
 */
export function FormGroup({ className = '', ...rest }: FormGroupProps) {
  const classes = ['bike-form-group', className].filter(Boolean).join(' ')
  return <div className={classes} {...rest} />
}

export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

// Separator

/**
 * A horizontal divider line matching macOS separator appearance.
 *
 * ```tsx
 * import { Separator } from 'bike/components'
 * <Separator />
 * ```
 */
export function Separator({ className = '', ...rest }: SeparatorProps) {
  const classes = ['bike-separator', className].filter(Boolean).join(' ')
  return <hr className={classes} {...rest} />
}

export interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {}

// SegmentedControl

/**
 * A tab-like segmented control matching NSSegmentedControl appearance.
 *
 * ```tsx
 * import { SegmentedControl } from 'bike/components'
 * const [view, setView] = useState('list')
 * <SegmentedControl
 *   items={[
 *     { value: 'list', label: 'List' },
 *     { value: 'grid', label: 'Grid' },
 *   ]}
 *   value={view}
 *   onChange={setView}
 * />
 * ```
 */
export function SegmentedControl({ items, value, onChange, size = 'regular', className = '', ...rest }: SegmentedControlProps) {
  const classes = [
    'bike-segmented',
    size !== 'regular' ? `bike-segmented--${size}` : '',
    className,
  ].filter(Boolean).join(' ')
  return (
    <div className={classes} role="tablist" {...rest}>
      {items.map((item) => (
        <button
          key={item.value}
          className={`bike-segmented__item${item.value === value ? ' bike-segmented__item--selected' : ''}`}
          role="tab"
          aria-selected={item.value === value}
          onClick={() => onChange?.(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

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
