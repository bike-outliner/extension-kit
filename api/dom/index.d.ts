import { Json, Message } from '../core/json'
export { Json, Message } from '../core/json'

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
export interface DOMExtensionContext<
  TSend extends Message = Message,
  TReceive extends Message = Message
> extends Record<string, any> {
  /** The element where the extension should display */
  element: HTMLElement

  /**
   * Receive messages from the app context.
   * @param message
   */
  onmessage?: (message: TReceive) => void

  /**
   * Send messages to the app context.
   * @param message
   */
  postMessage: (message: TSend) => void
}
