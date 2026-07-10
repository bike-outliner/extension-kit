# Bike Session Automation

The session automation API is exposed in two places:

- `bike` — Command line interface (CLI) for shell scripts.
- `bike.session` — DOM context TypeScript [API](../api/dom/session.d.ts).

They share the same underlying implementation, concepts, and payload shapes. This document covers those shared concepts. There is also the related `bike mcp`, an MCP server through which AI agents can interact with Bike.

**Example Usage:**

CLI:

```bash
# Get frontmost outline
bike get outline
# Add new row to frontmost outline
bike create row --text "- [ ] Buy **milk**"
# Stream remaining todos in Markdown
bike observe outline query --path '//task not @done' --rows --output markdown
```

Session API Examples:

- [Todos](https://github.com/bike-outliner/example-extensions/tree/main/src/todos.bkext) – Interactive todos inspector.
- [D3](https://github.com/bike-outliner/example-extensions/tree/main/src/d3.bkext) – Sync D3.js layouts with your outline.

## Targets

Concept: commands target an outline or an editor.

In the CLI the default is the `@frontmost` window. In DOM Context the default is `@window`, the window the script is associated with. You can also target outlines by persistent id or file path (editors by id).

The session API can only target open outlines, while the CLI can target both open and closed outlines. An open outline always routes through Bike, so unsaved edits are seen. A closed outline is read/written in place without going through Bike.app. It works even when Bike isn't running.

## Identifiers

Each row has a session id and may have a persistent id.

The row `id` field is overloaded by output format: in `session` output it carries the session id and `persistentId` as a separate field. In every other output format `id` carries the persistent id and session ids are not included.

- **Outline ids** are persistent.
- **Editor ids** are not persistent.
- **Row Session ids** are not persistent, discarded when the outline closes.
- **Row Persistent ids** are optional and persistent. Assigning an existing id transfers it to the new row.

## Row references

A row ref identifies which rows a command targets.

| Form | Meaning |
|---|---|
| row session id | numeric; stable while the outline is open |
| row persistent id | string; stable across runs and saves |
| OutlinePath | starts with `/`; matches a row set |
| `@selection` | the row containing the caret |
| `@focused` | the focused-in row, or the root |
| `@root` | the outline root row |

## OutlinePath

OutlinePath is Bike's query language for selecting rows. See Bike guide for syntax. It's accepted as a row ref by any command that takes refs, and by `observe outline query`, and as an editor filter.

## Outline shape

When performing a query, you can specify the shape of the outline data returned. Either a flat list of rows, or a nested under matched ancestors tree. Some commands also offer the option to return rows only, without the outline wrapper/metadata.

## Output formats

| Format | Notes | `id` field |
|---|---|---|
| `session` | runtime/API JSON (default) | session id (+ separate `persistentId`) |
| `json` | portable file JSON shape | persistent id (optional) |
| `markdown` | Bike-flavored markdown | persistent id (optional) |
| `bike` | XML-conforming `.bike` HTML | persistent id (optional) |
| `opml` | OPML XML | persistent id (optional) |
| `txt` | plain text, one row per line | none |

## Operations

See [`session.d.ts`](../api/dom/session.d.ts) for payload types.

| | CLI | session |
|---|---|---|
| **Outlines** | | |
| list | `get outlines` | `getOutlines` |
| open | `open outline` | *(CLI only)* |
| create | `create outline` | `createOutline` |
| close | `close outline` | `closeOutline` |
| **Reads** | | |
| read outline / rows | `get outline [rows]` | `getOutline` |
| read editor | `get editor` | `getEditor` |
| list editors | `get editors` | `getEditors` |
| list commands | `get commands` | `getCommands` |
| **Rows** | | |
| create | `create row` / `create rows` | `createRow` / `createRows` |
| update | `update rows` | `updateRows` |
| delete | `delete rows` | `deleteRows` |
| move | `move rows` | `moveRows` |
| **Editor** | | |
| update editor | `update editor` | `updateEditor` |
| **Scripting** | | |
| run commands | `evaluate commands` | `evaluateCommands` |
| run script | `evaluate script` | `evaluateScript` |

Behavior worth knowing:

- **delete** removes the matched rows and their descendants.
- **update rows** applies one change to every ref: a `null` attribute removes the key.
- **run script** evaluates plain JS in Bike's app extension context. JavaScriptCore, no
  TypeScript or `import`.

## Streaming

The `observe` commands stream results. The stream is a combination of full snapshots and finer grained events. The session API also offers maintained state callbacks that apply events to a maintained outline/editor state for you, and provide that state in each update.

| | CLI | session |
|---|---|---|
| **Lists** | | |
| open outlines | `observe outlines` | `observeOutlines` |
| editors | `observe editors` | `observeEditors` |
| **Outline** | | |
| snapshot stream | `observe outline query` | `observeOutlineQuery` |
| outline changes | `observe outline changes` | `observeOutlineChanges` |
| maintained tree | — | `observeOutline` |
| **Editor** | | |
| snapshot stream | `observe editor` | — |
| editor changes | `observe editor changes` | `observeEditorChanges` |
| maintained state | — | `observeEditor` |
| **OutlineEditor** | | |
| synced changes | `observe outline-editor changes` | `observeOutlineEditorChanges` |
| maintained | — | `observeOutlineEditor` |

Behavior worth knowing:

- **Follow vs pin** — with no target a subscription follows the frontmost, re-targeting on every frontmost change (null-data snapshot when nothing is open); an explicit id pins it for its lifetime.
- **Branch scope** — outline streams take a root id to scope to a branch; moves across the boundary become `rowsRemoved`/`rowsInserted`.
- **Editor + Outline** — combines editor and outline state in a synced stream, ensuring editor state is always in sync with the outline state.
