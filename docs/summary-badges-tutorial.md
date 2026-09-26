# Summary & Badges Tutorial

Badges draw value-aware glyphs after a row's text. Summaries aggregate values up
each branch; read them with the `summary("name")` outline path function, in a
badge or any query.

- [App Context API](../api/app/): `attribute.d.ts`, `badge.d.ts`, `summary.d.ts`
- Entry point: `app/main.ts`

## Declaring the Attribute

```typescript
export function registerEstimate() {
  bike.attribute('estimate', {
    type: 'duration',
    title: 'Estimate',
  })
}
```

`estimate` now holds an [ISO 8601 duration](../api/app/attribute.d.ts). Bike parses
free text (`90m` or `1.5h` is stored as `PT1H30M`), suggests values, and formats
them for display (`1h 30m`, localized). The declaration doesn't change
rendering. On its own, Bike shows a catch-all `estimate: 1h 30m` badge; set
`defaultBadge: false` when your extension draws its own.

Call `registerEstimate()` from `activate`.

## Registering a Badge

```typescript
import { Image, Text } from 'bike/app'

bike.badge('estimate', {
  where: '.@estimate',
  render: (values, env) => {
    const label = env.formatAttribute('estimate', values['estimate'] ?? '')
    return Image.fromText(new Text(label, env.font, env.color.alphaSet(0.6)))
  },
})
```

- `where` selects the rows that get the badge.
- `render` runs per row and returns an image, or `null` for no badge.
- `values` holds raw wire strings (`"PT1H30M"`). By default a badge reads its own
  attribute.
- `env` is the row's text presentation (`font`, `color`).
- Format values with `env.formatAttribute(name, wire)` for attributes, or
  `env.formatValue(type, wire)` for other values, such as summary results.

Give a row an `estimate` of `90m` (<kbd>Command-Shift-A</kbd>). It shows `1h 30m`.

### Making the Badge Clickable

`menu: 'default'` opens the built-in attribute menu on click: **Filter**,
**Value…** (a picker for the attribute's type) and **Remove**.

For a custom menu, add `onClick: ({ editor, row }) => showEstimateMenu(editor, row)`
to the badge and call `editor.showMenu`:

```typescript
import { MenuItem, OutlineEditor, Row } from 'bike/app'

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
    anchor: 'estimate', // this badge's glyph
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

`bike.displayAttribute` is the app context equivalent of `env.formatAttribute`.

To show the full value editor instead, use the attribute-bound picker. The
definition supplies its type, suggestions and current value:

```typescript
editor.showPicker(row, {
  attribute: 'estimate',
  anchor: 'estimate',
  onAccept: (value, { row }) => row.setAttribute('estimate', value),
  onRemove: ({ row }) => row.removeAttribute('estimate'),
})
```

## Subtree Summaries

### Registering a Summary

```typescript
bike.summary('totalEstimate', {
  where: '.@estimate',
  value: '@estimate',
  reduce: 'sum',
  type: 'duration',
})
```

- `where` is a self-only test that picks the rows that contribute.
- `value` is each row's contribution.
- `reduce` combines the contributions over each branch. `summary("totalEstimate")`
  is the total at or below the row.
- `type: 'duration'` parses contributions as durations and emits canonical wire
  values (`PT4H30M`). Unparseable values are skipped. Without `type`, values
  reduce as numbers.

### A Badge That Reads a Summary

Change the badge to show `own / total`:

```typescript
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
```

- `where` now matches any row with an estimate in its branch. `duration()`
  compares the ISO string as a length.
- `inputs` maps names to outline path expressions, and those names become the
  keys of `values`.
- `total` is a summary result, not an attribute, so it formats with
  `formatValue`.

## Badges vs. Decorations

- [Decorations](style-context-tutorial.md#row-formatting-with-decorations) are
  set in the style context and positioned by you. They draw over existing
  layout.
- Badges are set in the app context. Bike reserves space for them after the
  text, and they read attributes and summaries through `inputs`.

Use a badge to show and edit values. Use a decoration to change how existing
content is drawn.

## Next Steps

[Style Context Tutorial](style-context-tutorial.md)
