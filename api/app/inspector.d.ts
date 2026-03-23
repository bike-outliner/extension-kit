import { View } from './bike'
import { DOMScript, DOMScriptHandle } from './dom-script'
import { DOMProtocol } from '../core/dom-protocol'

export interface Inspector extends View {
  /**
   * Add an item to the inspector.
   *
   * @param item - The item to add to the inspector.
   * @returns A promise that resolves to a DOMScriptHandle.
   * @see {@link https://github.com/bike-outliner/extension-kit/blob/main/docs/dom-context-tutorial.md#define-a-typed-messaging-protocol | Typed Messaging Protocols}
   */
  addItem<P extends DOMProtocol = DOMProtocol>(item: InspectorItem): Promise<DOMScriptHandle<P>>
}

export type InspectorItem = {
  /** Label shown in the tab bar tooltip. */
  label: string
  /** The DOM script to run. */
  script: DOMScript
}
