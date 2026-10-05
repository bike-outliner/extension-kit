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
- the extension's name (derived from the folder name), its theme names (from `.bktheme` file names) and its manifest `description`

Manifests have no `name` and commands have no separate `title`: the derived names are what get translated.

Add a translation by copying `en.json` to `locales/<language>.json` (`de.json`, `pt-BR.json`) and replacing the values. Missing keys fall back to English. The build copies `locales/` into the built extension.

## Dates, numbers and lists

- `bike.formatDate` uses month and weekday names for `bike.systemLocale`, the same locale as the `Intl` calls below, so a calendar's dates read in one language.
- Use `Intl.NumberFormat`, `Intl.ListFormat`, `Intl.DateTimeFormat(…).formatRange` and `toLocaleString(bike.systemLocale)` rather than building them by hand.

## Right to left

When Bike's interface runs right to left (Arabic, Hebrew), `bike.layoutDirection` is `'rtl'`, and DOM pages get `<html dir="rtl">` with `lang` set to `bike.uiLanguage`.

- Use logical CSS, so layouts mirror on their own: `margin-inline-start/end`, `padding-inline-*`, `inset-inline-*`, `text-align: start/end` and `border-start-start-radius`, not `left`/`right`.
- Name direction-encoding SF Symbols with `forward`/`backward` (`chevron.forward`), which Bike draws mirrored. `left`/`right` symbols never flip.
- Read `bike.layoutDirection` for anything done in code, such as which arrow key moves forward.
- Put text in `Label` (or wrap it in `<bdi>`). A page that runs right to left otherwise treats every paragraph as right to left, so untranslated English gets its punctuation at the wrong end (":Settings").

## Identity

Don't use translated text as an identifier:

- Give inspector items a stable `id`. Bike saves their tab and visibility under it.
- Give settings items a stable `id`. Bike keys the item's section in the settings pane by it, and sorts sections by `label`.
- Compare an alert's `buttonIndex`, not its `button` title.
- Text written into the user's outline (a new row's text, a calendar week name) is written once in the current language. Find those rows by type or attribute, never by their text.
