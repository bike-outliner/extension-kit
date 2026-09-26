# Style Context Tutorial

Editor styles define how Bike's outline editor draws everything.

- Try [themes](creating-themes.md) first; they are simpler.
- To add rules to Bike's default style instead of writing a whole style, use
  `defineEditorStyleModifier` (see the [heading levels
  example](https://github.com/bike-outliner/example-extensions/tree/main/src/heading-levels.bkext)).
  Everything below applies to modifiers too.
- The default style's
  [source](https://github.com/bike-outliner/core-extensions/tree/main/src/bike.bkext/style)
  is the most complete reference.
- [Style Context API](../api/style/)
- Entry point: `style/main.ts`

## Empty Style

In `style/main.ts`:

```typescript
import { defineEditorStyle } from 'bike/style'

let style = defineEditorStyle('tutorial', 'Tutorial')
```

Select it in Bike > Settings > Appearance > Editor Style. With no rules, the
editor shows no indentation, formatting or selection.

## Defining Outline Structure

In `style/main.ts`, add a base layer with padding:

```typescript
import { defineEditorStyle, Insets } from 'bike/style'

let style = defineEditorStyle('tutorial', 'Tutorial')

style.layer('base', (row, run, caret, viewport, include) => {
  row(`.*`, (context, row) => {
    row.padding = new Insets(10, 10, 10, 28)
  })
})
```

Indentation returns. Rules always belong to a layer. Layers run in the order
they are first used.

### Visualizing Structure

Add border decorations to see the structure:

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

Rows (blue) contain their text (green) and child rows.

### Rules

- Rules run in definition order, and each rule sees the style that earlier rules
  produced. Put generic rules first and refinements after them.
- Rules must be pure: the same editor and style state must produce the same
  result.
- Nothing is inherited from parents as in CSS. Set defaults in a rule that
  matches everything.
- Layers (`base`, `selection`, `run-formatting`, `row-formatting`, …) group
  rules. Modifiers and `include` target them by name.

### Decorations

Decorations draw on rows, row text or text runs without changing layout. Add
padding to the decorated element to make room for one.

## Selection

### Text Selection

Set the run's background color:

```typescript
style.layer('selection', (row, run, caret, viewport, include) => {
  run(`.@view-selected-range`, (context, run) => {
    run.backgroundColor = Color.textBackgroundSelected()
  })
})
```

To find view attributes like `@view-selected-range`, open Bike > Outline Path
Explorer and turn on "Show View Attributes".

A decoration is more flexible than `backgroundColor`:

```typescript
style.layer('selection', (row, run, caret, viewport, include) => {
  run(`.@view-selected-range`, (context, run) => {
    run.decoration('selection', (selection, layout) => {
      selection.zPosition = -1
      selection.color = Color.textBackgroundSelected().alphaSet(0.5)
    })
  })
})
```

### Block Selection

A selection that extends past one row is a block selection. Add to the
`selection` layer:

```typescript
row(`.selection() = block`, (context, row) => {
  row.text.color = Color.white()
  row.text.decoration('background', (background, layout) => {
    background.color = Color.contentBackgroundSelected()
    background.border.color = Color.systemRed()
  })
})
```

`selection()` is one of the [outline path
functions](https://bikeguide.hogbaysoftware.com/using-bike/using-outline-paths).

## Inline Formatting

```typescript
style.layer('run-formatting', (row, run, caret, viewport, include) => {
  run('.@em', (context, text) => {
    text.font = text.font.withItalics()
  })

  run('.@strong', (context, text) => {
    text.font = text.font.withBold()
  })
})
```

Format > Highlight sets `@mark`; try styling it with a run decoration.

## Row Formatting with Decorations

Decorations can be positioned and sized, show images, symbols and text, and
perform commands when clicked. This builds a task checkbox.

### Colored Mark

```typescript
style.layer('row-formatting', (row, run, caret, viewport, include) => {
  row(`.@type = task`, (context, row) => {
    row.text.decoration('mark', (mark, layout) => {
      mark.color = Color.systemRed()
    })
  })
})
```

Task rows get a red background.

### Image

Replace the color with an SF Symbol:

```typescript
import { defineEditorStyle, Insets, Color, Image, SymbolConfiguration, Font } from 'bike/style'

style.layer('row-formatting', (row, run, caret, viewport, include) => {
  row(`.@type = task`, (context, row) => {
    row.text.decoration('mark', (mark, layout) => {
      mark.contents.gravity = 'center'
      mark.contents.image = Image.fromSymbol(
        new SymbolConfiguration('square')
          .withHierarchicalColor(Color.text())
          .withFont(Font.systemBody())
      )
    })
  })
})
```

An empty checkbox is centered over each task row.

### Position and Command

Add to the top of the `mark` decoration callback:

```typescript
let lineHeight = layout.firstLine.height
mark.commandName = 'row:toggle-done'
mark.x = layout.leading.offset(-28 / 2)
mark.y = layout.firstLine.centerY
mark.width = lineHeight
mark.height = lineHeight
```

`x`, `y`, `width` and `height` are `LayoutValue`s taken from `layout`; they
resolve during layout. `commandName` performs that command on click.

### Done Tasks

Add to the `row-formatting` layer:

```typescript
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
```

Reusing the `'mark'` decoration keeps its position; only the image changes.

## Context Settings and Theme

Rules can read user settings and the current theme from `context`. In the
first rule:

```typescript
row.text.font = context.settings.font
row.text.lineHeightMultiple = context.settings.lineHeightMultiple
```

View > Zoom In now resizes text. `context` also has the theme and editor state
such as `isKey` and `isTyping`.

## Including Rules

Copy another style's layer rules into yours:

```typescript
let style = defineEditorStyle('tutorial', 'Tutorial')
style.layer('row-formatting', (row, run, caret, viewport, include) => {
  include('bike', 'run-formatting')
})
```

## Resources

- [Outline paths](https://bikeguide.hogbaysoftware.com/using-bike/using-outline-paths) — path syntax and functions used in style rules
- [Support Forums](https://support.hogbaysoftware.com/c/bike/22) — ask questions about extension development
