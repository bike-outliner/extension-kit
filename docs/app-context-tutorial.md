# App Context Tutorial

Use the app context to add commands, keybindings, and work with system resources like the clipboard.

- [App Context API](../api/app/)
- Entry point: `app/main.ts`
- Code runs in Bike's native app environment.
- Interact with outlines, clipboard, networking, etc.
- Some APIs require appropriate `manifest.json` permissions.
- Import the API using `import { SYMBOL } from 'bike/app'`.

 The final code for these tutorials is in the
[example-extensions](https://github.com/bike-outliner/example-extensions)
repository and then in `src/tutorial.bkext`.

## Setup

This tutorial assumes that you have [created an
extension](creating-extensions.md) and are running `npx bike-ext watch
--install`. Your extension should automatically build and install when you save
changes.

## Creating Commands

We'll create a command that moves completed items to an "Archive" section. Feel
free to delete or leave in place the example code generated in `app/main.ts`
when you created the extension.

### Basic Command Structure

Open `app/main.ts` and add a function to handle command logic:

```typescript
function archiveDoneCommand(context: CommandContext): boolean {
  console.log('Archive Done!')
  return true
}
```

Register the command in the activate function:

```typescript
import { AppExtensionContext, CommandContext } from 'bike/app'

export async function activate(context: AppExtensionContext) {
  bike.commands.addCommands({
    commands: {
      'tutorial:archive-done': archiveDoneCommand,
    },
  })
}
```

Save your changes and the updated extension should install and you can execute
the command via Command Palette using `Command-Shift-P`. Search for "Tutorial:
Archive Done". To see the `console.log` output, open Bike > Logs Explorer and
make sure your extension is checked in the sidebar.

## Adding Keybindings

Attach keyboard shortcuts within the activate function:

```typescript
export async function activate(context: AppExtensionContext) {
  bike.commands.addCommands({
    commands: {
      'tutorial:archive-done': archiveDoneCommand,
    },
  })

  bike.keybindings.addKeybindings({
    keymap: 'block-mode',
    keybindings: {
      a: 'tutorial:archive-done',
    },
  })
}
```

Keybindings function only when the outline editor has focus, not other UI
elements. It should be that you can now go to the editor, press "Escape" to
enter block mode, and then press "a" to execute the command. And see "Archive
Done!" in the logs.

## Archive Implementation

The complete working code combines imports and command logic:

```typescript
import { AppExtensionContext, Row, CommandContext } from 'bike/app'

export async function activate(context: AppExtensionContext) {
  bike.commands.addCommands({
    commands: {
      'tutorial:archive-done': archiveDoneCommand,
    },
  })

  bike.keybindings.addKeybindings({
    keymap: 'block-mode',
    keybindings: {
      a: 'tutorial:archive-done',
    },
  })
}

function archiveDoneCommand(context: CommandContext): boolean {
  let editor = context.editor
  if (!editor) return false

  // Get the outline, done rows, and archive row
  let outline = editor.outline
  let donePath = '//@done except //@id = archive//*'
  let doneRows = outline.query(donePath).value as Row[]
  let archiveRow = (outline.query('//@id = archive').value as Row[])[0]

  // Insert an Archive row if needed and move done rows
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

  return true
}
```

Create some task rows with checkboxes. Check some of them off. And then run the
"Tutorial: Archive Done" command to see the done items move to the Archive
section.

## Next Steps

Follow the [DOM Context Tutorial](dom-context-tutorial.md) to display custom UI when archiving rows.
