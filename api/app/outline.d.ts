import { JSONStore } from '../core/json'
import { OutlinePath, OutlinePathValue } from '../core/outline-path'
import { Disposable, URL } from './system'

/** Tree of rows. */
export class Outline {
  /** Not visible in the editor. */
  readonly root: Row

  /** Creates a detached outline, e.g. to archive query results. */
  constructor(rows?: RowSource)

  /** Not saved. */
  readonly runtimeMetadata: JSONStore

  /**
   * Saved in file frontmatter/metadata. Not saved for plain text documents
   * unless key `bikemd` is `true`.
   */
  readonly persistentMetadata: JSONStore

  /** Sorted, reserved names excluded. Scans the whole outline. */
  readonly attributeNames: string[]

  /** @param format Default `bike`. */
  archive(format?: OutlineFormat): OutlineArchive

  getRowById(id: RowId | PersistentId): Row | undefined

  /**
   * Resolves an absolute URL or a `#ROWREF` shorthand, which expands to
   * `bike://<this-outline-root>/#ROWREF`.
   *
   * Row references in `bike://` URLs resolve on open, trying in order: a
   * {@link PersistentId} (the only form Bike writes), a session
   * {@link RowId} (signed or unsigned spelling), then a 1-based row number.
   *
   * @returns Undefined if the string is malformed or the root has no
   *   persistent id.
   */
  resolveLink(string: string): URL | undefined

  /**
   * @param src An attachment run's `embed` attribute, e.g. `assets/photo.png`.
   *   Unsaved attachments resolve to staged copies.
   * @returns Undefined when `src` is invalid, the outline has no document, or
   *   no file exists.
   */
  attachmentMetadata(src: string): AttachmentMetadata | undefined

  /** Rejects when the attachment can't be resolved or read. */
  attachmentBytes(src: string): Promise<Uint8Array>

  /**
   * @param rows Always copied.
   * @param parent Default root.
   */
  insertRows(rows: RowSource, parent?: Row, before?: Row): Row[]

  /** Rows and parent must already be in this outline. */
  moveRows(rows: Row[], parent: Row, before?: Row): void

  removeRows(rows: Row[]): void

  query(path: OutlinePath): OutlinePathValue

  scheduleQuery(path: OutlinePath, handler: (value: OutlinePathValue) => void): Disposable

  /**
   * Re-runs as the outline changes, debounced. Intermediate states may be
   * skipped; the final state is always reported.
   */
  observeQuery(path: OutlinePath, handler: (value: OutlinePathValue) => void): Disposable

  /** Describes the path's AST, parse sequence, and errors. */
  explainQuery(path: OutlinePath): string

  /**
   * Groups changes so the view updates once.
   * @returns The value returned by `update`.
   */
  transaction(options: TransactionOptions, update: () => any): any

  /** Keeps the next edit from coalescing with the previous undo entry. */
  breakUndoCoalescing(): void

  observeChanges(handler: (change: OutlineChange) => void): Disposable

  /** Called once when the document closes, just before the document's `onClose`. */
  onClose(handler: () => void): Disposable
}

export type OutlineArchive = { data: string; format: OutlineFormat }
export type OutlineFormat = 'bike' | 'opml' | 'plaintext'

export interface AttachmentMetadata {
  /** File URL; a staged copy when unsaved. */
  readonly url: URL
  /** From the file extension; `application/octet-stream` when unknown. */
  readonly mimeType: string
}

/**
 * Structural changes are grouped into runs of contiguous siblings. Only the
 * top-level siblings are reported, not their descendants.
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
      // Linked type and text change, e.g. setting type `hr` replaces the text.
      type: 'replacedTextAndSetType'
      at: number
      replacedText: AttributedString
      insertedText: AttributedString
      oldType: RowType
      newType: RowType
    }

/** A paragraph of text with child rows. */
export interface Row {
  readonly outline: Outline
  /** Unique within the outline; not persistent across loads. */
  readonly id: RowId
  persistentId?: PersistentId
  /** Mints a persistent id when absent. */
  ensurePersistentId(): PersistentId
  /** `bike://` link naming the outline and row by persistent id. */
  url(): URL

  /**
   * The `log`-typed child holding this row's history. Entries are ordinary
   * rows with `log-*` attributes; every entry has `log-date`.
   */
  readonly log?: Row
  /** Creates the log as the last child when absent. */
  ensureLog(): Row

  /** Default `body`. */
  type: RowType
  text: AttributedString

  /** Wire strings as stored. */
  readonly attributes: Record<RowAttributeName, string | undefined>

  /**
   * Wire string. Decode with `bike.decodeValue(type, wire)`, or label with
   * `bike.displayValue(type, wire)` / `env.formatAttribute(name, wire)`.
   */
  getAttribute(name: RowAttributeName): string | undefined

  /**
   * Throws for a non-string (null/undefined removes) or a rejected
   * {@link RowAttributeName}. Stored verbatim: use `bike.encodeValue` for
   * canonical values (a hand-written `PT90M` is not normalized to `PT1H30M`).
   */
  setAttribute(name: RowAttributeName, wire: string): void

  /** Accepts any name a document can hold, including ones `setAttribute` rejects. */
  removeAttribute(name: RowAttributeName): void

  /** Root is 0. */
  readonly level: number
  readonly ancestors: Row[]
  readonly ancestorsWithSelf: Row[]
  /** Undefined only for the root. */
  readonly parent?: Row
  readonly prevSibling?: Row
  readonly nextSibling?: Row
  readonly firstChild?: Row
  readonly lastChild?: Row

  readonly firstLeaf: Row
  readonly lastLeaf: Row
  readonly children: Row[]
  readonly descendants: Row[]
  readonly descendantsWithSelf: Row[]
  readonly prevBranch?: Row
  readonly nextBranch?: Row
  readonly prevInOutline?: Row
  readonly nextInOutline?: Row

  /** True if `row` is an ancestor of this row. */
  isAncestor(row: Row): boolean
  /** True if `row` is a descendant of this row. */
  isDescendant(row: Row): boolean
}

/**
 * Rich text. Marker attributes such as `strong` use an empty string value;
 * stylesheets decide how they render.
 */
export class AttributedString {
  static fromMarkdown(markdown: string): AttributedString

  /** @param html A `<p>` element. */
  static fromHTML(html: string): AttributedString

  string: string

  count: number

  /**
   * @param affinity Disambiguates run boundaries. Default `upstream`.
   * @param effectiveRange Filled in with the attribute's range.
   */
  attributeAt(
    attribute: TextAttributeName,
    index: number,
    affinity?: Affinity,
    effectiveRange?: Range
  ): string | undefined

  /**
   * @param affinity Disambiguates run boundaries. Default `upstream`.
   * @param effectiveRange Filled in with the attributes' range.
   */
  attributesAt(
    index: number,
    affinity?: Affinity,
    effectiveRange?: Range
  ): Record<TextAttributeName, string>

  /** @param range Default entire string. */
  addAttribute(name: TextAttributeName, value: string, range?: Range): void

  /** @param range Default entire string. */
  addAttributes(attributes: Record<TextAttributeName, string>, range?: Range): void

  /** @param range Default entire string. */
  removeAttribute(name: TextAttributeName, range?: Range): void

  substring(range: Range): AttributedString

  insert(position: number, text: string | AttributedString): void

  replace(range: Range, text: string | AttributedString): void

  append(text: string | AttributedString): void

  delete(range: Range): void

  toMarkdown(): string

  toHTML(): string
}

export type PersistentId = string

/**
 * Unprefixed; Bike adds and strips `data-` in `.bike`/HTML.
 * {@link Row.setAttribute} rejects: names starting with `data-`, a digit, `-`
 * or `.`; `id`, `text`, `type`, `created`, `modified`, `indent`; empty names;
 * names containing whitespace, `"`, `'`, `=`, `<`, `>`, `&`, `/`.
 */
export type RowAttributeName = string

/** Any string. Built-ins are HTML tags in `.bike`; custom names are spans. */
export type TextAttributeName =
  | 'em'
  | 'strong'
  | 'code'
  | 'mark'
  | 's'
  | 'a'
  | 'base'
  | string

/** Start inclusive, end exclusive. */
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

/** Which side an ambiguous position binds to, e.g. end of a wrapped line vs start of the next. */
export type Affinity = 'upstream' | 'downstream'

/**
 * Copied into new rows. Ids that already exist in the outline are regenerated
 * and imported links updated.
 */
export type RowSource =
  | string[]
  | RowTemplate[]
  | Row[]
  | Outline
  | OutlineArchive
  | OutlinePathValue

/** Values for a new row; rows can't be constructed directly. */
export type RowTemplate = {
  persistentId?: string
  type?: RowType
  attributes?: Record<RowAttributeName, string>
  text?: string | AttributedString
  format?: 'plain' | 'markdown'
}

export type TransactionOptions =
  | 'default'
  | {
      /** Undo menu label. */
      label?: string
      animate?:
        | 'none'
        | 'default'
        | {
            spring: Spring
            caret?: CaretAnimation
          }
    }

export type Spring =
  /** Typing. */
  | 'char'
  /** Moving rows. Default. */
  | 'row'
  /** Expand and collapse. */
  | 'fold'
  /** Focus in and out. */
  | 'navigation'

export type CaretAnimation =
  | 'slide'
  /** Jumps to its new position in the row, then moves with the row. Default. */
  | 'slideWithRow'
  /** Jumps to the final position and bounces. */
  | 'bounce'
  | 'largeBounce'
