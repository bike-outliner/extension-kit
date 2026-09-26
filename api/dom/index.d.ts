import { JSONValue } from '../core/json'
import { Message, DOMProtocol } from '../core/dom-protocol'
export { JSONValue } from '../core/json'
export { Message, DOMProtocol } from '../core/dom-protocol'

/**
 * Passed to the DOM script's `activate(context)`. `common.css` provides system
 * font classes and light/dark CSS custom properties.
 */
export interface DOMExtensionContext<P extends DOMProtocol = DOMProtocol>
  extends Record<string, any> {
  /** Render into this element. */
  element: HTMLElement

  onmessage?: (message: P['toDOM']) => void

  postMessage: (message: P['toApp']) => void

}
