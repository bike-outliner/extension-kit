/**
 * DOM scripts run in a Bike-hosted WebView with network access blocked. They
 * exchange messages with the app context and get `bike.session` and
 * `bike.attachmentURL` instead of the app API.
 *
 * Installed by `window.presentSheet`, `window.inspector.addItem`,
 * `bike.showPanel`, and `bike.settings.addItem`. Scripts tied to a window
 * default `bike.session`'s omitted `outline`/`editor` to that window's.
 */

import { Disposable, URL } from './system'
import { Rect } from '../core/geometry'
import { DOMProtocol } from '../core/dom-protocol'

/** Sent to `onmessage` by Bike. */
export type SheetEvent = { type: 'bike:dismissed' }

/** Sent to `onmessage` by Bike. */
export type PanelEvent = { type: 'bike:dismissed' }

/**
 * Name of a script in the extension's `src/dom` folder, or, if no such file
 * exists, JavaScript source run as-is (no compile step).
 */
export type DOMScript = string

/**
 * `dispose()` removes the script.
 * @see {@link https://github.com/bike-outliner/extension-kit/blob/main/docs/dom-context-tutorial.md#define-a-typed-messaging-protocol | Typed Messaging Protocols}
 */
export interface DOMScriptHandle<P extends DOMProtocol = DOMProtocol>
  extends Disposable {
  onmessage?: (message: P['toApp']) => void

  postMessage(message: P['toDOM']): void
}

export interface SheetOptions {
  width?: number
  height?: number
}

/**
 * Defaults for `floating` / `canBecomeMain` / `hidesOnDeactivate`:
 * `inspector` (default) and `utility` true / false / true; `window`
 * false / true / false.
 */
export type PanelRole = 'inspector' | 'utility' | 'window'

export interface PanelOptions {
  script: DOMScript
  title?: string
  role?: PanelRole
  /** Default from `role`. */
  floating?: boolean
  /** Default from `role`. */
  hidesOnDeactivate?: boolean
  /** Default from `role`. */
  canBecomeMain?: boolean
  /** Frame autosave key. */
  id?: string
  /** Initial frame, as `Window.frame`. Default centered on the main screen. */
  frame?: Rect
}

export type SheetHandle<P extends DOMProtocol = DOMProtocol> =
  DOMScriptHandle<{ toDOM: P['toDOM']; toApp: P['toApp'] | SheetEvent }>

export type PanelHandle<P extends DOMProtocol = DOMProtocol> =
  DOMScriptHandle<{ toDOM: P['toDOM']; toApp: P['toApp'] | PanelEvent }> & {
    /** As `Window.activate`. */
    activate(): void

    /** As `Window.frame`. */
    frame: Rect
  }
