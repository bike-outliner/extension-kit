import { Sidebar } from './sidebar'
import { Inspector } from './inspector'
import { Settings } from './settings'
import { Commands } from './commands'
import { Keybindings } from './keybindings'
import { OutlineEditor } from './outline-editor'
import { DOMScript, SheetHandle, PanelHandle } from './dom-script'
import { URL, Disposable, Permissions } from './system'
import { DOMProtocol } from '../core/dom-protocol'
import { Outline } from './outline'
import { JSONStore } from '../core/json'

interface SFSymbolOptions {
  weight?: 'ultralight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'
  scale?: 'small' | 'medium' | 'large'
}

declare global {
  /** The bike global API. */
  const bike: {
    /**
     * The user's macOS system locale as a BCP 47 language tag (e.g. "en-US",
     * "en-JP-u-ca-japanese", "de-DE").
     *
     * Includes region and calendar extensions from System Preferences.
     *
     * @example
     * ```typescript
     * new Date().toLocaleDateString(bike.systemLocale)
     * new Intl.DateTimeFormat(bike.systemLocale, { dateStyle: "long" }).format(new Date())
     * ```
     */
    readonly systemLocale: string

    /**
     * The user's preferred first day of the week from macOS System Preferences,
     * as a JavaScript day number (0 = Sunday, 1 = Monday, ..., 6 = Saturday).
     */
    readonly systemFirstWeekday: number

    /**
     * Extension defaults, backed by UserDefaults with the prefix
     * `bike.ext.<extensionId>.`.
     *
     * @example
     * ```typescript
     * const value = bike.defaults.get('theme')
     * bike.defaults.set('theme', 'dark')
     * bike.defaults.observe('theme', (v) => { console.log('changed:', v) })
     * ```
     */
    readonly defaults: JSONStore

    /**
     * Returns a `bike-extension://` URL for a file in this extension's folder.
     *
     * @param path - Relative path within the extension folder (e.g., "images/icon.png")
     * @returns A `bike-extension://` URL string.
     */
    extensionURL(path: string): string

    /**
     * Formats a Date object using a pattern string (date-fns / CLDR-inspired).
     *
     * @see https://date-fns.org/docs/format
     *
     * @example
     * ```typescript
     * bike.formatDate(new Date(), 'yyyy-MM-dd')       // "2026-04-09"
     * bike.formatDate(new Date(), 'MMMM d, yyyy')     // "April 9, 2026"
     * ```
     */
    formatDate(date: Date, pattern: string): string

    /** Returns a URL string for the named SF Symbol. */
    symbolURL(name: string, options?: SFSymbolOptions): string

    /** The build # of the bike app. */
    readonly build: number
    /** The version of the bike app. */
    readonly version: string
    /** The api version of the bike app. */
    readonly apiVersion: string
    /** The interface for adding commands. */
    readonly commands: Commands
    /** The interface for adding keybindings. */
    readonly keybindings: Keybindings
    /** The interface to read/write to the system clipboard. */
    readonly clipboard: Clipboard
    /** The interface for extension settings UI. */
    readonly settings: Settings
    /** Secure storage for secrets (API tokens, passwords, etc) */
    readonly keychain: Keychain

    /** All windows. */
    readonly windows: Window[]
    /** Frontmost window. */
    readonly frontmostWindow?: Window
    /** Observer called for all current and future windows. */
    observeWindows(handler: (_: Window) => void): Disposable
    /** Observer called current and future frontmost windows. */
    observeFrontmostWindow(handler: (_: Window | undefined) => void): Disposable

    /** All open documents. */
    readonly documents: Document[]
    /** Frontmost open document. */
    readonly frontmostDocument?: Document
    /** Observer called for all current and future documents. */
    observeDocuments(handler: (_: Document) => void): Disposable
    /** Observer called current and future frontmost documents. */
    observeFrontmostDocument(handler: (_: Document | undefined) => void): Disposable

    /** All outline editors. */
    readonly outlineEditors: OutlineEditor[]
    /** Frontmost outline editor */
    readonly frontmostOutlineEditor?: OutlineEditor
    /** Observer called for all current and future outline editors. */
    //observeOutlineEditors(handler: (_: OutlineEditor) => void): Disposable;
    /** Observer called current and future frontmost outline editors. */
    observeFrontmostOutlineEditor(handler: (_: OutlineEditor | undefined) => void): Disposable

    /**
     * Show a window or application modal alert.
     *
     * @param options - The options for the alert
     * @param window - A window to attatch the alert to
     * @returns A promise that resolves to the result of the alert.
     * @example
     * ```typescript
     * bike.showAlert({
     *   title: "Login",
     *   buttons: ["OK", "Cancel"],
     *   fields: [
     *     {
     *       type: "text",
     *       id: "username",
     *       placeholder: "Username",
     *     },
     *     {
     *       type: "secure",
     *       id: "password",
     *       placeholder: "Password",
     *     }
     *   ]
     * }).then(result => {
     *   if (result.button === "OK") {
     *     console.log("Username:", result.values.username);
     *     console.log("Password:", result.values.password);
     *   }
     * });
     * ```
     */
    showAlert(options: AlertOptions, window?: Window): Promise<AlertResult>

    /**
     * Show a fuzzy-filtering choice box for selecting from a list of items.
     *
     * @param items - The items to choose from
     * @param options - The options for the choice box
     * @param window - A window to attach the choice box to
     * @returns A promise that resolves to the selected indices, or null if cancelled.
     * @example
     * ```typescript
     * const indices = await bike.showChoiceBox(
     *   [
     *     { name: "First Option", symbol: "star" },
     *     { name: "Second Option", container: "Category A" },
     *     { name: "Third Option" }
     *   ],
     *   {
     *     placeholder: "Choose an option...",
     *     defaultSymbol: "circle",
     *     allowsMultipleSelection: false
     *   }
     * );
     *
     * if (indices !== null) {
     *   console.log("Selected index:", indices[0]);
     * }
     * ```
     */
    showChoiceBox(items: ChoiceBoxItem[], options?: ChoiceBoxOptions, window?: Window): Promise<number[] | null>

    /**
     * Show a panel or window.
     *
     * With `window`: the panel is associated with that document window and
     * closes when the window closes. Floating, non-modal (unlike sheets).
     *
     * Without `window`: standalone panel not tied to any document. And will
     * stay open until disposed by the extension or closed by user.
     *
     * @param options - The options for the panel
     * @param window - A window to associate the panel with
     * @returns A promise that resolves to a PaneHandle<P>.
     * @see
     * {@link https://github.com/bike-outliner/extension-kit/blob/main/docs/dom-context-tutorial.md#define-a-typed-messaging-protocol | Typed Messaging Protocols}
     * @example
     * ```typescript
     * // Panel associated with a window
     * const handle = await bike.showPanel({
     *   script: 'WordCount.js',
     *   title: 'Word Count',
     *   width: 300,
     *   height: 200,
     * }, bike.frontmostWindow)
     * handle.onmessage = (msg) => { /* ... *\/ }
     * handle.postMessage({ wordCount: 42 })
     * ```
     * @example
     * ```typescript
     * // Standalone panel with state restoration
     * const handle = await bike.showPanel({
     *   id: 'myext:log',
     *   script: 'ActivityLog.js',
     *   title: 'Activity Log',
     *   width: 700,
     *   height: 500,
     * })
     * ```
     */
    showPanel<P extends DOMProtocol = DOMProtocol>(options: PanelOptions, window?: Window): Promise<PanelHandle<P>>

    /**
     * Get an outline editor for testing.
     *
     * On first call, creates a new untitled document with an empty outline.
     * On subsequent calls, resets the existing test document to an empty
     * outline with no undo history and returns its editor.
     */
    testEditor(): OutlineEditor

    /**
     * Get an outline for testing.
     *
     * On first call, creates a new untitled document with an empty outline.
     * On subsequent calls, resets the existing test document to an empty
     * outline with no undo history and returns its outline.
     */
    testOutline(): Outline
  }
}

/**
 * ExtensionContext provides access to extension specific API. It is passed
 * through the extension's activate function.
 *
 * ```ts
 * import { ExtensionContext } from "bike";
 * export async function activate(context: ExtensionContext) {
 *     // extension code here
 * }
 * ```
 *
 * The extension context is indexed by string and is a good place to store
 * disposables and handles for later access.
 */
export interface AppExtensionContext extends Record<string, any> {
  readonly permissions: Permissions

}

/**
 * Secure storage for secrets (API tokens, passwords, OAuth tokens),
 * backed by the macOS Keychain.
 *
 * Each extension has its own isolated keychain namespace.
 *
 * @requires `keychain` permission
 * @example
 * ```typescript
 * bike.keychain.set('api-token', 'sk-abc123')
 * const token = bike.keychain.get('api-token')
 * bike.keychain.delete('api-token')
 * ```
 */
export interface Keychain {
  /** List all stored key names for this extension. */
  keys(): string[]
  /** Get a secret by key. Returns null if not found. */
  get(key: string): string | undefined
  /** Store a secret. Returns true on success. */
  set(key: string, value: string | undefined): boolean
  /** Delete a secret. Returns true on success. */
  delete(key: string): boolean
}

/** Interface for managing the clipboard. */
export interface Clipboard {
  /**
   * Reads the text from the clipboard.
   *
   * @requires `clipboardRead` permission
   * @param uti - The associated UTI. (default is "public.utf8-plain-text")
   * @returns The text from the clipboard.
   */
  readText(uti?: string): string

  /**
   * Writes the text to the clipboard.
   *
   * @requires `clipboardWrite` permission
   * @param string - The text to write to the clipboard.
   * @param uti - The associated UTI. (default is "public.utf8-plain-text")
   */
  writeText(string: string, uti?: string): void
}

/** Interface for an open document. */
export interface Document {
  readonly fileURL?: URL
  readonly fileType: string
  readonly displayName: string
  readonly windows: Window[] // ordered front to back
  readonly frontmostWindow?: Window
  readonly outline: Outline
}

/** Interface for a document window. */
export interface Window {
  readonly title: string
  readonly sidebar: Sidebar
  readonly inspector: Inspector
  readonly documents: Document[]
  readonly outlineEditors: OutlineEditor[]
  readonly currentOutlineEditor?: OutlineEditor
  readonly restorableState: JSONStore

  observeCurrentOutlineEditor(handler: (_: OutlineEditor | undefined) => void): Disposable

  /**
   * Present a WebView based sheet.
   *
   * Use the name parameter to load the DOMScript `src/dom/<name>` into
   * the WebView. The script should configure the DOM elements for display.
   *
   * @param script - The script to run.
   * @param options - The options for displaying the sheet.
   * @returns A promise that resolves to a DOMScriptHandle.
   * @see {@link https://github.com/bike-outliner/extension-kit/blob/main/docs/dom-context-tutorial.md#define-a-typed-messaging-protocol | Typed Messaging Protocols}
   */
  presentSheet<P extends DOMProtocol = DOMProtocol>(script: DOMScript, options?: SheetOptions): Promise<SheetHandle<P>>

  /*
  presentRowPicker(
    outline: Outline,
    options?: {
      title?: string
      path: OutlinePath
      allowsMultipleSelection?: boolean
      initialSelection?: string[]
    }
  ): Promise<Row[] | null>
  */
}

/** Interface for a view in the UI. */
export interface View {}

interface SheetOptions {
  width?: number
  height?: number
  //buttons?: string[];
}

type PanelRole = 'inspector' | 'utility' | 'window'

interface PanelOptions {
  /** The DOM script to run in the panel. */
  script: DOMScript
  /** Panel window title. */
  title?: string
  /** Initial width in points. */
  width?: number
  /** Initial height in points. */
  height?: number
  /**
   * Panel role that sets default window behavior.
   *
   * - `'inspector'` — small, floating, auxiliary. Defaults: floating=true,
   *   canBecomeMain=false, hidesOnDeactivate=false.
   * - `'utility'` — medium, tool-like. Defaults: floating=true,
   *   canBecomeMain=false, hidesOnDeactivate=true.
   * - `'window'` — full, document-like, non-floating. Uses NSWindow instead
   *   of NSPanel. Defaults: floating=false, canBecomeMain=true,
   *   hidesOnDeactivate=false.
   *
   * Individual properties (floating, canBecomeMain, hidesOnDeactivate) override
   * role defaults when specified. If no role is set, current defaults apply
   * (floating=true, canBecomeMain=false, hidesOnDeactivate=false).
   */
  role?: PanelRole
  /** Whether the panel floats above other windows. Defaults to true. */
  floating?: boolean
  /** Whether the panel hides when the app deactivates. Defaults to false. */
  hidesOnDeactivate?: boolean
  /** Whether the panel can become the main window. Defaults to false. */
  canBecomeMain?: boolean
  /** Unique identifier for frame autosave. */
  id?: string
}

interface AlertOptions {
  title?: string
  message?: string
  style?: AlertStyle
  buttons?: string[]
  fields?: AlertField[]
}

interface AlertField {
  id: string
  type: AlertFieldType
  label?: string
  placeholder?: string
  defaultValue?: string | boolean | number
  dropdownOptions?: string[]
}

interface AlertResult {
  button: string
  values: Record<string, string | boolean | number>
}

type AlertStyle = 'informational' | 'warning' | 'critical'
type AlertFieldType = 'text' | 'secure' | 'checkbox' | 'dropdown'

/** An item to display in a choice box. */
interface ChoiceBoxItem {
  /** The display name for this item. */
  name: string
  /** Optional container/category shown after the name (separated by tab). */
  container?: string
  /** Optional SF Symbol name to display beside the item. */
  symbol?: string
}

/** Options for configuring a choice box. */
interface ChoiceBoxOptions {
  /** Placeholder text shown in the search field. */
  placeholder?: string
  /** Default SF Symbol to use when an item doesn't specify one. */
  defaultSymbol?: string
  /** Whether the user can dismiss without selecting (default: false). */
  allowsEmptySelection?: boolean
  /** Whether multiple items can be selected (default: false). */
  allowsMultipleSelection?: boolean
}
