# Summary & Badges Tutorial

Use badges to render value-aware glyphs trailing a row's text. Use summaries to efficiently aggregate values up from a row's subtree to be displayed in a badge (or used in any outline path).

- [App Context API](../api/app/)
- Entry point: `app/main.ts`
- Code runs in Bike's native app environment.
- Summaries are maintained by Bike and read back with the `summary("name")` outline-path function.
- Import the API using `import { SYMBOL } from 'bike/app'`.

## Setup

This tutorial assumes that you have [created an extension](creating-extensions.md) and are running `npx bike-ext watch --install`. Your extension should automatically build and install when you save changes.

## Declaring the Attribute

We'll build an `estimate` badge showing how long a row is expected to take. Before rendering anything, declare what the attribute *is*:

```typescript
export function registerEstimate() {
  bike.attribute('estimate', {
    type: 'duration',
    title: 'Estimate',
  })
}
```

That one line buys the whole value layer. Bike now knows `estimate` holds an [ISO-8601 duration](../api/app/attribute.d.ts) (`PT30M`, `P1DT2H`), so it parses free text natively — typing `90m` or `1.5h` in the Attributes Editor stores `PT1H30M` — offers standard duration suggestions, and formats values for display as `1h 30m` in the viewer's locale. You never write a parser or a formatter.

Registration is **configuration, not behavior**: declaring the attribute doesn't change how rows render. That's the badge's job.

## Registering a Badge

### A Value-Aware Glyph

Add the badge next to the declaration:

```typescript
import { Image, Text } from 'bike/app'

export function registerEstimate() {
  bike.attribute('estimate', { type: 'duration', title: 'Estimate' })

  bike.badge('estimate', {
    where: '.@estimate',
    render: (values, env) => {
      const value = values['estimate'] ?? ''
      const label = env.formatAttribute('estimate', value)
      return Image.fromText(new Text(label, env.font, env.color.alphaSet(0.6)))
    },
  })
}
```

`where: '.@estimate'` selects the rows that get a badge, those with an `estimate` attribute. `render` runs per selected row and returns the glyph (or `null` for no badge). It receives `values` (the row's attribute values — `values.estimate` here, since a badge reads its own attribute by default) and `env`, the row's inherited text presentation.

`values` are always raw **wire** strings (`"PT1H30M"`). Format them with `env.formatAttribute(name, wire)`, which runs the same native, locale-aware display layer the Attributes Editor and pickers use — never by hand. For a value that isn't a registered attribute's (a computed input, a summary result), use `env.formatValue(type, wire)` instead.

Building the text from `env.font` and `env.color.alphaSet(0.6)` makes the badge match the surrounding text at 60% opacity.

Call `registerEstimate()` from your `activate` function, as with any other registration:

```typescript
export async function activate(context: AppExtensionContext) {
  registerEstimate()
}
```

Save your changes. Now in Bike, give a row an `estimate` of `90m` (<kbd>Command-Shift-A</kbd>) and you should see a `1h 30m` badge appear after its text.

> **Note:** because `estimate` is a declared attribute, Bike would have rendered a `estimate: 1h 30m` catch-all badge for it even without the badge above. Set `defaultBadge: false` on the definition when your extension presents the attribute itself.

### Making the Badge Clickable

A badge is decoration only. The quickest way to make it interactive is `menu: 'default'`:

```typescript
bike.badge('estimate', {
  where: '.@estimate',
  menu: 'default',
  render: /* … */,
})
```

Clicking the glyph now opens the built-in type-aware attribute menu: **Filter**, **Value…** (which opens a duration picker bound to the definition), and **Remove**. For a `choice` attribute the same menu offers the choices as radios; for a `flag`, On/Off.

When you want something else, give the badge an `onClick` handler and present your own menu with `editor.showMenu`. The menu is built imperatively from the row at click time, so you read the row directly and your handlers live only for that presentation:

```typescript
import { Image, MenuItem, OutlineEditor, Row, Text } from 'bike/app'

export function registerEstimate() {
  bike.attribute('estimate', { type: 'duration', title: 'Estimate' })

  bike.badge('estimate', {
    where: '.@estimate',
    render: (values, env) => {
      const label = env.formatAttribute('estimate', values['estimate'] ?? '')
      return Image.fromText(new Text(label, env.font, env.color.alphaSet(0.6)))
    },
    onClick: ({ editor, row }) => showEstimateMenu(editor, row),
  })
}

const PRESETS = ['PT15M', 'PT30M', 'PT1H', 'PT2H']

function showEstimateMenu(editor: OutlineEditor, row: Row) {
  const value = row.getAttribute('estimate') ?? ''
  const items: MenuItem[] = [
    ...PRESETS.map((preset): MenuItem => ({
      type: 'button',
      id: preset,
      title: bike.displayAttribute('estimate', preset),
      state: value === preset ? 'on' : 'off',
    })),
    { type: 'separator' },
    { type: 'button', id: 'remove', title: 'Remove Estimate' },
  ]
  editor.showMenu(row, {
    items,
    // Anchor the menu at this badge's glyph (falls back to the row's text
    // line on rows the badge doesn't decorate).
    anchor: 'estimate',
    onAction: (id, { row }) => {
      if (id === 'remove') {
        row.removeAttribute('estimate')
      } else {
        row.setAttribute('estimate', id)
      }
    },
  })
}
```

Each preset is a `button` item titled through `bike.displayAttribute` — the app-context sibling of `env.formatAttribute`, so menu titles and badge labels can't drift apart. The one matching the row's current estimate gets a checkmark (`state: 'on'`). Choosing a button routes its `id` to the presentation's `onAction`, which writes or removes the attribute.

To offer the full editor rather than presets, present the attribute-bound picker instead — one call, no options needed, because the definition supplies the kind, the suggestions, and the current value:

```typescript
editor.showPicker(row, {
  attribute: 'estimate',
  anchor: 'estimate',
  onAccept: (value, { row }) => row.setAttribute('estimate', value),
  onRemove: ({ row }) => row.removeAttribute('estimate'),
})
```

Save, and click an estimate badge. The menu should open with the preset times and a **Remove Estimate** option, and choosing one should update the row.

## Subtree Summaries

Next we'll aggregate estimates up the outline, so a parent row shows the total time for everything beneath it. To do that without walking each row's subtree on every render, we first register a summary.

### Registering a Summary

A summary is a named aggregate that Bike maintains for every row's branch. Add this to `registerEstimate`:

```typescript
bike.summary('totalEstimate', {
  where: '.@estimate',
  value: '@estimate',
  reduce: 'sum',
  type: 'duration',
})
```

The summary's `where` is a self-only test naming which rows contribute — here, any row with an estimate. `value: '@estimate'` is each row's contribution, and `reduce: 'sum'` adds those contributions up every branch, so at any row `summary("totalEstimate")` is the total of all estimates at or below it.

`type: 'duration'` is what makes the sum meaningful: each contribution is parsed as a duration and the **result is emitted in the same canonical wire encoding**, so `summary("totalEstimate")` reads back as `PT4H30M` — a value queries can compare and a badge can format. Rows whose value doesn't parse contribute nothing; they don't poison the reduction. Leave `type` off and values reduce as plain numbers.

### A Badge That Reads a Summary

Now modify the `estimate` badge to also show that branch total. Widen `where` so ancestor rows without their own estimate still get a badge, read the summary through `inputs`, and show `own / total` whenever the branch adds up to more than the row itself:

```typescript
import { Image, Text } from 'bike/app'

export function registerEstimate() {
  bike.attribute('estimate', { type: 'duration', title: 'Estimate' })

  bike.summary('totalEstimate', {
    where: '.@estimate',
    value: '@estimate',
    reduce: 'sum',
    type: 'duration',
  })

  bike.badge('estimate', {
    where: 'duration(summary("totalEstimate")) > 0',
    inputs: { own: '@estimate', total: 'summary("totalEstimate")' },
    render: (values, env) => {
      const own = values['own'] ?? ''
      const total = values['total'] ?? ''
      const label =
        own !== '' && own !== total
          ? `${env.formatAttribute('estimate', own)} / ${env.formatValue('duration', total)}`
          : env.formatValue('duration', total)
      return Image.fromText(new Text(label, env.font, env.color.alphaSet(0.6)))
    },
    menu: 'default',
  })
}
```

The `where` now uses `summary("totalEstimate")` to select any row with an estimate somewhere in its branch, wrapping it in the query engine's `duration()` so the ISO string compares as a length. Selecting on a summary keeps this cheap. `inputs` maps names to outline-path expressions, so `render` gets `values.own` (this row's estimate) and `values.total` (the branch total).

Note the two formatters: `own` is the `estimate` attribute's value, so it formats through `formatAttribute`; `total` is a summary result rather than a stored attribute, so it formats through `formatValue('duration', …)`. Both go through the same native display layer.

Save, then in Bike create a parent row with a few estimated rows under it. The parent should show the summed total, and a row that has both its own estimate and estimated children should show `own / total`.

## Badges and Decorations

Badges overlap with the [decorations](style-context-tutorial.md#row-formatting-with-decorations) you can attach in the style context. Both add visual elements to a row and both can respond to clicks. They solve different problems, though.

A decoration lives in `style/main.ts`, attaches to the underlying text layout, and is positioned by you. It doesn't affect layout, so it's the right tool for drawing on top of existing content — a background, a mark, a checkbox pinned to the row. A badge lives in `app/main.ts`, and lays out its own glyph trailing the row's text; Bike reserves the space for it. Badges are also value-aware in a way decorations aren't: they read attributes and summaries as `inputs`, and their `onClick` can present the menu you saw above.

As a rule of thumb, reach for a badge to view and interact with branch values, and a decoration to change how the row's existing content is drawn.

## Next Steps

Follow the [Style Context Tutorial](style-context-tutorial.md) to create your own editor styles.
