/**
 * Types for `bike.session` DOM API.
 *
 * This session API provides a reusable CLI inspired set of commands and formats
 * for interacting with Bike data structures and without having to a define a
 * custom message protocol.

 * Unlike the app context, the DOM context doesn't have direct access to Bike's
 * data structures (outlines, editors, etc.). It's only connection is via
 * message passing (DOMExtensionContext.onmessage|postMessage) with its
 * originating app context that does have direct access.
 *
 * These methods and types can save a lot of work.
 *
 * ## Defaults: host window vs app frontmost
 *
 * DOM contexts with a strong window relationship — inspector items, sheets,
 * and panels created with an explicit window — are bound to that host window.
 * For those, an omitted `outline`/`editor` param resolves to the host
 * window's outline/editor, stable as windows reorder. Other DOM contexts
 * (panels created without a window) default to the app-frontmost
 * outline/editor, resolved at call time.
 *
 * Access is never narrowed: explicit ids reach any open outline/editor, and
 * the `'@app'` sentinel requests the app-frontmost default from a
 * window-bound context. `'@host'` is the explicit spelling of the host
 * default and rejects when the context has no (live) host window.
 */

/** A row's live session id — a number, stable while the outline is open (not across runs). */
type SessionId = number
/** A row's persistent id — stable across runs/sessions. */
type PersistentId = string
/** An outline's persistent id (used wherever a param/field names an `outline`). */
type OutlineId = string
/** An open editor's id (a UUID string). */
type EditorId = string
/**
 * Outline reference accepted by `outline` params: a persistent id, `'@host'`
 * (this DOM context's host window's outline — the default when this context
 * is window-bound), or `'@app'` (the app-frontmost outline — the default
 * otherwise).
 */
type OutlineRef = OutlineId | '@host' | '@app'
/** Editor reference accepted by `editor` params; sentinels as in `OutlineRef`. */
type EditorRef = EditorId | '@host' | '@app'
/** A command id, e.g. `"edit:text-paste"`. */
type CommandId = string
/** An OutlinePath query expression, e.g. `"//heading"` or `"//task not @done"`. */
type OutlinePath = string
/** A row-reference sentinel resolved by the editor at call time. */
type RowSentinel = '@selection' | '@focused'
/** Bike-flavored markdown (a leading marker sets row type; inline markdown is applied). */
type Markdown = string

type SessionRowType =
  | 'body' | 'heading' | 'task' | 'note'
  | 'quote' | 'code' | 'hr' | 'ordered' | 'unordered'

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
  filter: string | OutlinePath | null
  selection: { anchor: SessionId; head: SessionId; rows: SessionId[]; text: string } | null
}

interface CommandInfo {
  id: CommandId
  source: string | null
}

interface RowUpdateResult {
  row: SessionRow
  fieldErrors?: { field: string; message: string }[]
}

interface SessionSubscription {
  dispose(): Promise<void>
}

interface ObserveOptions {
  onClose?: (reason: 'canceled' | 'outlineClosed' | 'domUnloaded' | string) => void
}

interface BikeSession {
  // Reads
  getOutlines(): Promise<OutlineSummary[]>
  getOutline(params?: {
    outline?: OutlineRef
    rowRefs?: RowRef[]
    shape?: 'tree' | 'flat'
  }): Promise<SessionOutline>
  getEditors(): Promise<EditorSummary[]>
  getEditor(params?: { editor?: EditorRef }): Promise<SessionEditor>
  getCommands(params?: { editor?: EditorRef }): Promise<CommandInfo[]>

  // Mutations
  newOutline(params?: { format?: 'bike' | 'markdown' | 'opml' | 'txt' | 'json' }): Promise<OutlineSummary>
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
    persistentId?: PersistentId
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

  // Editor, commands, scripting
  updateEditor(params: {
    outline?: OutlineRef
    focus?: RowRef
    filter?: string | OutlinePath
    select?: RowRef
    selectHead?: RowRef
    expand?: RowRef[]
    collapse?: RowRef[]
  }): Promise<SessionEditor>
  performCommands(params: { editor?: EditorRef; ids: CommandId[] }): Promise<{ id: CommandId; performed: boolean }[]>
  evaluateScript(params: { script: string; input?: string; editor?: EditorRef }): Promise<import('../core/json').JSONValue>

  // Streaming
  /**
   * With an explicit `outline` id — or any host binding (`'@host'` or an
   * omitted `outline` in a window-bound context) — the subscription is pinned
   * to that outline and ends with `onClose('outlineClosed')` when it closes.
   * Only an omitted/`'@app'` `outline` in a non-window-bound context follows
   * the app-frontmost outline, retargeting as windows reorder.
   */
  observeOutline(
    params: { outline?: OutlineRef; path?: OutlinePath; shape?: 'tree' | 'flat' },
    onSnapshot: (doc: SessionOutline | null) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>
  observeOutlines(
    onSnapshot: (outlines: OutlineSummary[]) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>
}