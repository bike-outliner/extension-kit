# Style Context Tutorial

Use the style context to create custom stylesheets for Bike's outline editor. Styles are powerful, but also quite complex.

- [Style Context API](../api/style/)
- Entry point: `style/main.ts`
- Use outline paths to match outline elements and apply styles.
- Import the API using `import { SYMBOL } from 'bike/style'`.

## Setup

This tutorial assumes you are running `npx bike-ext watch --install` for automatic building. Start by creating an empty editor style in `style/main.ts`:

```typescript
import { defineEditorStyle, Insets, Color } from 'bike/style'

let style = defineEditorStyle('tutorial', 'Tutorial')
```

## Defining Outline Structure

Display outline structure with padding and border decorations:

```typescript
import { defineEditorStyle, Insets, Color } from 'bike/style'

let style = defineEditorStyle('tutorial', 'Tutorial')

style.layer('base', (row, run, caret, viewport, include) => {
  row(`.*`, (context, row) => {
    row.padding = new Insets(10, 10, 10, 28)

    row.decoration('background', (background, layout) => {
      background.border.width = 1
      background.border.color = Color.systemBlue()
      background.zPosition = -1
    })

    row.text.padding = new Insets(5, 5, 5, 5)
    row.text.decoration('background', (background, layout) => {
      background.border.width = 1
      background.border.color = Color.systemGreen()
      background.zPosition = -2
    })
  })
})
```

### Layers

Styles consist of ordered rules organized into layer groups. Rules match outline paths and receive callbacks to modify style objects. The order that you define your rules is important, because each rule can read the current state of the style object.

Layer groups organize rules and allow insertion into existing editor styles. Examples include `base`, `selection`, `run-formatting`, and `row-formatting`.

### Decorations

Decorations attach visual elements without affecting layout. They are attached to the underlying text layout, but they don't affect that layout.

## Selection

### Basic Text Selection

Add selection styling:

```typescript
style.layer('selection', (row, run, caret, viewport, include) => {
  run(`.@view-selected-range`, (context, run) => {
    run.decoration('selection', (selection, layout) => {
      selection.zPosition = -1
      selection.color = Color.textBackgroundSelected().withAlpha(0.5)
    })
  })
})
```

### Block Selection

Extend to handle block selections:

```typescript
style.layer('selection', (row, run, caret, viewport, include) => {
  run(`.@view-selected-range`, (context, run) => {
    run.decoration('selection', (selection, layout) => {
      selection.zPosition = -1
      selection.color = Color.textBackgroundSelected().withAlpha(0.5)
    })
  })

  row(`.selection() = block`, (context, row) => {
    row.text.color = Color.white()
    row.text.decoration('background', (background, layout) => {
      background.color = Color.contentBackgroundSelected()
      background.border.color = Color.systemRed()
    })
  })
})
```

Use the Outline Path Explorer (Window > Outline Path Explorer) to discover available attributes for styling.

## Inline Formatting

Support bold and italic text:

```typescript
style.layer('run-formatting', (row, run, caret, viewport, include) => {
  run('.@emphasized', (context, text) => {
    text.font = text.font.withItalics()
  })

  run('.@strong', (context, text) => {
    text.font = text.font.withBold()
  })
})
```

## Row Formatting with Decorations

### Task Checkbox

Create a clickable task checkbox using a positioned decoration with an SF Symbol:

```typescript
import { defineEditorStyle, Insets, Color, Image, SymbolConfiguration, Font } from 'bike/style'

style.layer('row-formatting', (row, run, caret, viewport, include) => {
  row(`.@type = task`, (context, row) => {
    row.text.decoration('mark', (mark, layout) => {
      let lineHeight = layout.firstLine.height
      mark.commandName = 'row:toggle-done'
      mark.x = layout.leading.offset(-28 / 2)
      mark.y = layout.firstLine.centerY
      mark.width = lineHeight
      mark.height = lineHeight
      mark.contents.gravity = 'center'
      mark.contents.image = Image.fromSymbol(
        new SymbolConfiguration('square')
          .withHierarchicalColor(Color.text())
          .withFont(Font.systemBody())
      )
    })
  })

  row(`.@type = task and @done`, (context, row) => {
    row.text.strikethrough.thick = true
    row.text.decoration('mark', (mark, layout) => {
      mark.contents.image = Image.fromSymbol(
        new SymbolConfiguration('checkmark.square')
          .withHierarchicalColor(Color.text())
          .withFont(Font.systemBody())
      )
    })
  })
})
```

The `commandName` property makes the decoration clickable -- clicking it triggers the named command.

## Context and Theme

Access user preferences through the context parameter:

```typescript
row.text.font = context.theme.font
row.text.lineHeightMultiple = context.theme.lineHeightMultiple
```

The context's theme contains user preferred values.

## Building Complex Styles

### Style Modifiers

Use `defineEditorStyleModifier` to insert rules into specific layers of existing styles without recreating them entirely.

### Including Rules from Existing Styles

You can include rules from another style's layer into your own:

```typescript
let style = defineEditorStyle('tutorial', 'Tutorial')
style.layer('row-formatting', (row, run, caret, viewport, include) => {
  include('bike', 'run-formatting')
})
```

### Copy and Modify

Another approach is to start with an existing style, rename it, and make targeted modifications.

## Resources

- [Style Context API](../api/style/) -- full type definitions
- The default editor style in core-extensions serves as a comprehensive reference
