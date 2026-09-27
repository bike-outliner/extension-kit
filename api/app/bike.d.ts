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
import { ReconcileConfig } from './reconcile'
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
    /** Brings Bike to the foreground. */
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
    readonly input: Input
    /** The interface to read/write to the system clipboard. */
    readonly clipboard: Clipboard
    /** The interface for extension settings UI. */
    readonly settings: Settings
    readonly keychain: Keychain

    badge(name: string, config: BadgeConfig): Disposable
    /** Readable in queries as `summary("name")`. */
    summary(name: string, config: SummaryConfig): Disposable
    attribute(name: string, config: AttributeConfig): Disposable
    /** Derives changes from each outline transaction. */
    reconcile(name: string, config: ReconcileConfig): Disposable
    /** Called with current and future attribute definitions. */
    observeAttributes(handler: (infos: AttributeInfo[]) => void): Disposable
    /** Parses free text ("next fri", "2h 30m") per the attribute's definition. */
    parseAttribute(name: string, text: string): AttributeParseResult | undefined
    /** Formats a wire value per the attribute's definition. */
    displayAttribute(name: string, wire: string): string
    /** Parses free text as `type` with default facets. */
    parseValue(type: AttributeType, text: string): AttributeParseResult | undefined
    /** Formats a wire value as `type` with default facets. */
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

    /** `screens[0]` is the menu bar screen. */
    readonly screens: Screen[]
    /** The menu bar screen. */
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
     * Fuzzy-filtering picker. See `ChoiceBoxSource.prefix` for multiple sources.
     *
     * @param sources - A single source or an array of sources to choose from
     * @param window - A window to attach the choice box to
     * @returns `null` when cancelled.
     */
    showChoiceBox(sources: ChoiceBoxSource | ChoiceBoxSource[], window?: Window): Promise<ChoiceBoxResult | null>

    /**
     * Floating, non-modal panel. With `window` it closes with that window.
     * Without `window` it will stay open until disposed by the extension or
     * closed by user.
     *
     * @param options - The options for the panel
     * @param window - A window to associate the panel with
     * @see
     * {@link https://github.com/bike-outliner/extension-kit/blob/main/docs/dom-context-tutorial.md#define-a-typed-messaging-protocol | Typed Messaging Protocols}
     */
    showPanel<P extends DOMProtocol = DOMProtocol>(options: PanelOptions, window?: Window): Promise<PanelHandle<P>>

    /** Editor of a test document, reset to an empty outline with no undo history on each call. */
    testEditor(): OutlineEditor

    /** Outline of a test document, reset to empty with no undo history on each call. */
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


