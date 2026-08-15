/**
 * Types for the `bike.session` DOM API — a CLI-inspired command set for
 * working with Bike outlines and editors from DOM extensions.
 *
 * These types are the payload reference. Behavior — targets and defaults
 * (`@window`/`@frontmost`), ids, row refs, sentinels, streaming, debounce — is
 * documented together with the `bike` CLI in the session automation reference:
 * https://github.com/bike-outliner/extension-kit/blob/main/docs/session-automation.md
 *
 * NOTE: These Session* types mirror the wire format shared with the `bike`
 * CLI and MCP server, which uses compact field names. They intentionally
 * differ from the richer app-context types in `bike/app`:
 * `SessionRowChange` uses `old`/`new` where `RowChange` uses
 * `oldType`/`newType` etc., and `SessionTextRun` uses `string`/`attrs`
 * where `RowRun` uses `runString`/`runAttributes`.
 */

type SessionId = number
type PersistentId = import('../app/outline').PersistentId
type OutlineId = string
type EditorId = string
type ContextSentinel = '@window' | '@frontmost'
type FilePath = string
type OutlineRef = OutlineId | FilePath | ContextSentinel
type EditorRef = EditorId | ContextSentinel
type CommandId = string
type OutlinePath = import('../core/outline-path').OutlinePath
type RowSentinel = '@selection' | '@focused' | '@root'
type Markdown = string

type SessionRowType =
  | 'body' | 'heading' | 'task' | 'note'
  | 'quote' | 'code' | 'hr' | 'ordered' | 'unordered' | 'log'

interface SessionTextRun {
  string: string
  attrs?: Record<string, string>
}

interface SessionRow {
  id: SessionId
  persistentId?: PersistentId
  type: SessionRowType
  created: string
  modified: string
  attributes?: Record<string, string>
  text: SessionTextRun[]
  children?: SessionRow[]
}

interface SessionOutline {
  persistentId: OutlineId
  displayName: string
  fileURL: string | null
  metadata: Record<string, import('../core/json').JSONValue>
  root: SessionRow
}

type RowRef = SessionId | PersistentId | OutlinePath | RowSentinel

interface OutlineSummary {
  persistentId: OutlineId
  displayName: string
  fileURL: string | null
}

interface EditorSummary {
  id: EditorId
  outlineId: OutlineId
}

interface SessionEditor {
  id: EditorId
  outlineId: OutlineId
  focused: SessionId[]
  collapsed: SessionId[]
  filter: OutlinePath | null
  selection: {
    anchor: SessionId
    head: SessionId
    rows: SessionId[]
    text: string
  } | null
}

interface CommandInfo {
  id: CommandId
  source: string | null
}

interface RowUpdateResult {
  row: SessionRow
  fieldErrors?: { field: string; message: string }[]
}

type SessionRowChange =
  | { type: 'setType'; old: SessionRowType; new: SessionRowType }
  | { type: 'setAttribute'; name: string; old: string | null; new: string | null }
  | { type: 'setPersistentId'; old: PersistentId | null; new: PersistentId | null; displaced?: SessionId }
  | { type: 'replacedText'; at: number; replaced: SessionTextRun[]; inserted: SessionTextRun[] }
  | {
      type: 'replacedTextAndSetType'
      at: number
      replaced: SessionTextRun[]
      inserted: SessionTextRun[]
      oldType: SessionRowType
      newType: SessionRowType
    }

interface SessionRowChanged {
  type: 'rowChanged'
  row: SessionId
  modified: string
  change: SessionRowChange
}

interface SessionRowsInserted {
  type: 'rowsInserted'
  parent: SessionId
  index: number
  beforeSibling: SessionId | null
  rows: SessionRow[]
}

interface SessionRowsRemoved {
  type: 'rowsRemoved'
  parent: SessionId
  index: number
  rows: SessionId[]
}

interface SessionRowsMoved {
  type: 'rowsMoved'
  rows: SessionId[]
  fromParent: SessionId
  fromIndex: number
  toParent: SessionId
  toIndex: number
  toBeforeSibling: SessionId | null
}

interface SessionPersistentMetadataChanged {
  type: 'persistentMetadata'
  old: import('../core/json').JSONValue
  new: import('../core/json').JSONValue
}

type SessionOutlineChange =
  | SessionRowChanged
  | SessionRowsInserted
  | SessionRowsRemoved
  | SessionRowsMoved
  | SessionPersistentMetadataChanged

interface SessionOutlineSnapshot {
  type: 'snapshot'
  outline: SessionOutline | null
}

type SessionOutlineEvent = SessionOutlineSnapshot | SessionOutlineChange

type SessionEditorChange =
  | { type: 'focus'; focused: SessionId[] }
  | { type: 'selection'; selection: SessionEditor['selection'] }
  | { type: 'collapsed'; collapsed: SessionId[] }
  | { type: 'filter'; filter: SessionEditor['filter'] }

interface SessionEditorSnapshot {
  type: 'snapshot'
  editor: SessionEditor | null
}

type SessionEditorEvent = SessionEditorSnapshot | SessionEditorChange

interface SessionOutlineEditorSnapshot {
  type: 'snapshot'
  outline: SessionOutline | null
  editor: SessionEditor | null
}

type SessionOutlineEditorEvent = SessionOutlineEditorSnapshot | SessionOutlineChange | SessionEditorChange

interface SessionOutlineEditorChanges {
  outline: SessionOutlineChange[]
  editor: SessionEditorChange[]
}

/**
 * Handle for an active `observe*` stream. Unlike the app context's
 * synchronous `Disposable`, disposal crosses the WebView/app bridge, so
 * `dispose()` is async and resolves once the stream has actually stopped.
 * Subscriptions are also auto-disposed when the DOM script unloads.
 */
interface SessionSubscription {
  dispose(): Promise<void>
}

interface ObserveOptions {
  onClose?: (reason: 'canceled' | 'outlineClosed' | 'domUnloaded' | string) => void
}

interface BikeSession {

  getOutlines(): Promise<OutlineSummary[]>
  
  getOutline(params?: {
    outline?: OutlineRef
    rowRefs?: RowRef[]
    shape?: 'tree' | 'flat'
  }): Promise<SessionOutline>
  
  getEditors(): Promise<EditorSummary[]>
  
  getEditor(params?: { editor?: EditorRef }): Promise<SessionEditor>
  
  getCommands(): Promise<CommandInfo[]>

  createOutline(params?: { format?: 'bike' | 'markdown' | 'opml' | 'txt' | 'json' }): Promise<OutlineSummary>
  
  closeOutline(params?: { outline?: OutlineRef; discard?: boolean }): Promise<{ closed: boolean }>
  
  createRow(params: {
    outline?: OutlineRef
    markdown: Markdown
    parent?: RowRef
    position?: 'start' | 'end' | number
    before?: RowRef
    after?: RowRef
  }): Promise<SessionRow>
  
  createRows(params: {
    outline?: OutlineRef
    markdown: Markdown
    parent?: RowRef
    position?: 'start' | 'end' | number
    before?: RowRef
    after?: RowRef
  }): Promise<SessionRow[]>
  
  updateRows(params: {
    outline?: OutlineRef
    rows: RowRef[]
    text?: Markdown | SessionTextRun[]
    append?: Markdown | SessionTextRun[]
    prepend?: Markdown | SessionTextRun[]
    type?: SessionRowType
    attributes?: Record<string, string | null>
    persistentId?: PersistentId | '@ensure' // `@ensure` assign id only if needed.
  }): Promise<RowUpdateResult[]>
  
  deleteRows(params: { outline?: OutlineRef; rows: RowRef[] }): Promise<{ deleted: number }>
  
  moveRows(params: {
    outline?: OutlineRef
    rows: RowRef[]
    to?: RowRef
    position?: 'start' | 'end' | number
    before?: RowRef
    after?: RowRef
  }): Promise<SessionRow[]>

  /**
   * Apply focus / filter / fold / selection / activate to the editor in one
   * call. Operations apply in that fixed order.
   *
   * Note `focus` is Bike's focus — drill into a row — not keyboard focus.
   * Keyboard focus is `activate`, which matters from a DOM context: clicking
   * in a panel or inspector item makes its webview first responder, so a
   * `select` alone leaves the caret in an editor that isn't taking keystrokes.
   */
  updateEditor(params: {
    outline?: OutlineRef
    focus?: RowRef
    filter?: OutlinePath
    select?: RowRef
    selectHead?: RowRef
    expand?: RowRef[]
    collapse?: RowRef[]
    /**
     * Give the editor keyboard focus: activates Bike, brings the editor's
     * window to the front, and makes the editor first responder. Applied last,
     * after any selection.
     */
    activate?: boolean
  }): Promise<SessionEditor>
  
  evaluateCommands(params: {
    editor?: EditorRef
    ids: CommandId[]
    rows?: [SessionId] | [SessionId, SessionId]
  }): Promise<{ id: CommandId; performed: boolean }[]>
  
  evaluateScript(params: { script: string; input?: string }): Promise<import('../core/json').JSONValue>

  observeOutlines(
    onSnapshot: (outlines: OutlineSummary[]) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>

  observeEditors(
    onSnapshot: (editors: EditorSummary[]) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>

  observeOutline(
    params: { outline?: OutlineRef; rootId?: RowRef; debounce?: number },
    onUpdate: (outline: SessionOutline | null, changes: SessionOutlineChange[]) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>

  observeOutlineChanges(
    params: { outline?: OutlineRef; rootId?: RowRef; debounce?: number },
    onChange: (event: SessionOutlineEvent) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>

  observeOutlineQuery(
    params: { outline?: OutlineRef; rootId?: RowRef; path: OutlinePath; shape?: 'tree' | 'flat'; debounce?: number },
    onSnapshot: (doc: SessionOutline | null) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>

  observeEditor(
    params: { editor?: EditorRef; debounce?: number },
    onUpdate: (editor: SessionEditor | null, changes: SessionEditorChange[]) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>

  observeEditorChanges(
    params: { editor?: EditorRef; debounce?: number },
    onChange: (event: SessionEditorEvent) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>

  observeOutlineEditor(
    params: { editor?: EditorRef; debounce?: number },
    onUpdate: (
      outline: SessionOutline | null,
      editor: SessionEditor | null,
      changes: SessionOutlineEditorChanges,
    ) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>

  observeOutlineEditorChanges(
    params: { editor?: EditorRef; debounce?: number },
    onChange: (event: SessionOutlineEditorEvent) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>

}