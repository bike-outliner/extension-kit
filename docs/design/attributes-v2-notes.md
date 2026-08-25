# Attributes v2 — design notes

The design rationale behind the v2 attribute system — `api/app/attribute.d.ts`,
`picker.d.ts`, `badge.d.ts`, `summary.d.ts`. These files WERE the drafts; at
api 0.58.0 they replaced the v1 API outright (clean break, no compat shims) and
this document is kept as the record of why the interfaces look the way they do.

## The core idea

Attributes are **one value-type system with many consumers**. Everything in
this folder is arranged so a single `bike.attribute(name, config)` declaration
drives:

- palette completion and its value stage,
- `editor.showPicker` (kind, embedded editor, suggestions, parse),
- the built-in catch-all badge and the default badge menu,
- custom badge display (via `env.formatAttribute`),
- typed summary reductions,
- (eventually) query coercion — `.@due < "2026-08-01"` comparing as dates.

Three mechanisms carry that:

1. **One vocabulary.** `PickerKind` is gone; `showPicker`'s `kind` IS
   `AttributeType`. Renames that fell out: picker `string` → `text`, picker
   `dateRange` → `interval` (matching the ISO term the query engine already
   uses), picker `dateTime` → gone (`date` + `time: 'required'` facet).
2. **Shared facets.** Each type's constraint set (`NumberFacet`,
   `ChoiceFacet`, …) is defined once in `attribute.d.ts` and intersected
   into BOTH the attribute config variant and the picker options variant.
   The two surfaces cannot drift, and "the attribute-bound picker derives
   its editor from the definition" is definitionally complete.
3. **Lossless `AttributeInfo`.** The registry snapshot is a discriminated
   union carrying every facet field, defaults resolved (`choices`
   normalized, defaults filled, …). Any consumer can reconstruct the
   full editing/rendering experience from the info alone.

Supporting decisions:

- **One named-value shape.** `AttributeChoice { name, value, detail?,
  menu? }` is the only "offered value" row type — choices, suggestions,
  picker rows. `menu: true` promotes a row into the built-in attribute
  menu (0.63.0 — this replaced the separate `AttributeShortcut` list and
  the Attributes Editor's bare-`@` shortcut rows). v1's `PickerValue` /
  `PickerChoiceOption` are gone.
- **Wire encodings are normative in exactly one place** — the
  `AttributeType` doc in `attribute.d.ts`. Picker kinds and summary docs
  reference it instead of restating it.
- **One suggestion contract.** `AttributeSuggest = (pattern) =>
  AttributeChoice[]` is used by attribute definitions AND ad-hoc pickers.
  Sync-only as of 0.63.0: the bridge always called providers synchronously
  and discarded Promises, so the async signature (and the never-wired
  `signal` / provider-vs-window `filter` flag) was removed rather than
  implemented.

## Native backing (OutlineAttributes)

All parsing, canonicalization, natural-language input, localized display,
and standard suggestions are implemented once, in Swift, in
`Bike/OutlineAttributes` — `AttributeType.canonicalize/parse/display` +
`AttributeConstraints`. The TS API deliberately exposes NO extension hooks
for per-type parsing (v1's `AttributeConfig.parse` / `standardValues` are
gone); a definition contributes only extra `suggestions` (whose `menu`
marks feed the built-in attribute menu). `AttributeConstraints` is the
runtime dual of the facets.

Known gaps to close in the Swift package before consolidation (from the
2026-07-24 review):

- `suggestions()` exists only for `date` and isn't dispatched through the
  facade; it should become a facade method returning wire-valued
  `AttributeChoice`s for every type (boolean Yes/No, choice options,
  common durations/recurrences/times).
- `interval` and `recurrence` have no natural-language parse (wire-only).
- Date NL can't produce a time, so `time: 'required'` + "tomorrow"
  dead-ends; either NL learns "tomorrow 3pm" or `'required'` defaults a
  time-of-day.
- Free-text number parse is dot-decimal only (not locale-lenient) while
  display is localized.
- `list` + comma-bearing encodings (`recurrence`) corrupts via the comma
  split — now rejected at registration (see below); the facade should get
  a matching `validate(constraints)` so registration errors come from the
  same source of truth.
- Swift `AttributeType` needs `flag` (or an explicit note that flags never
  reach the codec — they're valueless, so canonicalize/parse/display don't
  apply).
- Canonicalize-on-write contract: every UI write path (palette commit,
  picker accept, drops) passes through `canonicalize`; `display`'s
  raw-wire fallback exists only for hand-typed/imported junk.

## Decisions taken (and why)

- **`flag` is back as a distinct type.** v2 originally folded it away, but
  `@done` — presence with `""`, absence otherwise — is Bike's canonical
  attribute and is NOT a `boolean` (`"true"`/`"false"`, where false is a
  real value). Different wire models, different pickers (flag = On/Off with
  Off ⇒ remove; boolean = Yes/No). `emptyLabel` doubles as the flag's On
  label.
- **`interval`, not `dateRange`.** ISO terminology, already adopted by the
  query engine (`interval-*` functions). The Swift side should follow:
  reserve `AttributeInterval` for the stored day-range value (today it
  names the query engine's resolvable interval while `AttributeDateRange`
  implements the attribute — a three-way collision worth settling before
  consolidation).
- **`date` absorbs `dateTime`** via the `time: 'optional' | 'required' |
  'never'` facet (default `'optional'`). One calendar picker, three time
  policies. Ad-hoc day-only pickers pass `time: 'never'`.
- **`list` replaces picker `multiple`** — same comma-join contract, same
  word everywhere. Registration rejects `list` for `flag` and `recurrence`
  (encoding contains commas).
- **`open` replaces `strict`** for choice (inverted, scoped to the type
  that needs it). The ad-hoc picker keeps its own `strict` since there's no
  definition to consult.
- **Summary `list` separator default changed `/` → `,`.** `/` collides
  with the ISO interval separator and the result couldn't round-trip as a
  list attribute value; `,` matches the list contract.
- **Explicit behavior flags kept.** `defaultBadge` remains an opt-out flag;
  registering a definition never changes rendering by itself.
- **Registration validates.** Bad configs throw at `bike.attribute` time
  (empty `choices`, `min > max`, `list`/`suggestions` on
  `flag`, `list` on `recurrence`) rather than failing silently at use time.
- **Badges format through the environment.** `env.formatAttribute(name,
  wire)` / `env.formatValue(type, wire)` expose the native display layer so
  custom badges never reimplement ISO parsing or locale formatting.
  Now-relative labels ("Today") are computed at `env.now` — badges showing
  now-relative types should set `tick`.
- **Typed summaries.** `SummaryConfig.type` opts into encoding-aware
  reduction (durations add, dates min/max chronologically) with the result
  emitted canonically — so `summary("totalTime")` is itself a wire value
  badges can format and queries can compare. Unparseable rows contribute
  nothing rather than poisoning the reduction. Untyped summaries keep v1
  numeric/string behavior.

## Open questions

- **`suggestions` on all types vs. some.** Currently allowed on everything
  but `flag` (augmenting host built-ins). Is that right for every type — or
  should some reject it?
- **Attribute-bound facet overrides.** `attribute` + explicit `kind` lets a
  caller override the embedded editor while keeping definition-bound
  suggestions. Is partial facet override (attribute + just `min`) worth the
  type-system cost? Currently: all-or-nothing per kind variant.
- **`bike.*` surface** (to be reflected in a future `bike2.d.ts`):
  `attribute(name, config)`, `observeAttributes(handler)` (new info
  shape), `parseAttribute(name, text)` (now host-typed),
  and probably `displayAttribute(name, wire)` / `displayValue(type, wire)`
  as the app-context siblings of the badge env formatters.
- **DOM-context consumers.** WebView extensions (calendar `due-marks`)
  can't call native synchronously. Either ship display strings /
  pre-parsed values across the DOM protocol, or bless one small JS display
  shim as the only permitted duplicate. Decide before deleting the JS
  copies.
- **Query coercion.** Should a registered `type` make outline-path
  comparisons on that attribute type-aware (`.@due < "today"`)? Deepest
  payoff, biggest blast radius — deliberately out of scope for these
  files.

## File map

- `attribute.d.ts` — the type system: `AttributeType` (+ normative wire
  encodings), `AttributeChoice`, `AttributeSuggest`, the facets,
  `AttributeConfig`, lossless `AttributeInfo`.
- `outline.d.ts` — the model boundary, where every attribute is just its
  wire string: `getAttribute` returns one, `setAttribute` takes one, and
  the typing lives in the `AttributeType`-keyed value layer
  (`bike.encodeValue` / `decodeValue`, `bike.parseValue` / `displayValue`,
  `env.formatAttribute`). 0.64.0 removed the pre-v2 `AttributeValue`
  (`string | number | Date`) and `AttributeValueType`
  (`'string' | 'number' | 'date'`) — the first silently coerced a `Date`
  into a second spelling of the same stamp, the second was never wired to
  the bridge at all.
- `picker.d.ts` — the value-picker shell; kinds = `AttributeType`, options
  = base + facet; attribute-bound derivation rules.
- `badge.d.ts` — badges; type-aware catch-all and default menu;
  `env.formatAttribute`/`formatValue`.
- `summary.d.ts` — axis reductions; typed via `AttributeType`.
