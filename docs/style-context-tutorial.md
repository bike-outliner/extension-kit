# Style Context Tutorial

Use the style context to create custom stylesheets for Bike's outline editor.
Styles are powerful, but also quite complex. Themes are a simpler way to
customize the look of your editor, see Bike's user guide for more on themes.

- [Style Context API](../api/style/)
- Entry point: `style/main.ts`
- Use outline paths to match outline elements and apply styles.
- Import the API using `import { SYMBOL } from 'bike/style'`.

## Setup

This tutorial assumes you are running `npx bike-ext watch --install` for automatic building. Start by creating an empty editor style in `style/main.ts`:

```typescript
import { defineEditorStyle } from 'bike/style'

let style = defineEditorStyle('tutorial', 'Tutorial')
```

Save and then select your style: 

- Bike > Settings > Appearance > Editor Style > Tutorial.

Notice that your outline editor now shows no indentation or formatting. It also doesn't show selection, etc. Editor styles are responsible for defining the visual state of the outline editor, and this style has no rules.

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

Save, and you should see your outline structure again. Note that when adding rules we always add them to a layer. This helps to organize them, and makes it possible to modify and include existing styles. Layers are ordered by when they are first used, so the `base` layer will always be processed first.

### Visualizing Structure

Replace `style/main.ts` to see the structure more clearly using border decorations:

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

The visual structure of your outline is now apparent. Rows (blue border) contain text (green border) and potentially other child rows. The blue and green rectangles are created by attaching decorations to the row and to the row's text.

### Layers

Styles consist of ordered rules organized into layer groups. Rules match outline paths and receive callbacks to modify style objects. The order that you define your rules is important, because each rule can read the current state of the style object. Generally, you want generic style rules listed first and refinements listed later.

The rule callbacks must be pure functions. Given the same editor state and style state, they must always generate the same end style state.

Styles are not inherited from parents as they are in CSS. Instead, create a generic rule that matches all elements and set defaults there.

Layer groups organize rules and allow insertion into existing editor styles. Examples include `base`, `selection`, `run-formatting`, and `row-formatting`.

### Decorations

Decorations attach visual elements without affecting layout. They are attached to the underlying text layout, but they don't affect that layout. Decorations can also be attached to runs of the row's text. If you need to make space for a decoration, add padding to the element you are decorating.

## Selection

Notice that when you select text in the outline editor, you can't see any selection marks. Let's fix that.

### Basic Text Selection

The simplest approach is to set the run's background color:

```typescript
style.layer('selection', (row, run, caret, viewport, include) => {
  run(`.@view-selected-range`, (context, run) => {
    run.backgroundColor = Color.textBackgroundSelected()
  })
})
```

Save, and now you should see selection marks when you select within a single paragraph.

How would you even know about that `@view-selected-range` attribute? This is where the Outline Path Explorer is useful. Select Bike > Outline Path Explorer. Make sure that "Show View Attributes" is selected. Then make some selections — you should see `@view-selected-range` appear. You can also type `.@view-selected-range` into the explorer's search field to highlight matching elements.

### Improving Selection with Decorations

Setting `backgroundColor` works, but decorations are more flexible. Replace the selection layer:

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

In Bike, there are two selection modes — text selection mode and block selection mode. So far, we are only styling text selections. When you extend the selection beyond a single paragraph, Bike starts using block selection mode.

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

The matching outline path calls the `selection()` function — this and other [outline path functions](https://bikeguide.hogbaysoftware.com/using-bike/using-outline-paths) are useful when styling.

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

You can also add decorations to text runs, just like you can add them to rows and row text. Try creating a rule to show text with the `@highlight` attribute — you can add/remove that attribute using Format > Highlight.

## Row Formatting with Decorations

Decorations can do more than simple backgrounds. They can be placed and sized, contain images, symbols, and text, and activate commands when clicked. Let's use decorations to show a checkbox.

### Start with a Simple Decoration

First, add a basic colored decoration for task rows:

```typescript
style.layer('row-formatting', (row, run, caret, viewport, include) => {
  row(`.@type = task`, (context, row) => {
    row.text.decoration('mark', (mark, layout) => {
      mark.color = Color.systemRed()
    })
  })
})
```

When you create a task in your outline, it will have a red background.

### Add an Image

Replace the color with an SF Symbol image:

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

You should see an empty checkbox centered over all task rows.

### Position and Make Clickable

Position the checkbox properly and make it trigger a command when clicked:

```typescript
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
})
```

Decorations have `x`, `y`, `width`, and `height` properties of type `LayoutValue`. You get layout values from the passed-in `layout` parameter. These are logical values that are resolved later in the layout process to position the decoration.

The `commandName` property makes the decoration clickable — clicking it triggers
the named command. But currently when you click the checkbox, nothing happens.
Lets fix that.

### Style Done Tasks

Add a new rule (in `row-formatting` layer) for completed tasks:

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

Note that we don't need to redo the positioning work — we are reusing the same
`'mark'` decoration layer, which is already positioned correctly. We only change
the image content.

## Context Settings and Theme

Outline styles have final say on outline editor styles, but they can read from settings and themes when deciding on styles. This allows your styles to respond to user settings and selected themes.

For example in our editor style add these lines in the first rule:

```typescript
row.text.font = context.settings.font
row.text.lineHeightMultiple = context.settings.lineHeightMultiple
```

Now when you View > Zoom In, the text in your editor changes size. In addition
to settings, the context also includes the current theme and editor state such
as `isKey` or `isTyping`.

## Building Complex Styles

It's a big job to build a complete editor style from scratch. Often a better
approach is to start with an existing style and make modifications.

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

## Resources

- [Style Context API](../api/style/) — full type definitions
- The default editor style in [core-extensions](https://github.com/bike-outliner/core-extensions/tree/main/src/bike.bkext/style) serves as a comprehensive reference
- [Outline paths](https://bikeguide.hogbaysoftware.com/using-bike/using-outline-paths) — path syntax and functions used in style rules
- [Support Forums](https://support.hogbaysoftware.com/c/bike/22) — ask questions about extension development
