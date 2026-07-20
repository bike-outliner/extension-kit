# Attachments Tutorial

Bike outlines can embed file attachments. Extensions get read-only access to attachment data: metadata and bytes in the app context, and a URL scheme for displaying attachments in DOM views.

- [App Context API](../api/app/) and [DOM Context API](../api/dom/)
- Attachments are runs of row text carrying an `embed` text attribute (the *src*).
- The API is read-only — attachments are added by the user (drag and drop), not by extensions.
- Import the API using `import { SYMBOL } from 'bike/app'`.

## Setup

This tutorial assumes that you have [created an extension](creating-extensions.md) and are running `npx bike-ext watch --install`. Drag a file or two into a test outline so there's something to find.

## Finding Attachments

An attachment lives in a row's text as a run whose `embed` attribute is the attachment src (e.g. `'assets/photo.png'`). Query attachment runs with the `run::` axis:

```typescript
import { RowRun } from 'bike/app'

function attachmentSrcs(outline: Outline): string[] {
  const result = outline.query('//*/run::@embed')
  if (result.type !== 'elements') return []
  return (result.value as RowRun[]).map((run) => run.runAttributes['embed'])
}
```

Each element is a `RowRun`: `run.row` is the containing row, `run.runAttributes['embed']` is the src you'll hand to the attachment APIs below.

## Reading Metadata

`outline.attachmentMetadata(src)` resolves a src to the attachment's file:

```typescript
const meta = outline.attachmentMetadata(src)
if (meta) {
  console.log(meta.url.toString(), meta.mimeType)
}
```

It returns `undefined` when the src doesn't resolve — an invalid src, an outline with no document, or a missing attachment file. Attachments added this session resolve to staged copies, so the URL is readable before the document saves.

## Reading Bytes

`outline.attachmentBytes(src)` reads the attachment's contents as a `Promise<Uint8Array>`:

```typescript
bike.commands.addCommands({
  commands: {
    'attachments:report': ({ editor }) => {
      if (!editor) return false
      const outline = editor.outline
      Promise.all(
        attachmentSrcs(outline).map(async (src) => {
          const bytes = await outline.attachmentBytes(src)
          return `${src}: ${bytes.length} bytes`
        })
      ).then((lines) => {
        editor.showStatusMessage(lines.join(' · ') || 'No attachments')
      })
      return true
    },
  },
})
```

The promise rejects when the src can't be resolved or the file can't be read, so `await` inside try/catch (or `.catch`) when srcs come from user content.

## Displaying Attachments in DOM Views

DOM scripts (sheets, panels, inspector items) can't read files, but they can display attachments directly. In the DOM context, `bike.attachmentURL(src)` builds a `bike-attachment://` URL that Bike's WebView serves from the attachment file:

```tsx
// dom/panel.tsx
const url = bike.attachmentURL(src)
return <img src={url} />
```

Pass the src strings from your app context to the DOM view over `postMessage` — the app side finds the attachments (as above), the DOM side renders them.

## Next Steps

Follow the [DOM Context Tutorial](dom-context-tutorial.md) to build the panel that displays them.
