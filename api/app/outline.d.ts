import { JSONStore } from '../core/json'
import { OutlinePath, OutlinePathValue } from '../core/outline-path'
import { Disposable, URL } from './system'

/** Outline is a tree of rows. */
export class Outline {
  /** Root row of the outline (not visible in editor). */
  readonly root: Row

  /**
   * Create a new outline.
   *
   * Generally users create outlines themselves when they create
   * documents. Use this constructor to create a temporary outline for
   * processing. For example you can use this constructor to copy rows
   * from an existing outline to the clipboard:
   *
   * 1. Query the existing outline
   * 2. Create a new outline from the query results
   * 3. Use `archive()` on the new outline to export the data
   */
  constructor(rows?: RowSource)

  /** Runtime metadata for the outline. */
  readonly runtimeMetadata: JSONStore

  /**
   * Persistent metadata for the outline.
   *
   * Stored in file format frontmatter/metadata. Not stored for Plain Text
   * documents unless the key `bikemd` is set to `true`.
   */
  readonly persistentMetadata: JSONStore

  /**
   * Every row-attribute name used anywhere in this outline, sorted, with
   * reserved names excluded.
   *
   * A full scan of the outline — ask on a user action, not per keystroke.
   */
  readonly attributeNames: string[]

  /**
   * Archive this outline.
   *
   * @param format - The archive format (default bike).
   */
  archive(format?: OutlineFormat): OutlineArchive

  /**
   * Get the row by id.
   * @param id - The numeric Row.ID or PersistentId of the row to get.
   */
  getRowById(id: RowId | PersistentId): Row | undefined

  /**
   * Resolve a link string into a URL.
   *
   * `string` may be any absolute URL (e.g. `"https://example.com"`,
   * `"bike://root/row"`) or a `#ROWREF` shorthand (e.g. `"#calendar"`).
   * `#ROWREF` is expanded into `bike://<this-outline-root>/#ROWREF`, which
   * selects the row. Anything else is parsed as an absolute URL.
   *
   * A row reference in the focus or selection position of a `bike://` URL is
   * resolved when the link opens, by trying, in order:
   *
   * 1. {@link PersistentId} — durable, and the only form Bike itself writes.
   * 2. {@link RowId} — the session id, reassigned on every load, so it is
   *    only good within one session. `row.id` is signed, and both the signed
   *    and unsigned spellings of a session id name the same row.
   * 3. Row number — 1-based position in outline order.
   *
   * @param string - The link string to resolve.
   * @returns A URL, or undefined if the string is malformed or this
   *   outline's root has no persistent id.
   */
  resolveLink(string: string): URL | undefined

  /**
   * Resolve an attachment src to the attachment's metadata.
   *
   * `src` is the `embed` text attribute of an attachment run (e.g.
   * `'assets/photo.png'`). Attachments added this session resolve to
   * staged copies, so the URL is readable before the document saves.
   *
   * @param src - The embed src to resolve.
   * @returns The attachment's metadata, or undefined when the src is
   *   invalid, this outline has no document, or no attachment file exists.
   */
  attachmentMetadata(src: string): AttachmentMetadata | undefined

  /**
   * Read an attachment's raw bytes.
   *
   * @param src - The embed src of the attachment.
   * @returns A Promise resolving to the attachment's bytes; rejects when
   *   the attachment can't be resolved (see `attachmentMetadata`) or read.
   */
  attachmentBytes(src: string): Promise<Uint8Array>

  /**
   * Insert rows into the outline.
   *
   * @param rows - The source of the rows to insert. (Always copied)
   * @param parent - The parent row to insert the rows into. (Default Root)
   * @param before - The optional child row to insert before.
   */
  insertRows(rows: RowSource, parent?: Row, before?: Row): Row[]

  /**
   * Move rows within the outline. These rows must already be in the
   * outline.
   *
   * @param rows - The existing rows to move.
   * @param parent - The existing parent row to move the rows into.
   * @param before - The optional child row to insert before.
   */
  moveRows(rows: Row[], parent: Row, before?: Row): void

  /**
   * Remove rows from the outline.
   * @param rows - The existing rows to remove.
   */
  removeRows(rows: Row[]): void

  /**
   * Query the outline immediately.
   */
  query(path: OutlinePath): OutlinePathValue

  /**
   * Query the outline asynchronously.
   * @param handler - The handler to call when result value is ready.
   */
  scheduleQuery(path: OutlinePath, handler: (value: OutlinePathValue) => void): Disposable

  /**
   * Query the outline asynchronously and continuously.
   *
   * Queries are debounced as the outline changes. If the outline changes
   * quickly you may not see intermediate results, but you will always get
   * results for the final outline state.
   *
   * @param handler - The handler to call when a result value is ready.
   */
  observeQuery(path: OutlinePath, handler: (value: OutlinePathValue) => void): Disposable

  /**
   * Explain how an outline path will be evaluated.
   *
   * Returns detailed information about the path's abstract syntax tree,
   * parse sequence, and any parsing errors. Useful for debugging and
   * understanding complex queries.
   *
   * @param path - The outline path to explain.
   * @returns A string describing the AST, parse sequence, and errors.
   */
  explainQuery(path: OutlinePath): string

  /**
   * Group several changes so the view updates once. Optional — use it when
   * multiple edits should read as a single change.
   *
   * @returns The return value of the update closure.
   */
  transaction(options: TransactionOptions, update: () => any): any

  /**
   * Prevent the next edit from coalescing with the previous in undo stack
   */
  breakUndoCoalescing(): void

  /**
   * Observe changes.
   */
  observeChanges(handler: (change: OutlineChange) => void): Disposable

  /**
   * Register a handler called once, when this outline's document closes —
   * immediately before the document's `onClose`.
   *
   * @param handler - Called once when the outline closes.
   * @returns A Disposable that unregisters the handler.
   */
  onClose(handler: () => void): Disposable
}

export type OutlineArchive = { data: string; format: OutlineFormat }
export type OutlineFormat = 'bike' | 'opml' | 'plaintext'

/** Read-only metadata for a resolved attachment (embed asset). */
export interface AttachmentMetadata {
  /** The attachment's resolved file URL (staged copy when unsaved). */
  readonly url: URL
  /**
   * The attachment's MIME type, derived from its file extension
   * (`'application/octet-stream'` when unknown).
   */
  readonly mimeType: string
}

/**
 * Describes changes made to an outline.
 *
 * Changes to outline structure are grouped into changes of contiguous and
 * ordered sibling rows. Only top level siblings are reported. For example when
 * siblings are removed you will get an event for the top level removed
 * siblings, but not for descendants of those siblings.
 */
export type OutlineChange =
  | { type: 'beginTransaction' }
  | { type: 'metadata' }
  | { type: 'rowChanged'; rowId: RowId; change: RowChange }
  | { type: 'siblingsInserted'; siblings: Row[] }
  | { type: 'siblingsRemoved'; siblings: Row[] }
  | { type: 'siblingsMoved'; oldSiblings: Row[]; newSiblings: Row[] }
  | { type: 'reload'; oldOutline: Outline; newOutline: Outline }
  | { type: 'endTransaction' }

/** Describes change made to a specific Row. */
export type RowChange =
  | { type: 'setPersistentId'; oldPersistentId: PersistentId | null; newPersistentId: PersistentId | null }
  | { type: 'setType'; oldType: RowType; newType: RowType }
  | { type: 'setAttribute'; name: RowAttributeName; oldValue: string | null; newValue: string | null }
  | {
      type: 'replacedText'
      at: number
      replacedText: AttributedString
      insertedText: AttributedString
    }
  | {
      // In a few cases row type+text changes are dependent on each other. For
      // example if you set a row type to `hr` it also replaces the text. Or if
      // you insert text into a `hr` typed row it converts that row to type
      // `body`. These linked changes are represented atomically using this
      // replacedTextAndSetType change type.
      type: 'replacedTextAndSetType'
      at: number
      replacedText: AttributedString
      insertedText: AttributedString
      oldType: RowType
      newType: RowType
    }

/** A row is a paragraph of text that can also have children rows. */
export interface Row {
  readonly outline: Outline
  /** Numeric row id, unique within outline but not persistent across saves */
  readonly id: RowId
  /** URL link for this row combining outline and row persistent ids */
  readonly url: URL
  /** Persistent id */
  persistentId?: PersistentId
  /** Persistent id, generating one if needed */
  readonly ensuredPersistentId: PersistentId

  /**
   * This row's log — the `log`-typed child holding its history — or
   * undefined when it keeps none.
   *
   * Entries inside are ordinary rows carrying `log-*` attributes by
   * convention, so recording history is plain row insertion once you have
   * the container. There is no entry API because entries need no type: a
   * feature brings its own `log-*` names, and `log-date` is the one field
   * every entry carries.
   */
  readonly log?: Row

  /**
   * The log, creating it as the last child when absent.
   *
   * A MUTATION that reads like a lookup, same shape as
   * `ensuredPersistentId` — call it inside a transaction when it is part of
   * a larger edit.
   */
  readonly ensuredLog: Row

  /** Row's type, defaults to body */
  type: RowType
  /** Row's paragraph of text */
  text: AttributedString

  /**
   * Row attributes, as the WIRE strings the document stores. Undefined for a
   * name this row doesn't carry.
   */
  readonly attributes: Record<RowAttributeName, string | undefined>

  /**
   * Get an attribute's WIRE string, or undefined when the row doesn't carry
   * it.
   *
   * Attributes are stored as wire strings; the typing lives in the value
   * layer keyed by {@link AttributeType} — `bike.decodeValue(type, wire)` for
   * a machine-facing JS value, `bike.displayValue(type, wire)` or
   * `env.formatAttribute(name, wire)` for a human label.
   */
  getAttribute(name: RowAttributeName): string | undefined

  /**
   * Set an attribute to a WIRE string. Passing anything but a string (other
   * than null/undefined, which removes) is an error.
   *
   * Build typed values with `bike.encodeValue(type, value)`, whose output is
   * canonical — a Date becomes the same stamp native Toggle Done writes.
   * Otherwise the caller owns canonicalization: a hand-written `PT90M` is
   * stored verbatim, where an editor write would have normalized it to
   * `PT1H30M`.
   */
  setAttribute(name: RowAttributeName, wire: string): void

  /** Remove attribute by name. */
  removeAttribute(name: RowAttributeName): void

  /** Row's level in the outline. Root is 0. */
  readonly level: number
  /** Ancestors of this row */
  readonly ancestors: Row[]
  /** Ancestors of this row including self */
  readonly ancestorsWithSelf: Row[]
  /** Parent row, only undefined for outline root. */
  readonly parent?: Row
  readonly prevSibling?: Row
  readonly nextSibling?: Row
  readonly firstChild?: Row
  readonly lastChild?: Row

  /** First leaf in branch rooted at this row */
  readonly firstLeaf: Row
  /** Last leaf in branch rooted at this row */
  readonly lastLeaf: Row
  /** Children of this row */
  readonly children: Row[]
  /** Descendants of this row */
  readonly descendants: Row[]
  /** Descendants of this row including self */
  readonly descendantsWithSelf: Row[]
  /** Previous branch */
  readonly prevBranch?: Row
  /** Next branch */
  readonly nextBranch?: Row
  /** Previous row in outline order */
  readonly prevInOutline?: Row
  /** Next row in outline order */
  readonly nextInOutline?: Row

  /** True if row is an ancestor of other row. */
  isAncestor(row: Row): boolean
  /** True if row is a descendant of other row. */
  isDescendant(row: Row): boolean
}

/**
 * AttributedString for rich text editing.
 *
 * Many commonly used attributes are "marker" attributes. They are used to
 * mark up text with semantic meaning, and just used empty string for
 * associated value. For example, "strong" is used to mark up text that
 * should be displayed as bold, but the actual font is determined by the
 * editor's stylesheets.
 */
export class AttributedString {
  /**
   * Create an AttributedString from a Markdown string.
   */
  static fromMarkdown(markdown: string): AttributedString

  /**
   * Create an AttributedString from an HTML string (should be a `<p>` element).
   */
  static fromHTML(html: string): AttributedString

  /** Character contents */
  string: string

  /** Character count */
  count: number

  /**
   * Get attribute at index.
   * @param attribute - The name of the attribute.
   * @param index - The index to get the attribute at.
   * @param affinity - The affinity to disambiguate run boundaries (default upstream).
   * @param effectiveRange - The range of the attribute returned by reference.
   */
  attributeAt(
    attribute: TextAttributeName,
    index: number,
    affinity?: Affinity,
    effectiveRange?: Range
  ): string | undefined

  /**
   * Get attributes at index.
   * @param affinity - The affinity to disambiguate run boundaries (default upstream).
   * @param effectiveRange - The range of the attributes returned by reference.
   */
  attributesAt(
    index: number,
    affinity?: Affinity,
    effectiveRange?: Range
  ): Record<TextAttributeName, string>

  /**
   * Add attribute in range.
   * @param name - The name of the attribute.
   * @param value - The value of the attribute.
   * @param range - The range to add the attribute to (default entire string).
   */
  addAttribute(name: TextAttributeName, value: string, range?: Range): void

  /**
   * Add attributes in range.
   * @param attributes - The attributes to add.
   * @param range - The range to add the attributes to (default entire string).
   */
  addAttributes(attributes: Record<TextAttributeName, string>, range?: Range): void

  /**
   * Remove attribute from range.
   * @param name - The name of the attribute.
   * @param range - The range to remove the attribute from (default entire string).
   */
  removeAttribute(name: TextAttributeName, range?: Range): void

  /**
   * Return new attributed string from range.
   * @param range - The range to get the substring from.
   */
  substring(range: Range): AttributedString

  /**
   * Insert string or attributed text at index.
   */
  insert(position: number, text: string | AttributedString): void

  /**
   * Replace range with string or attributed text.
   */
  replace(range: Range, text: string | AttributedString): void

  /**
   * Append string or attributed text.
   */
  append(text: string | AttributedString): void

  /**
   * Delete text in range.
   */
  delete(range: Range): void

  /**
   * Convert this attributed string to Markdown.
   */
  toMarkdown(): string

  /**
   * Convert this attributed string to HTML.
   */
  toHTML(): string
}

/** Persistent identifier optionally associated with rows */
export type PersistentId = string

/**
 * Row attributes names can be any valid HTML attribute string. When encoded to
 * HTML they will be prefixed with `data-`.
 */
export type RowAttributeName = string

/**
 * Text attribute names can be any string. Common built in text attributes such
 * as "strong" and "em" are represented as inline tags in HTML (.bike format).
 * Custom attributes in spans.
 */
export type TextAttributeName =
  | 'em'
  | 'strong'
  | 'code'
  | 'mark'
  | 's'
  | 'a'
  | 'base'
  | string

/**
 * Range is a tuple of start and end indexes. The start index is inclusive
 * and the end index is exclusive.
 */
export type Range = [RangeStartIndex, RangeEndIndex]
export type RangeStartIndex = number
export type RangeEndIndex = number
export type RowId = number
export type RowType =
  | 'body'
  | 'heading'
  | 'quote'
  | 'code'
  | 'note'
  | 'unordered'
  | 'ordered'
  | 'task'
  | 'log'
  | 'hr'

/**
 * Affinity determines how the selection behaves when the caret is at a
 * position with two possible meanings. For example at the end of a wrapped
 * line (or same position could be start of next wrapped line).
 */
export type Affinity = 'upstream' | 'downstream'

/**
 * Use RowSource when creating a new outline or inserting rows.
 *
 * RowSource will be copied into new rows in the outline. If any of the row
 * source IDs already exist in the outline new IDs will be generated and any
 * links imported will be updated to point to the new IDs.
 */
export type RowSource =
  | string[]
  | RowTemplate[]
  | Row[]
  | Outline
  | OutlineArchive
  | OutlinePathValue

/**
 * Rows can't be created directly. Use a RowTemplate when you need to create
 * new rows, and the template values will be inserted into the row that the
 * outline creates for you internally.
 */
export type RowTemplate = {
  persistentId?: string
  type?: RowType
  attributes?: Record<RowAttributeName, string>
  text?: string | AttributedString
  format?: 'plain' | 'markdown'
}

/**
 * TransactionOptions determine how the view updates when changes are made to
 * the outline.
 */
export type TransactionOptions =
  | 'default'
  | {
      /** Label for the transaction, used in undo history. */
      label?: string
      /** Animate transactions changes when set. */
      animate?:
        | 'none'
        | 'default'
        | {
            /** Spring timing function to use for the animation. */
            spring: Spring
            /** Caret animation behavior. */
            caret?: CaretAnimation
          }
    }

/** Spring timing functions. */
export type Spring =
  /** Spring timing used when typing */
  | 'char'
  /** Spring timing used when moving rows up/down etc (default) */
  | 'row'
  /** Spring timing used when expanding and collapsing rows */
  | 'fold'
  /** Spring timing used when focus in/out */
  | 'navigation'

/** Caret animation behavior */
export type CaretAnimation =
  /** Caret slides from current position to new position */
  | 'slide'
  /**
   * Caret immediately jumps to new position in row and then animates with that
   * row to final position (default)
   */
  | 'slideWithRow'
  /** Caret immediately jumps to final position and bounces */
  | 'bounce'
  /** Caret immediately jumps to final position and large bounces */
  | 'largeBounce'
