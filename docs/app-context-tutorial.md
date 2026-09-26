# App Context Tutorial

Add a command, a keybinding and a toolbar button in the app context.

- [App Context API](../api/app/)
- Entry point: `app/main.ts`
- Final code: [`tutorial.bkext`](https://github.com/bike-outliner/example-extensions/tree/main/src/tutorial.bkext)

## Creating Commands

This command moves done rows into an "Archive" row. In `app/main.ts`:

```typescript
import { AppExtensionContext, CommandContext, Row } from 'bike/app'

export async function activate(context: AppExtensionContext) {
  bike.commands.addCommands({
    commands: {
      'tutorial:archive-done': archiveDoneCommand,
    },
  })
}

function archiveDoneCommand(context: CommandContext): boolean {
  let editor = context.editor
  if (!editor) return false

  let outline = editor.outline
  let doneRows = outline.query('//@done except //@id = archive//*').value as Row[]
  let archiveRow = (outline.query('//@id = archive').value as Row[])[0]

  outline.transaction({ animate: 'default' }, () => {
    if (!archiveRow) {
      archiveRow = outline.insertRows(
        [{ persistentId: 'archive', text: 'Archive' }],
        outline.root,
      )[0]
    }
    outline.moveRows(doneRows, archiveRow)
  })

  return true
}
```

Run it from the Command Palette (<kbd>Command-Shift-P</kbd>) as "Tutorial:
Archive Done". Done rows move under "Archive".

## Adding Keybindings

In `activate`:

```typescript
bike.keybindings.addKeybindings({
  keymap: 'block-mode',
  keybindings: {
    a: 'tutorial:archive-done',
  },
})
```

Keybindings apply only while the outline editor has focus. Press
<kbd>Escape</kbd> to enter block mode, then <kbd>a</kbd>.

## Adding a Toolbar Button

Give the command definition a `button` with an SF Symbol and a `location` of
`'titlebar'`, `'toolbar'` or `'statusbar'`:

```typescript
'tutorial:archive-done': {
  button: { symbol: 'archivebox', location: 'toolbar' },
  action: archiveDoneCommand,
},
```

Bike adds the button the first time it sees the command. After that the user
owns it: Interface Explorer can move, change or remove it, and **Reset to
Extension Default** restores it.

## Next Steps

[DOM Context Tutorial](dom-context-tutorial.md): show a sheet after archiving.
