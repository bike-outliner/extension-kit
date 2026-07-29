import { Sidebar } from './sidebar'
import { Inspector } from './inspector'
import { OutlineEditor } from './outline-editor'
import { Outline } from './outline'
import { DOMScript, SheetHandle, SheetOptions } from './dom-script'
import { URL, Disposable } from './system'
import { Rect } from '../core/geometry'
import { DOMProtocol } from '../core/dom-protocol'
import { JSONStore } from '../core/json'

// The WORKSPACE object model — documents, the windows that show them, and
// the screens those sit on: what `bike.documents` / `bike.windows` /
// `bike.screens` (and their frontmost accessors) hand out. "Workspace" is
// the native side's name for these windows (BikeMac's WorkspaceWindow).

/** Interface for an open document. */
export interface Document {
  readonly fileURL?: URL
  readonly fileType: string
  readonly displayName: string
  readonly windows: Window[] // ordered front to back
  readonly frontmostWindow?: Window
  readonly outline: Outline

  /**
   * Activate the document by bringing its frontmost window to the front
   * and making it key. Also activates the bike application.
   * No-op if the document has no windows.
   */
  activate(): void

  /**
   * Register a handler called once, when this document closes.
   *
   * @param handler - Called once when the document closes.
   * @returns A Disposable that unregisters the handler.
   */
  onClose(handler: () => void): Disposable
}

/** Interface for a document window. */
export interface Window {
  readonly screen?: Screen
  readonly title: string
  readonly sidebar: Sidebar
  readonly inspector: Inspector
  readonly documents: Document[]
  readonly outlineEditors: OutlineEditor[]
  readonly currentOutlineEditor?: OutlineEditor
  readonly restorableState: JSONStore

  /** Read / Write subtitle access */
  subtitle: string

  /**
   * Window frame in points, AppKit global coordinates (bottom-left origin).
   * Read returns the current frame; write moves and resizes the window
   * immediately. Assigning a malformed Rect (missing keys) is a no-op.
   */
  frame: Rect

  observeCurrentOutlineEditor(handler: (_: OutlineEditor | undefined) => void): Disposable

  /**
   * Register a handler called once, when this window closes.
   *
   * @param handler - Called once when the window closes.
   * @returns A Disposable that unregisters the handler.
   */
  onClose(handler: () => void): Disposable

  /**
   * Present a WebView based sheet.
   *
   * Use the script parameter to load the DOMScript `src/dom/<script>` into
   * the WebView. The script should configure the DOM elements for display.
   *
   * @param script - The script to run.
   * @param options - The options for displaying the sheet.
   * @returns A promise that resolves to a DOMScriptHandle.
   * @see {@link https://github.com/bike-outliner/extension-kit/blob/main/docs/dom-context-tutorial.md#define-a-typed-messaging-protocol | Typed Messaging Protocols}
   */
  presentSheet<P extends DOMProtocol = DOMProtocol>(script: DOMScript, options?: SheetOptions): Promise<SheetHandle<P>>

  /**
   * Make this window key and order it to the front. Also activates the
   * bike application.
   */
  activate(): void
}

/** Interface for a view in the UI. */
export interface View {}

/** A connected display. */
export interface Screen {
  /** Stable identifier for the duration of the session */
  readonly id: string
  /** Localized display name (e.g. "Built-in Retina Display"). */
  readonly name: string
  /** Backing scale factor (1 on non-retina, 2 on retina). */
  readonly scale: number
  /** Full screen rect in points */
  readonly frame: Rect
  /** `frame` minus the menu bar and Dock */
  readonly visibleFrame: Rect
}
