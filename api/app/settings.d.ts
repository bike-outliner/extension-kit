import { View } from './workspace'
import { DOMScript, DOMScriptHandle } from './dom-script'
import { DOMProtocol } from '../core/dom-protocol'

/** Extension settings UI. */
export interface Settings extends View {
  addItem<P extends DOMProtocol = DOMProtocol>(item: SettingsItem): Promise<DOMScriptHandle<P>>
}

export type SettingsItem = {
  /** Currently unused. */
  label: string
  script: DOMScript
}
