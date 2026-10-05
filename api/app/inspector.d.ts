import { View } from './workspace'
import { DOMScript, DOMScriptHandle } from './dom-script'
import { DOMProtocol } from '../core/dom-protocol'

/**
 * Interface for adding items to the inspector panel.
 *
 * See the calendar extension in core-extensions for a working example
 * (`src/calendar.bkext/app/main.ts` and `src/calendar.bkext/dom/Calendar.tsx`).
 */
export interface Inspector extends View {
  /**
   * Add an item to the inspector.
   *
   * @see {@link https://github.com/bike-outliner/extension-kit/blob/main/docs/dom-context-tutorial.md#define-a-typed-messaging-protocol | Typed Messaging Protocols}
   */
  addItem<P extends DOMProtocol = DOMProtocol>(item: InspectorItem): Promise<DOMScriptHandle<P>>
}

export type InspectorItem = {
  /** Stable within the extension; keys the user's tab and visibility choices. */
  id: string
  /** Label shown in the tab bar tooltip. Localize it with `bike.localize`. */
  label: string
  script: DOMScript
}
