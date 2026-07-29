/**
 * Options and results for `bike.showAlert` — a window or application modal
 * alert with optional input fields. Demonstrated by kitchensink.bkext's
 * `kitchensink:show-alert-demo`.
 */

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
  /** The choices of a `dropdown` field. */
  dropdownOptions?: string[]
}

export interface AlertResult {
  /** The title of the button that dismissed the alert. */
  button: string
  /** Field values at dismissal, keyed by each field's `id`. */
  values: Record<string, string | boolean | number>
}

export type AlertStyle = 'informational' | 'warning' | 'critical'
export type AlertFieldType = 'text' | 'secure' | 'checkbox' | 'dropdown'
