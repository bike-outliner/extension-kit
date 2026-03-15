# App Context Tutorial

Use the app context to add commands, keybindings, and work with system resources like the clipboard.

- [App Context API](../api/app/)
- Entry point: `app/main.ts`
- Code runs in Bike's native app environment.
- Interact with outlines, clipboard, networking, etc.
- Some APIs require appropriate `manifest.json` permissions.
- Import the API using `import { SYMBOL } from 'bike/app'`.

## Setup

This tutorial assumes that you have [created an extension](creating-extensions.md#create-your-first-extension) and are running `npx bike-ext watch --install`. Your extension should automatically build and install when you save changes.

## Creating Commands

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

Access commands via Command Palette using `Command-Shift-P`.

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

Keybindings function only when the outline editor has focus, not other UI elements.

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

Mark rows complete using the Command Palette and selecting "Bike: Toggle Done". Execute the archive command to move completed items.

## Next Steps

Follow the [DOM Context Tutorial](dom-context-tutorial.md) to display custom UI when archiving rows.
