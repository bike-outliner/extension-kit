import { View } from './workspace'
import { DOMScript, DOMScriptHandle } from './dom-script'
import { DOMProtocol } from '../core/dom-protocol'

/**
 * Interface for adding extension settings UI.
 *
 * See the calendar extension in core-extensions for a working example.
 */
export interface Settings extends View {
  /** Add an item to extension settings. */
  addItem<P extends DOMProtocol = DOMProtocol>(item: SettingsItem): Promise<DOMScriptHandle<P>>
}

export type SettingsItem = {
  /** Stable within the extension; keys the item's section in the pane. */
  id: string
  /** Section label; the pane sorts sections by it. Localize it with `bike.localize`. */
  label: string
  /** The script to run */
  script: DOMScript
}
