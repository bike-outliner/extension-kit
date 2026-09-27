import { View } from './workspace'
import { DOMScript, DOMScriptHandle } from './dom-script'
import { DOMProtocol } from '../core/dom-protocol'

/** Extension settings UI. */
export interface Settings extends View {
  /** Add an item to extension settings. */
  addItem<P extends DOMProtocol = DOMProtocol>(item: SettingsItem): Promise<DOMScriptHandle<P>>
}

export type SettingsItem = {
  /** Label (unused currently) */
  label: string
  /** The script to run */
  script: DOMScript
}
