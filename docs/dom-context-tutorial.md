# DOM Context Tutorial

Use the DOM context to display custom UI using HTML and DOM.

Currently, you can present a custom sheet over a window or add custom views to the inspector bar. Note, your extension might not need to use the DOM context. Instead, you can use the app context to present alerts and add items to the sidebar, just not fully custom UI.

- [DOM Context API](../api/dom/)
- Entry points: `dom/*.ts(x)`
- Code runs in web views embedded in Bike's UI.
- Web views are sandboxed and have no network access.
- These views are loaded dynamically using app context APIs.
- Communicate with the originating app context using `postMessage` and `onmessage`.
- Import the API using `import { SYMBOL } from 'bike/dom'`.

## Setup

This tutorial assumes that you have completed the [App Context Tutorial](app-context-tutorial.md) and are running `npx bike-ext watch --install`. Your extension should automatically build and install when you save changes.

## Create "Archive Done" Sheet

We will modify the "Archive Done" command to show a sheet with the number of archived rows.

### Overview

1. Create a DOM script at `dom/<scriptname>`.
2. Pass the script name to the app context API `window.presentSheet`.
3. Use the returned handle to send the row count to the DOM context for display.

### Create the DOM Script

Create a new file at `dom/archive-done-sheet.ts`:

```typescript
import { DOMExtensionContext } from 'bike/dom'

export async function activate(context: DOMExtensionContext) {
  context.element.textContent = 'Loading...'
  context.onmessage = (message) => {
    context.element.textContent = message
  }
}
```

### Modify the App Context

Update `archiveDoneCommand` in `app/main.ts` to present the sheet after archiving:

```typescript
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
  bike.frontmostWindow?.presentSheet('archive-done-sheet.js').then((handle) => {
    handle.postMessage(doneRows.length)
  })

  return true
}
```

Save, and your modified extension should rebuild and install.

Now in Bike, perform the archive done command. The sheet should present, telling you how many rows were archived. Press the Escape key to close the sheet. In code, you can close the sheet by calling `dispose()` on the returned handle.

## Using React

For more complex custom views, you might want to use React.

Bike bundles and loads a single copy of React into each web view. The extension kit is set up to use that bundled version when you import React into your DOM script. You may also use the `.tsx` file extension and JSX syntax in your DOM script.

## Next Steps

Follow the [Style Context Tutorial](style-context-tutorial.md) to create your own editor styles.
