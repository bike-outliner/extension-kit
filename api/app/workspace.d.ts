import { Sidebar } from './sidebar'
import { Inspector } from './inspector'
import { OutlineEditor } from './outline-editor'
import { Outline } from './outline'
import { DOMScript, SheetHandle, SheetOptions } from './dom-script'
import { URL, Disposable } from './system'
import { Rect } from '../core/geometry'
import { DOMProtocol } from '../core/dom-protocol'
import { JSONStore } from '../core/json'

export interface Document {
  readonly fileURL?: URL
  readonly fileType: string
  readonly displayName: string
  /** Front to back. */
  readonly windows: Window[]
  readonly frontmostWindow?: Window
  readonly outline: Outline

  /** Activates the frontmost window. No-op without windows. */
  activate(): void

  /** Called once when the document closes. */
  onClose(handler: () => void): Disposable
}

export interface Window {
  readonly screen?: Screen
  readonly title: string
  readonly sidebar: Sidebar
  readonly inspector: Inspector
  readonly documents: Document[]
  readonly outlineEditors: OutlineEditor[]
  readonly currentOutlineEditor?: OutlineEditor
  readonly restorableState: JSONStore

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
   * Presents a DOM script as a sheet.
   * @see {@link https://github.com/bike-outliner/extension-kit/blob/main/docs/dom-context-tutorial.md#define-a-typed-messaging-protocol | Typed Messaging Protocols}
   */
  presentSheet<P extends DOMProtocol = DOMProtocol>(script: DOMScript, options?: SheetOptions): Promise<SheetHandle<P>>

  /** Makes this window key and frontmost, and activates Bike. */
  activate(): void
}

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
