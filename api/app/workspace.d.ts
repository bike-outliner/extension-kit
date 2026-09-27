import { Sidebar } from './sidebar'
import { Inspector } from './inspector'
import { OutlineEditor } from './outline-editor'
import { Outline } from './outline'
import { DOMScript, SheetHandle, SheetOptions } from './dom-script'
import { URL, Disposable } from './system'
import { Rect } from '../core/geometry'
import { DOMProtocol } from '../core/dom-protocol'
import { JSONStore } from '../core/json'

/** Interface for an open document. */
export interface Document {
  readonly fileURL?: URL
  readonly fileType: string
  readonly displayName: string
  readonly windows: Window[] // ordered front to back
  readonly frontmostWindow?: Window
  readonly outline: Outline

  /** Activates the frontmost window. No-op without windows. */
  activate(): void

  /** Called once when the document closes. */
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
   * Points, AppKit global coordinates (bottom-left origin). Setting moves and
   * resizes immediately; a Rect with missing keys is ignored.
   */
  frame: Rect

  observeCurrentOutlineEditor(handler: (_: OutlineEditor | undefined) => void): Disposable

  /** Called once when the window closes. */
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

  /** Makes this window key and frontmost, and activates Bike. */
  activate(): void
}

/** Interface for a view in the UI. */
export interface View {}

/** A connected display. */
export interface Screen {
  /** Stable for the session. */
  readonly id: string
  /** Localized, e.g. "Built-in Retina Display". */
  readonly name: string
  /** Backing scale factor. */
  readonly scale: number
  /** Points. */
  readonly frame: Rect
  /** `frame` minus the menu bar and Dock. */
  readonly visibleFrame: Rect
}
