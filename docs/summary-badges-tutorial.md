# Summary & Badges Tutorial

Use badges to render value-aware glyphs trailing a row's text. Use summaries to efficiently aggregate values up from a row's subtree to be displayed in badge (or used in any outline path).

- [App Context API](../api/app/)
- Entry point: `app/main.ts`
- Code runs in Bike's native app environment.
- The clicked row is the target of any action.
- Summaries are maintained by Bike and read back with the `summary("name")` outline-path function.
- Import the API using `import { SYMBOL } from 'bike/app'`.

## Setup

This tutorial assumes that you have [created an extension](creating-extensions.md) and are running `npx bike-ext watch --install`. Your extension should automatically build and install when you save changes.

## Registering a Badge

We'll build an `estimate` badge: a small time chip that appears on any row carrying an `@estimate` attribute (a number of minutes).

### A Value-Aware Glyph

Open `app/main.ts` and add a function that registers the badge:

```typescript
import { Image, Text } from 'bike/app'

export function registerEstimate() {
  bike.badge('estimate', {
    where: '.@estimate',
    render: (values, env) => {
      const value = values['estimate'] ?? ''
      return Image.fromText(new Text(formatEstimate(value), env.font, env.color.alphaSet(0.6)))
    },
  })
}
```

`where: '.@estimate'` selects the rows that get a badge, those with an `estimate` attribute. `render` runs per selected row and returns the glyph (or `null` for no badge). It receives `values` (the row's attribute values — `values.estimate` here, since a badge reads its own attribute by default) and `env`, the row's inherited text presentation. Building the text from `env.font` and `env.color.alphaSet(0.6)` makes the badge match the surrounding text at 60% opacity.

Call `registerEstimate()` from your `activate` function, as with any other registration:

```typescript
export async function activate(context: AppExtensionContext) {
  registerEstimate()
}
```

Save your changes. Now in Bike, give a row an `estimate` attribute set to `90` (<kbd>Command-Shift-A</kbd>) and you should see a `1h 30m` badge appear after its text.

### Making the Badge Clickable

A badge is decoration only — to make it interactive, give it an `onClick`
handler and present a menu from it with `editor.showMenu`. The menu is built
imperatively from the row at click time, so you read the row directly and
your handlers live only for that presentation.

Here is the complete `estimate` badge: the glyph, an `onClick` that shows a
menu of preset times, and a small helper that formats minutes into a
readable label:

```typescript
import { Image, MenuItem, OutlineEditor, Row, Text } from 'bike/app'

export function registerEstimate() {
  bike.badge('estimate', {
    where: '.@estimate',
    render: (values, env) => {
      const value = values['estimate'] ?? ''
      return Image.fromText(new Text(formatEstimate(value), env.font, env.color.alphaSet(0.6)))
    },
    onClick: ({ editor, row }) => showEstimateMenu(editor, row),
  })
}

function showEstimateMenu(editor: OutlineEditor, row: Row) {
  const value = row.getAttribute('estimate') ?? ''
  const items: MenuItem[] = [
    ...['15', '30', '60', '120'].map((preset): MenuItem => ({
      type: 'button',
      id: preset,
      title: formatEstimate(preset),
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

function formatEstimate(value: string): string {
  const minutes = parseInt(value, 10)
  if (!Number.isFinite(minutes)) return '0m'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours && mins) return `${hours}h ${mins}m`
  if (hours) return `${hours}h`
  return `${mins}m`
}
```

Each preset is a `button` item; the one matching the row's current estimate
gets a checkmark (`state: 'on'`). Choosing a button routes its `id` to the
presentation's `onAction`, which writes or removes the attribute. Because
`showEstimateMenu` takes any `(editor, row)`, the same function could also
back a command that offers the menu on rows with no estimate yet.

Save, and click an estimate chip. The menu should open with the preset
times and a **Remove Estimate** option, and choosing one should update the
row.

## Subtree Summaries

Next we'll aggregate estimates up the outline, so a parent row shows the total time for everything beneath it. To do that without walking each row's subtree on every render, we first register a summary.

### Registering a Summary

A summary is a named aggregate that Bike maintains for every row's branch. Add this to `registerEstimate`:

```typescript
bike.summary('totalEstimate', { where: '.@estimate', value: '@estimate', reduce: 'sum' })
```

The summary's `where` is a self-only test naming which rows contribute — here, any row with an estimate. `value: '@estimate'` is each row's numeric contribution, and `reduce: 'sum'` adds those contributions up every branch, so at any row `summary("totalEstimate")` is the total of all estimates at or below it. A row with no estimate, or a non-numeric one, contributes nothing.

### A Badge That Reads a Summary

Now modify the `estimate` badge to also show that branch total. Widen `where` so ancestor rows without their own estimate still get a badge, read the summary through `inputs`, and show `own / total` whenever the branch adds up to more than the row itself:

```typescript
import { Image, Text } from 'bike/app'

export function registerEstimate() {
  bike.summary('totalEstimate', { where: '.@estimate', value: '@estimate', reduce: 'sum' })

  bike.badge('estimate', {
    where: '.summary("totalEstimate") > 0',
    inputs: { own: '@estimate', total: 'summary("totalEstimate")' },
    render: (values, env) => {
      const own = values['own'] ?? ''
      const total = values['total'] ?? '0'
      const label =
        own !== '' && parseInt(own, 10) < parseInt(total, 10)
          ? `${formatEstimate(own)} / ${formatEstimate(total)}`
          : formatEstimate(total)
      return Image.fromText(new Text(label, env.font, env.color.alphaSet(0.6)))
    },
    onClick: ({ editor, row }) => showEstimateMenu(editor, row),
  })
}
```

The `where` now uses `summary("totalEstimate")` to select any row with an estimate somewhere in its branch. Selecting on a summary keeps this cheap. `inputs` maps names to outline-path expressions, so `render` gets `values.own` (this row's estimate) and `values.total` (the branch total), and shows both only when they differ.

Save, then in Bike create a parent row with a few estimated rows under it. The parent should show the summed total, and a row that has both its own estimate and estimated children should show `own / total`.

## Badges and Decorations

Badges overlap with the [decorations](style-context-tutorial.md#row-formatting-with-decorations) you can attach in the style context. Both add visual elements to a row and both can respond to clicks. They solve different problems, though.

A decoration lives in `style/main.ts`, attaches to the underlying text layout, and is positioned by you. It doesn't affect layout, so it's the right tool for drawing on top of existing content — a background, a mark, a checkbox pinned to the row. A badge lives in `app/main.ts`, and lays out its own glyph trailing the row's text; Bike reserves the space for it. Badges are also value-aware in a way decorations aren't: they read attributes and summaries as `inputs`, and their `onClick` can present the menu you saw above.

As a rule of thumb, reach for a badge to view and interact with branch values, and a decoration to change how the row's existing content is drawn.

## Next Steps

Follow the [Style Context Tutorial](style-context-tutorial.md) to create your own editor styles.
