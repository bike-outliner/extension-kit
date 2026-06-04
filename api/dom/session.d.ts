/**
 * Types for `bike.session` DOM API.
 *
 * Read/write access using `bike` CLI model. The DOM doesn't have direct access
 * to Bike's internal data structures, so this API (like the CLI) uses a
 * serialization format for outlines, rows, and editors.
 */

/** Row type in the session serialization format. */
type SessionRowType =
  | 'body' | 'heading' | 'task' | 'note'
  | 'quote' | 'code' | 'hr' | 'ordered' | 'unordered'

/** One styled run of a row's text. Plain runs omit `attrs`. */
interface SessionTextRun {
  string: string
  attrs?: Record<string, string>
}

/** A row in the session serialization format (the shape reads/observe return). */
interface SessionRow {
  /** Live session id — stable while the outline is open. */
  id: number
  /** Stable across sessions, present when the row has one. */
  persistentId?: string
  type: SessionRowType
  created: string
  modified: string
  attributes?: Record<string, string>
  text: SessionTextRun[]
  children: SessionRow[]
}

/** A whole outline in the session format, with source-identifying fields. */
interface SessionOutline {
  persistentId?: string
  displayName?: string
  fileURL?: string | null
  root: SessionRow
}

/**
 * A reference to a row: numeric session id (as string), persistent id,
 * an OutlinePath ("//heading"), or special "@selection" / "@focused".
 */
type RowRef = string

interface OutlineSummary {
  persistentId: string
  displayName: string
  fileURL: string | null
  frontmost: boolean
}

interface EditorSummary {
  id: string
  outline: string
}

interface CommandInfo {
  id: string
  title?: string
}

/** Handle returned by `observe*`; call `dispose()` to stop the stream. */
interface SessionSubscription {
  dispose(): Promise<unknown>
}

/** Options common to `observe*` methods. */
interface ObserveOptions {
  /** Called when the stream ends (subscription canceled, outline closed, or script unloaded). */
  onClose?: (reason: 'canceled' | 'outlineClosed' | 'domUnloaded' | string) => void
}

/**
 * The `bike.session` surface. Each method maps to a `bike` CLI / MCP capability;
 * params and results use the session serialization format. Unknown payload
 * shapes are typed loosely as `unknown` where the engine returns dynamic data.
 */
interface BikeSession {
  // Reads
  getOutlines(): Promise<OutlineSummary[]>
  getOutline(params?: {
    outline?: string
    rowRefs?: RowRef[]
    shape?: 'tree' | 'flat'
    rows?: boolean
  }): Promise<SessionOutline>
  getEditors(): Promise<EditorSummary[]>
  getEditor(params?: { editor?: string }): Promise<unknown>
  getCommands(params?: { editor?: string }): Promise<CommandInfo[]>

  // Mutations
  newOutline(params?: { format?: 'bike' | 'markdown' | 'opml' | 'txt' | 'json' }): Promise<OutlineSummary>
  closeOutline(params?: { outline?: string; discard?: boolean }): Promise<unknown>
  createRow(params: {
    outline?: string
    text: string
    parent?: RowRef
    position?: 'start' | 'end' | number
    before?: RowRef
    after?: RowRef
  }): Promise<SessionRow>
  createRows(params: {
    outline?: string
    markdown: string
    parent?: RowRef
    position?: 'start' | 'end' | number
    before?: RowRef
    after?: RowRef
  }): Promise<SessionRow[]>
  updateRows(params: {
    outline?: string
    rows: RowRef[]
    text?: string
    append?: string
    prepend?: string
    type?: SessionRowType
    attributes?: Record<string, string>
    unset?: string[]
    persistentId?: string
  }): Promise<SessionRow[]>
  deleteRows(params: { outline?: string; rows: RowRef[] }): Promise<unknown>
  moveRows(params: {
    outline?: string
    rows: RowRef[]
    to?: RowRef
    position?: 'start' | 'end' | number
    before?: RowRef
    after?: RowRef
  }): Promise<SessionRow[]>

  // Editor, commands, scripting
  updateEditor(params: {
    outline?: string
    focus?: RowRef
    /** Set the filter — a contains-text string or an OutlinePath. Empty string clears it. */
    filter?: string
    selectRow?: RowRef
    selectHead?: RowRef
    expand?: RowRef[]
    collapse?: RowRef[]
  }): Promise<unknown>
  performCommands(params: { editor?: string; ids: string[] }): Promise<unknown>
  /** Evaluate JavaScript in Bike's app context (full-surface power, like the CLI/MCP). */
  evaluateScript(params: { script: string; input?: string; editor?: string }): Promise<unknown>

  // Streaming
  /** Stream session snapshots of rows matching `path` (default "//*"). */
  observeOutline(
    params: { outline?: string; path?: string; shape?: 'tree' | 'flat'; rows?: boolean },
    onSnapshot: (doc: SessionOutline) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>
  /** Stream the set of open outlines as they open / close / reorder. */
  observeOutlines(
    onSnapshot: (outlines: OutlineSummary[]) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>
}
