import { View } from './workspace'
import { DOMScript, DOMScriptHandle } from './dom-script'
import { DOMProtocol } from '../core/dom-protocol'

export interface Inspector extends View {
  /**
   * @see {@link https://github.com/bike-outliner/extension-kit/blob/main/docs/dom-context-tutorial.md#define-a-typed-messaging-protocol | Typed Messaging Protocols}
   */
  addItem<P extends DOMProtocol = DOMProtocol>(item: InspectorItem): Promise<DOMScriptHandle<P>>
}

export type InspectorItem = {
  /** Tab bar tooltip. */
  label: string
  script: DOMScript
}
