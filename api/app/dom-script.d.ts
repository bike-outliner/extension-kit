/**
 * DOMScripts allow extensions to display UI using HTML/DOM.
 *
 * Normally, extension code runs in a headless JSContext. This code has access
 * to Bike-specific APIs, but cannot use HTML/DOM. To display custom UI your
 * extension installs a DOMScript into a WebView that's hosted by Bike.
 *
 * If you've used Web Workers, the architecture will feel familiar: both run in
 * isolated script contexts and communicate with the originating context using
 * `postMessage` and `onmessage`.
 *
 * DOMScripts are loaded by name and must be located in the `src/dom` folder of
 * your extension. Bike API's that allow you to install DOMScripts include
 * `window.presentSheet` and `window.inspector.addItem`.
 *
 * DOMScripts Summary:
 *
 * 1. Used to display UI using HTML/DOM.
 * 2. Do not have access to standard extension APIs.
 * 3. Run in a separate context from standard extension code.
 * 4. Must be located in the extension's `src/dom` folder and loaded by name.
 * 5. Communicate with extension code via `postMessage` and `onmessage`.
 * 6. For security some HTML/DOM APIs (e.g., network access) are disabled.
 *
 * DOMScripts created with a window relationship — inspector items, sheets,
 * and panels shown with an explicit window — are bound to that host window:
 * their `bike.session` calls default omitted `outline`/`editor` params to the
 * host window's outline/editor (stable as windows reorder) instead of the
 * app-frontmost one. See `bike.session` docs in `bike/dom`.
 */

import { Disposable, URL } from './system'
import { Rect } from '../core/geometry'
import { DOMProtocol } from '../core/dom-protocol'

/** Lifecycle events sent by Bike when hosting a sheet. */
export type SheetEvent = { type: 'bike:dismissed' }

/** Lifecycle events sent by Bike when hosting a panel. */
export type PanelEvent = { type: 'bike:dismissed' }

/**
 * Name of a script located in extension's src/dom folder or JavaScript code
 * that can be executed. Will first look for a file in src/dom with this name.
 * If that is not found then the passed string is used as JavaScript code
 * directly — it must be valid JavaScript that can run in a JSContext as-is
 * (there is no compile step).
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
   * @param message
   */
  onmessage?: (message: P['toApp']) => void

  /**
   * Send messages to the DOM context.
   * @param message
   */
  postMessage(message: P['toDOM']): void
}

/** A DOMScriptHandle whose receive channel includes sheet lifecycle events. */
export type SheetHandle<P extends DOMProtocol = DOMProtocol> =
  DOMScriptHandle<{ toDOM: P['toDOM']; toApp: P['toApp'] | SheetEvent }>

/** A DOMScriptHandle whose receive channel includes panel lifecycle events. */
export type PanelHandle<P extends DOMProtocol = DOMProtocol> =
  DOMScriptHandle<{ toDOM: P['toDOM']; toApp: P['toApp'] | PanelEvent }> & {
    /**
     * Make the panel window key and order it to the front. Also
     * activates the bike application.
     */
    activate(): void

    /**
     * Panel frame in points, AppKit global coordinates (bottom-left
     * origin). Read returns the current frame; write moves and resizes
     * the panel immediately. Assigning a malformed Rect (missing keys)
     * is a no-op.
     */
    frame: Rect
  }
