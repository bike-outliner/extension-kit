export interface AlertOptions {
  title?: string
  message?: string
  style?: AlertStyle
  buttons?: string[]
  fields?: AlertField[]
}

export interface AlertField {
  id: string
  type: AlertFieldType
  label?: string
  placeholder?: string
  defaultValue?: string | boolean | number
  /** For `dropdown` fields. */
  dropdownOptions?: string[]
}

export interface AlertResult {
  /** Title of the dismissing button. */
  button: string
  /** Keyed by field `id`. */
  values: Record<string, string | boolean | number>
}

export type AlertStyle = 'informational' | 'warning' | 'critical'
export type AlertFieldType = 'text' | 'secure' | 'checkbox' | 'dropdown'
