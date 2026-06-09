/**
 * Types for the `bike.session` DOM API — a CLI-inspired command set for
 * working with Bike outlines and editors from DOM extensions.
 *
 * These types are the payload reference. Behavior — targets and defaults
 * (`@host`/`@app`), ids, row refs, sentinels, streaming, debounce — is
 * documented together with the `bike` CLI in the automation reference:
 * https://github.com/bike-outliner/extension-kit/blob/main/docs/automation.md
 */

/** A row's live session id — a number, stable while the outline is open (not across runs). */
type SessionId = number
/** A row's persistent id — stable across runs/sessions. */
type PersistentId = string
/** An outline's persistent id (used wherever a param/field names an `outline`). */
type OutlineId = string
/** An open editor's id (a UUID string). */
type EditorId = string
/** `'@host'` = this context's host window's outline/editor; `'@app'` = the app-frontmost, resolved at call time. */
type ContextSentinel = '@host' | '@app'
/** Outline reference accepted by `outline` params. */
type OutlineRef = OutlineId | ContextSentinel
/** Editor reference accepted by `editor` params. */
type EditorRef = EditorId | ContextSentinel
/** A command id, e.g. `"edit:text-paste"`. */
type CommandId = string
/** An OutlinePath query expression, e.g. `"//heading"` or `"//task not @done"`. */
type OutlinePath = string
/** A row sentinel: the editor's selected row, its focused row, or the outline root. */
type RowSentinel = '@selection' | '@focused' | '@root'
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
  modified: string // (ISO 8601)
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

/** A change to one slice of editor state, carrying that slice's new value. */
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

/** Combined seed for editor observers with `outline: true`. */
interface SessionWorkspaceSnapshot {
  type: 'snapshot'
  editor: SessionEditor | null
  outline: SessionOutline | null
}

type SessionWorkspaceEvent = SessionWorkspaceSnapshot | SessionOutlineChange | SessionEditorChange

/** The applied batch handed to `observeEditor({ outline: true })`'s `onUpdate`. */
interface SessionWorkspaceChanges {
  outline: SessionOutlineChange[]
  editor: SessionEditorChange[]
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
  
  getCommands(): Promise<CommandInfo[]>

  /** Parse-validate an OutlinePath: returns the parse tree, or a partial tree plus the error. */
  checkOutlinePath(params: { path: OutlinePath }): Promise<string>

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
    /** A persistent id (one row), or `'@ensure'` to fill rows missing one. */
    persistentId?: PersistentId | '@ensure'
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
  
  performCommands(params: {
    editor?: EditorRef
    ids: CommandId[]
    rows?: [SessionId] | [SessionId, SessionId] // Defaults to the editor's current selection
  }): Promise<{ id: CommandId; performed: boolean }[]>
  
  evaluateScript(params: { script: string; input?: string }): Promise<import('../core/json').JSONValue>

  // Streaming — seeds, debounce, follow/pin, and lifecycle are covered in the
  // automation reference (see header).

  /** Maintained editor state; `outline: true` also maintains the editor's outline in sync. */
  observeEditor(
    params: { editor?: EditorRef; debounce?: number; outline: true },
    onUpdate: (
      editor: SessionEditor | null,
      outline: SessionOutline | null,
      changes: SessionWorkspaceChanges,
    ) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>
  observeEditor(
    params: { editor?: EditorRef; debounce?: number },
    onUpdate: (editor: SessionEditor | null, changes: SessionEditorChange[]) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>

  /** Raw editor change feed (snapshot seed, then slice changes); `outline: true` carries outline changes too. */
  observeEditorChanges(
    params: { editor?: EditorRef; debounce?: number; outline: true },
    onChange: (event: SessionWorkspaceEvent) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>
  observeEditorChanges(
    params: { editor?: EditorRef; debounce?: number },
    onChange: (event: SessionEditorEvent) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>

  /** Maintained outline + the change batch just applied. */
  observeOutline(
    params: { outline?: OutlineRef; rootId?: RowRef; debounce?: number },
    onUpdate: (outline: SessionOutline | null, changes: SessionOutlineChange[]) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>

  /** The open-outline list, re-sent whenever it changes. */
  observeOutlines(
    onSnapshot: (outlines: OutlineSummary[]) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>

  /** Raw outline change feed: a snapshot seed, then granular changes. */
  observeOutlineChanges(
    params: { outline?: OutlineRef; rootId?: RowRef; debounce?: number },
    onChange: (event: SessionOutlineEvent) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>

  /** Debounced full snapshots of a path-filtered view. */
  observeOutlineQuery(
    params: { outline?: OutlineRef; rootId?: RowRef; path: OutlinePath; shape?: 'tree' | 'flat'; debounce?: number },
    onSnapshot: (doc: SessionOutline | null) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>

}