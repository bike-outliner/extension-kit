# Localizing Extensions

Bike shows an extension's text in the language of Bike's own interface (`bike.uiLanguage`). Write English in your source and wrap each user-facing string in `bike.localize`:

```ts
editor.showStatusMessage(bike.localize('Archived done tasks'))
bike.localize('Show {title}', { title })
bike.localize('{count, plural, one {# task} other {# tasks}} archived', { count })
```

- Pass whole sentences. Translators need to reorder words, so don't build sentences from pieces.
- `{name}` placeholders take `values`. Numbers are formatted for `bike.systemLocale`.
- `{name, plural, one {…} other {…}}` picks a branch by the language's plural rules. Branches like `=0 {…}` match exactly, and `#` shows the count.
- The argument must be a string literal, or `bike-ext build` can't collect it (it warns when it isn't).

## What gets translated

`bike-ext build` writes `src/<id>.bkext/locales/en.json`, the English to translate:

- every `bike.localize('…')` literal
- command titles. Bike derives titles from command ids (`due:set-today` → "Due: Set Today"), so pick ids that read well
- the extension's name (derived from the folder name) and its manifest `description`

Add a translation by copying `en.json` to `locales/<language>.json` (`de.json`, `pt-BR.json`) and replacing the values. Missing keys fall back to English. The build copies `locales/` into the built extension.

## Dates, numbers and lists

- `bike.formatDate` uses month and weekday names for `bike.systemLocale`.
- Use `Intl.NumberFormat`, `Intl.ListFormat`, `Intl.DateTimeFormat(…).formatRange` and `toLocaleString(bike.systemLocale)` rather than building them by hand.

## Identity

Don't use translated text as an identifier:

- Give inspector items a stable `id`. Bike saves their tab and visibility under it.
- Compare an alert's `buttonIndex`, not its `button` title.
- Text written into the user's outline (a new row's text, a calendar week name) is written once in the current language. Find those rows by type or attribute, never by their text.
