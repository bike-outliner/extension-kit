import { View } from './bike'
import { DOMScript, DOMScriptHandle } from './dom-script'
import { DOMProtocol } from '../core/dom-protocol'

/**
 * Interface for adding extension settings UI.
 *
 * See the calendar extension in core-extensions for a working example
 * (`src/calendar.bkext/app/main.ts` and `src/calendar.bkext/dom/Settings.tsx`).
 */
export interface Settings extends View {
  /**
   * Add an item to extension settings.
   *
   * @param item - The settings item to add.
   * @returns A promise that resolves to a DOMScriptHandle.
   * @see {@link https://github.com/bike-outliner/extension-kit/blob/main/docs/dom-context-tutorial.md#define-a-typed-messaging-protocol | Typed Messaging Protocols}
   */
  addItem<P extends DOMProtocol = DOMProtocol>(item: SettingsItem): Promise<DOMScriptHandle<P>>
}

export type SettingsItem = {
  /** Label (unused currently) */
  label: string
  /** The DOM script to run. */
  script: DOMScript
}
