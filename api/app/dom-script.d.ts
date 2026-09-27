/**
 * DOMScripts allow extensions to display UI using HTML/DOM.
 *
 * Normally, extension code runs in a headless JSContext. This code has access
 * to Bike-specific APIs, but cannot use HTML/DOM. To display custom UI your
 * extension installs a DOMScript into a WebView that's hosted by Bike.
 *
 * If you've used Web Workers, the architecture will feel familiar: both run in
 * isolated script contexts and communicate with the originating context using
 * `postMessage` and `onmessage`. DOMScripts do not have access to standard
 * extension APIs, and for security some HTML/DOM APIs (e.g., network access)
 * are disabled.
 *
 * DOMScripts are loaded by name and must be located in the `src/dom` folder of
 * your extension. Bike API's that allow you to install DOMScripts include
 * `window.presentSheet` and `window.inspector.addItem`.
 *
 * Scripts tied to a window default `bike.session`'s omitted `outline`/`editor`
 * to that window's.
 */

import { Disposable, URL } from './system'
import { Rect } from '../core/geometry'
import { DOMProtocol } from '../core/dom-protocol'

/** Sent to `onmessage` by Bike. */
export type SheetEvent = { type: 'bike:dismissed' }

/** Sent to `onmessage` by Bike. */
export type PanelEvent = { type: 'bike:dismissed' }

/**
 * Name of a script located in extension's src/dom folder or JavaScript code
 * that can be executed. Will first look for a file in src/dom with this name.
 * If that is not found then the passed string is used as JavaScript code
 * directly (no compile step).
 */
export type DOMScript = string

/**
 * A handle to send and receive messages with a DOMScript. Use `.dispose()` to
 * remove the script.
 *
 * @see {@link https://github.com/bike-outliner/extension-kit/blob/main/docs/dom-context-tutorial.md#define-a-typed-messaging-protocol | Typed Messaging Protocols}
 */
export interface DOMScriptHandle<P extends DOMProtocol = DOMProtocol>
  extends Disposable {
  /**
   * Receive messages from the DOM context.
   */
  onmessage?: (message: P['toApp']) => void

  /**
   * Send messages to the DOM context.
   */
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
  /** Unique identifier for frame autosave. */
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
