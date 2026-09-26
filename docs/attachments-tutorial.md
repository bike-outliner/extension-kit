# Attachments Tutorial

Extensions can read attachments: metadata and bytes in the app context, and a
display URL in DOM views. Attachments are added by the user, not by extensions.

- [App Context API](../api/app/) and [DOM Context API](../api/dom/)

## Finding Attachments

An attachment is a run of row text whose `embed` attribute is the attachment
src (e.g. `'assets/photo.png'`). Query them with the `run::` axis:

```typescript
import { Outline, RowRun } from 'bike/app'

function attachmentSrcs(outline: Outline): string[] {
  const result = outline.query('//*/run::@embed')
  if (result.type !== 'elements') return []
  return (result.value as RowRun[]).map((run) => run.runAttributes['embed'])
}
```

`run.row` is the containing row.

## Reading Metadata

```typescript
const meta = outline.attachmentMetadata(src)
if (meta) {
  console.log(meta.url.toString(), meta.mimeType)
}
```

Returns `undefined` for an invalid src, an outline with no document, or a
missing file. Attachments added this session resolve to staged copies, so they
are readable before the document is saved.

## Reading Bytes

`outline.attachmentBytes(src)` returns a `Promise<Uint8Array>`. It rejects when
the src can't be resolved or read, so catch errors for user content:

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

## Displaying Attachments in DOM Views

DOM scripts can't read files, but `bike.attachmentURL(outlineId, src)` returns a
`bike-attachment://` URL that the web view serves. From the app context, send
the srcs together with the outline id (`outline.root.ensurePersistentId()`):

```tsx
// dom/panel.tsx
const url = bike.attachmentURL(outlineId, src)
return <img src={url} />
```
