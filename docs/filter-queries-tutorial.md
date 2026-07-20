# Filter Queries Tutorial

Use `bike.addFilter` to contribute labeled filter queries to the outline filter field's autocomplete. Your extension writes the query once; users apply it by name without knowing any outline path syntax.

- [App Context API](../api/app/)
- Entry point: `app/main.ts`
- Code runs in Bike's native app environment.
- Registered filters appear in the filter field's completions for every outline.
- Import the API using `import { SYMBOL } from 'bike/app'`.

## Setup

This tutorial assumes that you have [created an extension](creating-extensions.md) and are running `npx bike-ext watch --install`. Your extension should automatically build and install when you save changes.

## Registering a Filter

We'll register a filter that shows unfinished tasks. Add this to your `activate` function:

```typescript
export async function activate(context: AppExtensionContext) {
  bike.addFilter('remaining-tasks', {
    label: 'Remaining Tasks',
    query: '//task and not @done',
  })
}
```

The first argument is the filter's name — an identifier unique within your extension, used to replace the registration if you call `addFilter` again with the same name. `label` is what the user sees, both in the completions list and in the collapsed filter field once the filter is applied. `query` is the outline filter to apply, parsed as an outline path.

Save your changes. In Bike, click into the outline filter field while it's empty. The completions list shows the document's saved sidebar queries first, then a divider, then extension filters alphabetically by label — including **Remaining Tasks**. Once you start typing, everything ranks together by fuzzy-match score. Pick the filter and the outline filters to unfinished tasks, with the field collapsing to the label.

## Real Queries

Filters shine when the query is something a user wouldn't want to type. The calendar extension registers its due filters this way:

```typescript
bike.addFilter('due-today', {
  label: 'Due Today',
  query: '//@due >=[d] today() and @due <[d] today() + days(1) and not @done',
})
```

See [Creating Outline Paths](https://bikeguide.hogbaysoftware.com/using-bike-advanced/creating-outline-paths) in the user guide for the full path syntax.

## Removing Filters

`addFilter` returns a `Disposable`. Filters are removed when your extension deactivates, or earlier if you dispose:

```typescript
const filter = bike.addFilter('remaining-tasks', {
  label: 'Remaining Tasks',
  query: '//task and not @done',
})
// Later:
filter.dispose()
```

## Setting Filters Directly

The autocomplete is for user-driven filtering. Your code can also apply a labeled filter imperatively — for example from a badge menu or command — by assigning `editor.filter`:

```typescript
editor.filter = { path: '//task and not @done', label: 'Remaining Tasks' }
```

The label shows in the collapsed filter field exactly as if the user had picked it from the completions. Assign `undefined` to clear the filter.

## Next Steps

Follow the [Summary & Badges Tutorial](summary-badges-tutorial.md) to surface the same values your filters query as row badges.
