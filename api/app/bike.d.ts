import { AlertOptions, AlertResult } from './alert'
import { ChoiceBoxSource, ChoiceBoxResult } from './choice-box'
import { Clipboard } from './clipboard'
import { Keychain } from './keychain'
import { Document, Window, Screen } from './workspace'
import { Settings } from './settings'
import { Commands } from './commands'
import { Keybindings } from './keybindings'
import { AttributeConfig, AttributeInfo, AttributeParseResult, AttributeType } from './attribute'
import { BadgeConfig } from './badge'
import { SummaryConfig } from './summary'
import { Input } from './input'
import { OutlineEditor } from './outline-editor'
import { PanelOptions, PanelHandle } from './dom-script'
import { Disposable, Permissions } from './system'
import { DOMProtocol } from '../core/dom-protocol'
import { BikeUtilityGlobals } from '../core/bike-globals'
import { Outline } from './outline'

declare global {
  /** The bike global API. */
  const bike: BikeUtilityGlobals & {
    /** Bring the bike application to the foreground */
    activate(): void

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

    /** The interface for adding text input handlers. */
    readonly input: Input
    /** The interface to read/write to the system clipboard. */
    readonly clipboard: Clipboard
    /** The interface for extension settings UI. */
    readonly settings: Settings
    /** Secure storage for secrets (API tokens, passwords, etc) */
    readonly keychain: Keychain
    
    /** Register a row badge. See `BadgeConfig`. */
    badge(name: string, config: BadgeConfig): Disposable
    /** Register a summary (subtree or ancestor reduction), readable as `summary("name")`. */
    summary(name: string, config: SummaryConfig): Disposable
    /** Declare how the editor treats an attribute everywhere. See `AttributeConfig`. */
    attribute(name: string, config: AttributeConfig): Disposable
    /** Observe current and future attribute definitions. */
    observeAttributes(handler: (infos: AttributeInfo[]) => void): Disposable
    /** Parse free text as a value of the named attribute ("next fri", "2h 30m"). */
    parseAttribute(name: string, text: string): AttributeParseResult | undefined
    /** Format a wire value through the named attribute's definition. */
    displayAttribute(name: string, wire: string): string
    /** Parse free text as a bare type with default facets. */    
    parseValue(type: AttributeType, text: string): AttributeParseResult | undefined
    /** Format a wire value as a bare type with default facets. */
    displayValue(type: AttributeType, wire: string): string

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
    /** Observer called current and future frontmost outline editors. */
    observeFrontmostOutlineEditor(handler: (_: OutlineEditor | undefined) => void): Disposable

    /** All connected screens. `screens[0]` is the primary (menu bar) screen */
    readonly screens: Screen[]
    /** The primary screen (the one with the menu bar). */
    readonly mainScreen: Screen

    /**
     * Show a window or application modal alert.
     *
     * @param options - The options for the alert
     * @param window - A window to attach the alert to
     * @returns A promise that resolves to the result of the alert.
     */
    showAlert(options: AlertOptions, window?: Window): Promise<AlertResult>

    /**
     * Show a fuzzy-filtering choice box for selecting from one or more sources of items.
     *
     * Pass a single source for the simple case, or an array of sources to enable
     * prefix-driven mode switching: typing a source's `prefix` at the start of the
     * search field swaps to that source's items and per-source chrome (placeholder,
     * default symbol, selection rules) live. Exactly one source must omit `prefix` —
     * that's the default, shown when no other prefix matches. The rest must have
     * unique non-empty prefixes.
     *
     * @param sources - A single source or an array of sources to choose from
     * @param window - A window to attach the choice box to
     * @returns A promise that resolves to the picked items + their indices and the
     *   submitted source's prefix, or `null` if the user cancelled.
     */
    showChoiceBox(sources: ChoiceBoxSource | ChoiceBoxSource[], window?: Window): Promise<ChoiceBoxResult | null>

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
     * @returns A promise that resolves to a PanelHandle<P>.
     * @see
     * {@link https://github.com/bike-outliner/extension-kit/blob/main/docs/dom-context-tutorial.md#define-a-typed-messaging-protocol | Typed Messaging Protocols}
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
 * AppExtensionContext provides access to extension specific API. It is passed
 * through the extension's activate function.
 *
 * ```ts
 * import { AppExtensionContext } from "bike/app";
 * export async function activate(context: AppExtensionContext) {
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


