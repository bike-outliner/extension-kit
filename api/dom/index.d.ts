import { Json, Message, DOMProtocol } from '../core/json'
export { Json, Message, DOMProtocol } from '../core/json'

/**
 * DOMExtensionContext is passed to DOMScript's activate function.
 *
 * DOM scripts have access to the system font classes and CSS custom properties
 * defined in `common.css`. Use these to match macOS system appearance and adapt to light/dark mode.
 *
 * Example:
 *
 * ```ts
 * import { DOMExtensionContext } from "bike";
 * export async function activate(context: DOMExtensionContext) {
 *   context.element.textContent = "Hello World!";
 * }
 * ```
 */
export interface DOMExtensionContext<P extends DOMProtocol = DOMProtocol>
  extends Record<string, any> {
  /** The element where the extension should display */
  element: HTMLElement

  /**
   * Receive messages from the app context.
   * @param message
   */
  onmessage?: (message: P['toDOM']) => void

  /**
   * Send messages to the app context.
   * @param message
   */
  postMessage: (message: P['toApp']) => void
}
