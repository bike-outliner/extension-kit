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
  const bike: BikeUtilityGlobals & {
    /** Brings Bike to the foreground. */
    activate(): void

    readonly build: number
    readonly version: string
    readonly apiVersion: string
    readonly commands: Commands
    readonly keybindings: Keybindings
    readonly input: Input
    readonly clipboard: Clipboard
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

    readonly windows: Window[]
    readonly frontmostWindow?: Window
    /** Called for current and future windows. */
    observeWindows(handler: (_: Window) => void): Disposable
    observeFrontmostWindow(handler: (_: Window | undefined) => void): Disposable

    readonly documents: Document[]
    readonly frontmostDocument?: Document
    /** Called for current and future documents. */
    observeDocuments(handler: (_: Document) => void): Disposable
    observeFrontmostDocument(handler: (_: Document | undefined) => void): Disposable

    readonly outlineEditors: OutlineEditor[]
    readonly frontmostOutlineEditor?: OutlineEditor
    observeFrontmostOutlineEditor(handler: (_: OutlineEditor | undefined) => void): Disposable

    /** `screens[0]` is the menu bar screen. */
    readonly screens: Screen[]
    /** The menu bar screen. */
    readonly mainScreen: Screen

    /** Window-modal with `window`, otherwise app-modal. */
    showAlert(options: AlertOptions, window?: Window): Promise<AlertResult>

    /**
     * Fuzzy-filtering picker. See `ChoiceBoxSource.prefix` for multiple sources.
     * @returns `null` when cancelled.
     */
    showChoiceBox(sources: ChoiceBoxSource | ChoiceBoxSource[], window?: Window): Promise<ChoiceBoxResult | null>

    /**
     * Floating, non-modal panel. With `window` it closes with that window;
     * without, it stays open until disposed or closed by the user.
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
 * Passed to the extension's `activate(context)`. Indexable, e.g. to hold
 * disposables.
 */
export interface AppExtensionContext extends Record<string, any> {
  readonly permissions: Permissions
}


