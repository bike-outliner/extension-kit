# DOM Context Tutorial

Show custom HTML UI in sheets, panels, windows and inspector items. For simple
prompts, use the app context's alerts and pickers instead.

- [DOM Context API](../api/dom/)
- Entry points: `dom/*.ts(x)`

This tutorial passes messages between the app and DOM contexts. `bike.session`
is simpler but less flexible; see the
[Todos](https://github.com/bike-outliner/example-extensions/tree/main/src/todos.bkext)
example.

## Archive Done Sheet

Extend the [App Context Tutorial](app-context-tutorial.md) command to show a
sheet with the number of archived rows.

### Protocol

A protocol extends `DOMProtocol` and types the messages in each direction:

- `toDOM`: app context → DOM context
- `toApp`: DOM context → app context

`dom/protocols.ts` is typechecked in both contexts, so put protocols there:

```typescript
import { DOMProtocol } from 'bike/core'

export interface ArchiveDoneProtocol extends DOMProtocol {
  toDOM: { type: 'archiveCount'; count: number }
  toApp: never
}
```

### DOM Script

`dom/archive-done-sheet.ts`:

```typescript
import { DOMExtensionContext } from 'bike/dom'
import { ArchiveDoneProtocol } from './protocols'

export async function activate(context: DOMExtensionContext<ArchiveDoneProtocol>) {
  context.element.textContent = 'Loading...'
  context.onmessage = (message) => {
    context.element.textContent = `Archived ${message.count} rows`
  }
}
```

### App Context

In `app/main.ts`, import the protocol and present the sheet at the end of
`archiveDoneCommand`:

```typescript
import { ArchiveDoneProtocol } from '../dom/protocols'

// …after the transaction:
bike.frontmostWindow?.presentSheet<ArchiveDoneProtocol>('archive-done-sheet.js').then((handle) => {
  handle.postMessage({ type: 'archiveCount', count: doneRows.length })
})
```

The type parameter restricts `handle.postMessage` to `toDOM` messages and types
`handle.onmessage` with `toApp` plus sheet events such as `bike:dismissed`.
Escape closes the sheet; `handle.dispose()` closes it from code.

## Using React

Each web view loads one bundled copy of React, and the kit resolves `react`
imports to it. `.tsx` and JSX are supported.

## Receiving Dropped Rows

Rows dragged over a web view dispatch bubbling events on the element under the
cursor: `bike:rowdragenter`, `bike:rowdragover`, `bike:rowdragleave` and
`bike:rowdrop`.

- Call `preventDefault()` on `bike:rowdragenter` or `bike:rowdragover` to accept
  the drop. Otherwise no `bike:rowdrop` fires.
- Native drags don't trigger CSS `:hover`; toggle highlight classes from the
  enter/over/leave events.
- `detail` is `{ outline, rows, clientX, clientY }`: the source outline's
  persistent id and the rows' session ids, usable directly with `bike.session`,
  even across documents.

```typescript
context.element.addEventListener('bike:rowdragover', (e) => {
  if ((e.target as HTMLElement).closest('.drop-zone')) e.preventDefault()
})
context.element.addEventListener('bike:rowdrop', (e) => {
  const { outline, rows } = e.detail
  bike.session.updateRows({ outline, rows, attributes: { flagged: '' } })
})
```

The calendar core extension uses this to set `due` when a row is dropped on a
day.

## Next Steps

[Style Context Tutorial](style-context-tutorial.md)
