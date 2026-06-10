# Bike Session Automation Reference

This document covers the session automation API — which is
exposed through three surfaces:

- **`bike` CLI** — shell scripts and agents.
- **`bike mcp` MCP** — Model Context Protocol server for agents.
- **`bike.session`** — the [DOM-extension API](../api/dom/session.d.ts).

All three speak the same wire (JSON-RPC to the running Bike app), so most commands,
parameters, and payloads correspond one-to-one. This document covers the shared
concepts once.

Bike has other automation surfaces not covered here: **extensions** (the full
app/dom/style context APIs — see [Creating Extensions](creating-extensions.md)
and the typed surface in [`api/`](../api/)), **AppleScript**, and **App
Intents** (Shortcuts).

## Targets and defaults

Commands target an **outline** (the document) or an **editor** (one view of an
outline). Every target is optional and defaults to the frontmost:

- CLI: `--outline` / `--editor` default to `@frontmost` (the app-frontmost
  outline/editor, resolved at call time).
- session: omitted `outline` / `editor` params resolve to `@host` — the DOM
  context's host window's outline/editor, stable as windows reorder — falling
  back to `@app` (app-frontmost) when the context has no live host window.
  Pass `'@app'` or `'@host'` explicitly to override.

### CLI file targets

CLI `--outline` accepts a persistent id **or a file path**. Resolution:

- An outline **open in Bike** always routes through the app, so unsaved edits
  are seen (reads) and never clobbered (mutations).
- Otherwise, for `get`/`create`/`update rows`/`delete`/`move`: a file path is
  read/written in place, and a persistent id is Spotlight-resolved to its file
  on disk (via the `kMDItemIdentifier` xattr Bike stamps on save. Headless
  mutations load the file in-process, mutate, and write back atomically through
  `NSFileCoordinator`, re-encoding in the file's own format and re-stamping the
  xattr. Headless targets require explicit row refs (persistent ids or
  OutlinePaths — session ids and `@selection`/`@focused` need the running app),
  and reads default to `-o json` (`session` is rejected unless open).
- Live commands — `observe`, `close outline`, `update editor`, etc — require the
  outline to be open ("Outline not open in Bike" otherwise).

## Ids

Each row has a **session id** and may have a **persistent id**. The `id` field
is overloaded by output format: in `session` output it carries the session id
(with `persistentId` as a separate field); in every file format (`json`,
`markdown`, `bike`, `opml`) `id` carries the persistent id.

- **Session ids** (numeric, UInt32) are stable while the outline remains open
  and reset when it closes. Every row has one. Session id `0` is the outline
  root. Editor view-state fields (focus, selection, collapsed) are row session
  ids. Use them to chain reads with follow-up mutations in one session.
- **Persistent ids** (strings) are stable cross-session handles stored in the
  outline file. For rows they are optional and assignable (assigning an
  existing id transfers it to the new row). Use them for references that must
  survive closes and saves.
- **Editor ids** are UUIDs, stable while the editor exists. The same outline
  open in two windows has two editors with distinct ids. Discover them with
  `bike get editors` / `getEditors()`.
- **Outline ids** are the outline root row's persistent id. Discover them with
  `bike get outlines` / `getOutlines()`.

## Row refs

A row ref identifies which rows a command targets. One of:

| Form | Meaning |
|---|---|
| session id | numeric; stable while the outline is open |
| persistent id | string; stable across runs and saves |
| OutlinePath | starts with `/`; matches a row set |
| `@selection` | the row containing the caret |
| `@focused` | the focused-in row, or the root |
| `@root` | the outline root row (the whole outline as a branch) |

Row-mutating commands default their refs to `@selection`. Headless (off-app)
targets accept only persistent ids and OutlinePaths.

`updateRows` / `update rows` can also assign persistent ids: pass a literal id
(exactly one row), or **`@ensure`** to assign fresh unique ids only to rows
that lack one (multi-row safe, idempotent).

## OutlinePath

OutlinePath is Bike's query language for selecting rows — XPath-like, with
bare predicates (`//task @done`) and slice brackets (`[0]`). It's accepted as
a row ref by any command that takes refs, as `observe outline query`'s path,
and as an editor filter. The default query is `//*` (every row). Query
positions must return a row set — scalar expressions (`count(...)`) are
rejected.

Validate an expression without executing it with `bike check path '<expr>'` /
`checkOutlinePath({ path })`: returns the parse tree, or a partial tree plus the
error. Bare `bike check path` prints the full syntax cookbook. See the Bike
User's Guide for the language reference. Intended for LLMs that are
trying to construct valid queries.

## Output formats (CLI)

CLI reads and snapshot streams take `-o`/`--output`:

| Format | Notes | `id` field |
|---|---|---|
| `session` | runtime/API JSON (default) | session id (+ separate `persistentId`) |
| `json` | portable file JSON shape | persistent id (omitted when unassigned) |
| `markdown` | Bike-flavored markdown | persistent id (optional) |
| `bike` | XML-conforming `.bike` HTML | persistent id (optional) |
| `opml` | OPML XML | persistent id (optional) |
| `txt` | plain text, one row per line | none |

`session` and `json` share the same `{metadata, root}` wrapper with rows nested
under `root.children`; they differ only in id semantics. Use `session` to chain
reads with mutations; use `json` to export an outline you'll load back later.
The session API always uses the `session` shape (`SessionOutline`).

## Text and runs

A row's `text` is an array of styled runs — `[{string, attrs?}, ...]` (see
`SessionTextRun`). Runs tile the row's text in order; concatenating each run's
`string` reproduces the plain text; empty text is `[]`. Standard `attrs` keys:
`strong`, `em`, `code`, `s`, `mark` (all value `""`), `a` (value is the URL),
`base` (`"sub"` or `"sup"`); arbitrary key/value attributes round-trip too.

Text **input** (`--text`/`--append`/`--prepend`, `createRow`'s `markdown`,
`updateRows`' `text`) accepts either Bike-flavored markdown (a leading marker
sets the row type, inline markdown is applied) or the same run array — use the
run form for attributes markdown can't express.

## Operations

Payload types in parentheses are defined in
[`session.d.ts`](../api/dom/session.d.ts).

### Outlines

```
CLI:     bike open outline <path | id:OUTLINE-ID> [--timeout <s>]
```
CLI-only. Opens (or brings to front) the outline at a path or by persistent id.

```
CLI:     bike create outline [<path>] [-f bike|markdown|opml|txt|json]
session: newOutline({ format? }) → OutlineSummary
```
No path: a new Untitled outline in Bike. CLI with a path: writes a new empty
file there and opens it (`--format` wins; else the path's extension; else txt).

```
CLI:     bike close outline [--outline <id-or-path>] [--discard]
session: closeOutline({ outline?, discard? }) → { closed }
```

```
CLI:     bike get outlines
session: getOutlines() → OutlineSummary[]
```
Open outlines, frontmost first — `{persistentId, displayName, fileURL}`.

### Reads

```
CLI:     bike get outline [<row-refs>...] [--outline <id-or-path>] [--shape tree|flat] [-o <fmt>]
CLI:     bike get outline rows [<row-refs>...] ...        (rows only, no document wrapper)
session: getOutline({ outline?, rowRefs?, shape? }) → SessionOutline
```
Frontmatter plus the rows matched by the refs (default `//*`). `tree` nests
matched rows under their nearest matched ancestor; `flat` emits every match at
top level. Each row carries `created` / `modified` timestamps as ISO 8601
strings; outline change events carry the same `modified` stamp.

```
CLI:     bike get editor [--editor <id>]
session: getEditor({ editor? }) → SessionEditor
```
Deep editor state: `{id, outlineId, focused, selection, collapsed, filter}`.
`focused` is the focus stack (root first, current focus last); `selection` has
`anchor`/`head` ends plus the covered `rows` and `text`.

```
CLI:     bike get editors
session: getEditors() → EditorSummary[]
```

```
CLI:     bike get commands
session: getCommands() → CommandInfo[]
```
The public command set (`{id, source}`) for `evaluate commands` /
`performCommands`. Command ids are namespaced, e.g. `edit:text-paste` or
`row:toggle-done`.

### Mutations

All row mutations take refs as described under *Row refs* and default to
`@selection` (CLI) / require explicit `rows` (session).

```
CLI:     bike create row  [--text "<markdown>"] [--outline <id-or-path>] [--parent <ref>] [--position start|end|N] [--before <ref> | --after <ref>]
CLI:     bike create rows -f <path|-> ...                 (multi-row / hierarchical markdown)
session: createRow({ outline?, markdown, parent?, position?, before?, after? }) → SessionRow
session: createRows({ ... }) → SessionRow[]
```

```
CLI:     bike update rows [<ref>...] [--text|--append|--prepend <input>] [--type <type>] [--attr k=v]... [--unset k]... [--persistent-id <id|@ensure>]
session: updateRows({ outline?, rows, text?, append?, prepend?, type?, attributes?, persistentId? }) → RowUpdateResult[]
```
The same updates apply to every referenced row. Switching to a textless type
(e.g. `hr`) clears the row's text (undo in Bike restores it). In `attributes`,
a `null` value removes the key.

```
CLI:     bike delete rows [<ref>...] [--outline <id-or-path>]
session: deleteRows({ outline?, rows }) → { deleted }
```
Deletes rows and their descendants.

```
CLI:     bike move rows [<ref>...] [--to <parent>] [--position start|end|N] [--before <ref> | --after <ref>]
session: moveRows({ outline?, rows, to?, position?, before?, after? }) → SessionRow[]
```

### Editor

```
CLI:     bike update editor [--focus <ref>] [--filter <expr>] [--select <ref> [--select-head <ref>]] [--expand <ref>...] [--collapse <ref>...]
session: updateEditor({ outline?, focus?, filter?, select?, selectHead?, expand?, collapse? }) → SessionEditor
```
Operations apply in order **focus → filter → fold → selection**. `filter` is
contains-text or an OutlinePath; an empty string ends the filter and restores
the pre-filter view. `selectHead` block-selects from `select` through that row.
`focus: '@root'` focuses out to the whole outline.

### Commands and scripting

```
CLI:     bike evaluate commands <id>... [--editor <id>] [--rows <session-id>...]
session: performCommands({ editor?, ids, rows? }) → { id, performed }[]
```
Runs named editor commands in order against the editor's current state. Ids
are validated up front (an unknown id aborts before anything runs) and
multi-command batches collapse into one undo step. `rows` (1–2 session ids)
targets the commands at that row or anchor…head range instead of the live
selection, leaving the selection undisturbed. A `performed: false` result is a
legitimate no-op (e.g. `row:move-up` at the top).

```
CLI:     bike evaluate script -f <path|-> [--input <text>]
session: evaluateScript({ script, input? }) → JSONValue
```
Evaluates JavaScript in Bike's app extension context (JavaScriptCore — plain
JS, no TypeScript or `import`). The script's last expression is the JSON
result. The app API hangs off the `bike` global — type surface:
<https://github.com/bike-outliner/extension-kit/tree/main/api>. If the script
evaluates to an arrow function it's called with `input`.

### Check

```
CLI:     bike check path [<outline-path>]
session: checkOutlinePath({ path }) → string
```
Parse-validates an OutlinePath (see *OutlinePath* above).

## Streaming

`observe` commands / `observe*` session methods are subscriptions: a snapshot
seed, then events as things change.

### Envelope and event kinds

The CLI prints NDJSON — one event per line, each
`{subscriptionId, outline, kind, data}` (non-`session` output formats print
snapshots separated by `---` instead). The session API unwraps the envelope
and hands callbacks typed payloads.

| kind | data | emitted by |
|---|---|---|
| `outline.snapshot` | `SessionOutline` (or rows-only fragment) | outline observers' seed, and reload re-seeds |
| `outline.change` | `SessionOutlineChange[]` (one batch) | `observe outline changes` |
| `editor.snapshot` | `SessionEditor` — or `{editor, outline}` in sync mode | editor observers' seed |
| `editor.change` | `SessionEditorChange[]` — or `{outline, editor}` in sync mode | `observe editor changes` |
| `documents.changed` | `OutlineSummary[]` (frontmost first) | `observe outlines` |
| `editors.changed` | `EditorSummary[]` (frontmost first; one entry per editor) | `observe editors` |
| `subscription.closed` | `{reason}` | stream termination |

Change payload shapes (`rowsInserted`, `rowsMoved`, `replacedText` with its
character offset `at`, editor `focus`/`selection`/`collapsed`/`filter` slices,
…) are typed in `session.d.ts`.

### Debounce

`--debounce <ms>` / `debounce` is the coalesce window, with two semantics:

- **Snapshot streams** (`observe outline [query]`, `observe editor`): the quiet
  window before a fresh snapshot is re-evaluated and sent — intermediate states
  are *dropped*. Default 500. Snapshots are deduped: nothing is sent unless the
  result actually changed.
- **Change streams** (`... changes`): changes are *collected* — losslessly, in
  order — into one batch per quiet window. Default 0 = one batch per
  transaction.

### Follow vs pin, and branch scope

With no explicit target, a subscription **follows the frontmost**
outline/editor: it re-targets and re-seeds whenever the frontmost changes, and
emits a null-data snapshot when nothing is open (each snapshot identifies its
source). An explicit id **pins** the subscription to that outline/editor for
its lifetime.

Outline streams take `--root <row-ref>` / `rootId` to scope to a branch (that
row + descendants; default `@root` = the whole outline). Branch streams re-root
the snapshot at that row and translate moves across the branch boundary into
`rowsRemoved`/`rowsInserted` so a branch mirror stays consistent.
`--rows` (CLI) streams rows only — the seed omits the document wrapper and no
`persistentMetadata` events are emitted.

### Editor + outline in sync

The editor's outline can ride along in the same feed: the seed carries both
`{outline, editor}` and each batch is `{outline, editor}` with outline changes
ordered first — so editor row-id references (selection, focus) are always valid
against the outline state, even mid-edit.

- CLI: `observe editor changes --outline` (a flag on the editor-changes stream).
- session: dedicated methods — `observeOutlineEditor` (maintained) and
  `observeOutlineEditorChanges` (raw) — rather than a flag on `observeEditor`.
  The maintained callback is `(outline, editor, changes)`.

The session method names diverge from the CLI flag deliberately; the underlying
wire stream (`editor.observeChanges` with `outline: true`) is identical.

### Lifecycle

A stream may end with a final `{kind: "subscription.closed", data: {reason}}`:
`outlineClosed` (the pinned outline was closed) or `appQuitting`. Ctrl-C /
SIGTERM end a CLI stream with a bare EOF — no terminator. session
subscriptions take `options.onClose(reason)` (also `canceled` / `domUnloaded`)
and are disposed with `subscription.dispose()`.

### Maintained observers (session only)

The CLI prints raw feeds; the session API additionally offers maintained forms
that apply changes for you and call back with current state:

- `observeOutline(params, (outline, changes) => …)` — a live `SessionOutline`.
- `observeEditor(params, (editor, changes) => …)` — a live `SessionEditor`.
- `observeOutlineEditor(params, (outline, editor, changes) => …)` — a live
  `SessionOutline` and `SessionEditor` maintained in sync.

The raw feeds (`observeOutlineChanges`, `observeEditorChanges`,
`observeOutlineEditorChanges`, `observeOutlineQuery` snapshots, `observeOutlines`,
`observeEditors`) match the CLI streams one-to-one.

`observeOutlines` / `observeEditors` re-send the full list on every open/close
and frontmost change. The editor list is one entry per *editor* view, so an
outline open in two windows appears twice; it can briefly lag when an editor
opens or closes without a document add/remove or frontmost change (e.g. closing
a non-frontmost window, or — once a window can host more than one editor — a
split within the frontmost window).
