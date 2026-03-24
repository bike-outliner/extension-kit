# DOM Context Tutorial

Use the DOM context to display custom UI using HTML and DOM.

You can present a sheet, panel, window, and add views to the inspector sidebar.
Note, your extension might not need to use the DOM context. Instead, you can
also use the app context to present alerts and pickers. The DOM context is only
necessary when you want a fully custom view.

- [DOM Context API](../api/dom/)
- Entry points: `dom/*.ts(x)`
- Code runs in web views embedded in Bike's UI.
- Web views are sandboxed with no network access.
- These views are loaded dynamically using app context APIs.
- Communicate with the originating app context using `postMessage` and `onmessage`.
- Import the API using `import { SYMBOL } from 'bike/dom'`.

## Setup

This tutorial assumes that you have completed the [App Context Tutorial](app-context-tutorial.md) and are running `npx bike-ext watch --install`. Your extension should automatically build and install when you save changes.

## Create "Archive Done" Sheet

We will modify the "Archive Done" command to show a sheet with the number of archived rows.

### Overview

1. Define a typed messaging protocol at `dom/protocols.ts`.
2. Create a DOM script at `dom/<scriptname>` that uses the protocol.
3. Pass the script name to the app context API `window.presentSheet`.
4. Use the returned handle to send the row count to the DOM context for display.

### Define a Typed Messaging Protocol

App and DOM contexts communicate via `postMessage` and `onmessage`. To get
compile-time safety, define a **typed protocol** that describes the message
types flowing in each direction.

A protocol extends `DOMProtocol` from `bike/core` and declares the message types flowing in each direction:

- `toDOM` — messages sent from the app context *to* the DOM context
- `toApp` — messages sent from the DOM context *to* the app context

Create a new file at `dom/protocols.ts`:

```typescript
import { DOMProtocol } from 'bike/core'

export interface ArchiveDoneProtocol extends DOMProtocol {
  toDOM: { type: 'archiveCount'; count: number }
  toApp: never
}
```

This protocol says the app side will send an `archiveCount` message with a `count`, and the DOM side won't send anything back (`never`).

Protocol files should always be placed in `dom/protocols.ts`. This file is
typechecked in both the app and DOM contexts, so both sides share a single
protocol definition.

### Create the DOM Script

Create a new file at `dom/archive-done-sheet.ts`:

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

By passing `ArchiveDoneProtocol` as the type parameter to `DOMExtensionContext`, `context.onmessage` receives the correctly typed message. If you try to access a property that doesn't exist on the protocol, the compiler will catch it.

### Modify the App Context

Update `archiveDoneCommand` in `app/main.ts` to present the sheet after archiving:

```typescript
...

import { ArchiveDoneProtocol } from '../dom/protocols'

...

function archiveDoneCommand(context: CommandContext): boolean {
  let editor = context.editor
  if (!editor) return false

  let outline = editor.outline
  let donePath = '//@done except //@id = archive//*'
  let doneRows = outline.query(donePath).value as Row[]
  let archiveRow = (outline.query('//@id = archive').value as Row[])[0]

  outline.transaction({ animate: 'default' }, () => {
    if (!archiveRow) {
      archiveRow = outline.insertRows(
        [
          {
            id: 'archive',
            text: 'Archive',
          },
        ],
        outline.root,
      )[0]
    }
    outline.moveRows(doneRows, archiveRow)
  })

  // Present the archive done sheet with the count of done rows
  bike.frontmostWindow?.presentSheet<ArchiveDoneProtocol>('archive-done-sheet.js').then((handle) => {
    handle.postMessage({ type: 'archiveCount', count: doneRows.length })
  })

  return true
}
```

The `presentSheet<ArchiveDoneProtocol>` type parameter ensures `handle.postMessage` only accepts messages matching the `toDOM` type. The returned `SheetHandle` also types `handle.onmessage` using `toApp` (plus built-in sheet lifecycle events like `bike:dismissed`).

Save, and your modified extension should rebuild and install.

Now in Bike, perform the archive done command. The sheet should present, telling you how many rows were archived. Press the Escape key to close the sheet. In code, you can close the sheet by calling `dispose()` on the returned handle.

## Using React

For more complex custom views, you might want to use React.

Bike bundles and loads a single copy of React into each web view. The extension kit is set up to use that bundled version when you import React into your DOM script. You may also use the `.tsx` file extension and JSX syntax in your DOM script.

## Next Steps

Follow the [Style Context Tutorial](style-context-tutorial.md) to create your own editor styles.
