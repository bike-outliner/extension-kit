declare module '*.css' {}

interface SFSymbolOptions {
  weight?: 'ultralight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'
  scale?: 'small' | 'medium' | 'large'
}

declare const bike: {
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
  readonly defaults: import('../core/json').JSONStore

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

  /**
   * Programmatic access to the same outline/editor automation the `bike`
   * command-line tool and MCP server expose — read, observe, and mutate open
   * outlines from a DOM extension. Methods return Promises; `observe*` methods
   * stream snapshots until disposed.
   *
   * @example
   * ```typescript
   * const outlines = await bike.session.getOutlines()
   * const sub = await bike.session.observeOutline({ path: '//task' }, doc => render(doc.root))
   * // sub.dispose() // stop streaming (also auto-disposed when the script unloads)
   * ```
   */
  readonly session: BikeSession
}

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
  /** Styled runs; `[]` when empty. */
  text: SessionTextRun[]
  attributes?: Record<string, string>
  created: string
  modified: string
  children: SessionRow[]
}

/** A whole outline in the session format, with source-identifying fields. */
interface SessionDocument {
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
  }): Promise<SessionDocument>
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
    select?: RowRef
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
    onSnapshot: (doc: SessionDocument) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>
  /** Stream the set of open outlines as they open / close / reorder. */
  observeOutlines(
    onSnapshot: (outlines: OutlineSummary[]) => void,
    options?: ObserveOptions
  ): Promise<SessionSubscription>
}
