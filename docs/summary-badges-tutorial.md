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
      return {
        image: Image.fromText(new Text(formatEstimate(value), env.font, env.color.alphaSet(0.6))),
      }
    },
  })
}
```

`where: '.@estimate'` selects the rows that get a badge, those with an `estimate` attribute. `render` runs per selected row and returns the glyph. It receives `values` (the row's attribute values — `values.estimate` here, since a badge reads its own attribute by default) and `env`, the row's inherited text presentation. Building the text from `env.font` and `env.color.alphaSet(0.6)` makes the badge match the surrounding text at 60% opacity.

Call `registerEstimate()` from your `activate` function, as with any other registration:

```typescript
export async function activate(context: AppExtensionContext) {
  registerEstimate()
}
```

Save your changes. Now in Bike, give a row an `estimate` attribute set to `90` (<kbd>Command-Shift-A</kbd>) and you should see a `1h 30m` badge appear after its text.

### Adding Click Actions

A badge can be interactive. Return an `actions` array and Bike shows those choices in a card when the badge is clicked:

```typescript
return {
  image: Image.fromText(/* ... */),
  actions: [
    { title: '15m', role: 'set', value: '15', isCurrent: value === '15' },
    { title: '30m', role: 'set', value: '30', isCurrent: value === '30' },
    { title: '1h', role: 'set', value: '60', isCurrent: value === '60' },
    { title: '2h', role: 'set', value: '120', isCurrent: value === '120' },
    { role: 'separator' },
    { title: 'Remove Estimate', role: 'remove' },
  ],
}
```

A `set` action writes the badge's own attribute (`estimate`) to `value`; `remove` clears it. Both are applied by the host to the clicked row in a single undo step, so you don't manipulate the outline yourself. Marking the matching choice with `isCurrent` puts a checkmark next to the active estimate.

Here is the complete `estimate` badge, combining the glyph, the action card, and a small helper that formats minutes into a readable label:

```typescript
import { Image, Text } from 'bike/app'

export function registerEstimate() {
  bike.badge('estimate', {
    where: '.@estimate',
    render: (values, env) => {
      const value = values['estimate'] ?? ''
      return {
        image: Image.fromText(new Text(formatEstimate(value), env.font, env.color.alphaSet(0.6))),
        actions: [
          { title: '15m', role: 'set', value: '15', isCurrent: value === '15' },
          { title: '30m', role: 'set', value: '30', isCurrent: value === '30' },
          { title: '1h', role: 'set', value: '60', isCurrent: value === '60' },
          { title: '2h', role: 'set', value: '120', isCurrent: value === '120' },
          { role: 'separator' },
          { title: 'Remove Estimate', role: 'remove' },
        ],
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

Save, and click an estimate chip. The card should open with the preset times and a **Remove Estimate** option, and choosing one should update the row.

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
      return {
        image: Image.fromText(new Text(label, env.font, env.color.alphaSet(0.6))),
        actions: [
          { title: '15m', role: 'set', value: '15', isCurrent: own === '15' },
          { title: '30m', role: 'set', value: '30', isCurrent: own === '30' },
          { title: '1h', role: 'set', value: '60', isCurrent: own === '60' },
          { title: '2h', role: 'set', value: '120', isCurrent: own === '120' },
          { role: 'separator' },
          { title: 'Remove Estimate', role: 'remove' },
        ],
      }
    },
  })
}
```

The `where` now uses `summary("totalEstimate")` to select any row with an estimate somewhere in its branch. Selecting on a summary keeps this cheap. `inputs` maps names to outline-path expressions, so `render` gets `values.own` (this row's estimate) and `values.total` (the branch total), and shows both only when they differ.

Save, then in Bike create a parent row with a few estimated rows under it. The parent should show the summed total, and a row that has both its own estimate and estimated children should show `own / total`.

## Badges and Decorations

Badges overlap with the [decorations](style-context-tutorial.md#row-formatting-with-decorations) you can attach in the style context. Both add visual elements to a row and both can respond to clicks. They solve different problems, though.

A decoration lives in `style/main.ts`, attaches to the underlying text layout, and is positioned by you. It doesn't affect layout, so it's the right tool for drawing on top of existing content — a background, a mark, a checkbox pinned to the row. A badge lives in `app/main.ts`, and lays out its own glyph trailing the row's text; Bike reserves the space for it. Badges are also value-aware in a way decorations aren't: they read attributes and summaries as `inputs` and can offer the action card you saw above.

As a rule of thumb, reach for a badge to view and interact with branch values, and a decoration to change how the row's existing content is drawn.

## Next Steps

Follow the [Style Context Tutorial](style-context-tutorial.md) to create your own editor styles.
