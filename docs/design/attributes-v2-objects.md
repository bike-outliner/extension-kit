# Typed Objects (forward-looking sketch)

Speculative. Not built, not wired. This captures how the attribute type system
(`attribute.d.ts` + the native `OutlineAttributes` value layer) could grow
upward from typed *values* to typed *things* — modeling books, projects, people
inside an outline without turning Bike into a database.

## The layering

```
objects       a row (or branch) IS a Book / Project / Person
   ↑
attributes    a row HAS typed values: due:date, estimate:duration, ...
   ↑
values        the wire types OutlineAttributes parses/formats/suggests
```

Each layer is a named schema over the layer below, and each borrows the same
move: **name a type, get behavior for free.** `date` gave every date attribute
the same entry UX. An object type should give every Book the same fields,
template, badge, and completions — no matter which extension or user created it.

One asymmetry constrains the whole design and is worth stating plainly: value
types are a CLOSED set with native per-type code (the host implements `date`);
object types are an OPEN set — anyone can declare `book` — so all object
behavior must be **schema-derivable data**. The host implements the object
verbs (detect / validate / template / display / complete / summarize) once,
generically; there is never per-object-type native code. Anything a verb needs
must be expressible in the schema.

## What an object is

One concept, two granularities:

- **Row-object** — the entity lives in a single row's attributes. A *person* is
  a row: `@type:person @email @role`. Its fields are attributes.
- **Branch-object** — the entity is a row *and its subtree*. A *project* is a
  row whose children are tasks; a *book* is a row whose children are chapters.
  Its fields are attributes on the root **plus** structured descendants.

An object type describes a *root row* (its attributes) and optionally the
*shape of the branch beneath it* (which child objects are expected). A
row-object is simply a branch-object with an empty structural part — not a
second concept; two concepts would double every API.

## Objects reuse the attribute layer for fields

An object type is, first, a named bag of attribute declarations — the fields —
each one an ordinary `AttributeConfig`. Nothing new to parse or render; the
value layer already knows how.

```ts
bike.object('book', {
  title: 'Book',
  fields: {
    name:      { type: 'text' },
    author:    { type: 'text' },   // a name is identity enough — see the relations ladder
    published: { type: 'date', time: 'never' },
    pages:     { type: 'number', min: 1 },
  },
})
```

Field-aware completion falls out: on a `@type:book` row, `@` offers *this
object's* fields first, each entered through its value type's standard UX.

### Fields introduce SCOPING into a flat namespace

This is the main place the object layer changes the attribute layer rather
than just sitting on it. `bike.attribute` is global: `due` means one thing
everywhere. Object fields are contextual: `name` on a book vs. `name` on a
person; `pages: { min: 1 }` on a book vs. an unconstrained global `pages`.
Same name, different configs — and today every consumer (palette, catch-all
badge, derived picker, summary coercion) resolves configs by name alone.

Resolution must become contextual: on a row, a field name resolves through the
row's object type(s) first, then falls back to the global registry. Consumers
already hold the row, so they *can* — but the API shape changes:
`bike.observeAttributes` stays the global registry, while something like
`bike.attributeInfo(row, name)` becomes the true resolution point every
consumer routes through. Field configs never leak into the global registry;
two objects declaring the same field name is normal, not a collision.

### Derived fields (structure is data)

A field whose answer is derivable from the tree must be DERIVED, never stored.
A chapter's book is "nearest ancestor of type book" — and the machinery
already exists (`reduce: 'nearest'` over the `ancestor` axis in summaries).
Sketch:

```ts
bike.object('chapter', {
  fields: {
    book: { derive: 'ancestor', object: 'book' },   // computed, read-only, never written
  },
})
```

Derived fields keep documents clean (nothing to update when a chapter moves to
another book) and make the first rung of the relations ladder (below) a
first-class schema concept instead of a per-extension query.

## Structure: the branch grammar

Beyond fields, a branch-object needs to say what its subtree looks like. This is
the genuinely new surface — a small grammar over child rows, expressed in terms
of *other object types* so structure composes:

```ts
bike.object('project', {
  fields: { status: { type: 'choice', choices: ['active', 'paused', 'done'] } },
  contains: { task: 'many' },          // children are `task` objects
})

bike.object('book', {
  fields: { author: { type: 'text' } },
  contains: { chapter: 'many' },       // chapter is itself an object with `contains: { section: 'many' }`
})
```

Cardinality (`one` / `many` / `optional`) is the whole vocabulary to start.
Bike is freeform, so this reads as **expectation, not enforcement** — it drives
templates, completion, and validation *hints*, and never blocks the user from
typing whatever they want. Untyped children (loose notes under a project) are
always tolerated.

### Presumed types, not mandatory tags

Explicit `@type` on every chapter and section is ceremony no reading-list
keeper will perform — but pure explicitness would demand it. The middle path:
children of a typed row get a **contextual presumed type** from `contains`.
Untyped children of a `@type:book` row are *treated as* chapters — for
completion, templates, and validation hints — and the presumption chains
(`chapter` presumes `section` below it). The presumed type is NEVER written
into the document; on disk, explicit `@type` remains the only truth. A child
can always override the presumption with its own explicit `@type`.

## Relations: a ladder, strongest rung first

The tree stores exactly one relation for free — containment — and every row
has one parent, so structure encodes exactly one relation per row. Bike ALSO
already has inline links in row text. Between them, most relations need no new
machinery at all. Pick the highest rung that fits:

1. **Structure** — the relation IS containment: derive it, never store it
   (see derived fields). *Chapter→book, task→project.*
2. **Inline link** — the relation is NARRATIVE: part of what the row says.
   *A journal note about Project X, a citation, "sequel to".* This is where
   the cross-scheme cases live (a date-organized journal pointing into
   topic-organized projects — two orthogonal hierarchies the tree can only
   physically embody one of). Links exist today, users understand them, and
   the target's name renders in place.
3. **Value attribute** — the relation is a ROLE but a name is identity
   enough: `@assignee:jesse` as a `choice`/`text` field with query-driven
   suggestions. Queryable with today's engine (`//task @assignee = jesse`).
   Renames break the association — a very outliner-ish trade to accept.
4. **Reference attribute** — the relation is a role AND needs rename-stable
   identity and typed entry: *assignee at scale, `@blockedBy` between sibling
   tasks, true many-to-many.* **DEFERRED** — see below.

What links can't carry is a machine-readable ROLE: a link says "related,
somehow," and the relationship's meaning lives in surrounding prose that
queries can't read. And role-shaped relations don't belong in prose anyway —
reassigning a task shouldn't be text editing. That's rungs 3–4. But rungs 1–3
cover every example in this document, which is why there is currently **no
`reference` type in `attribute.d.ts`** (there was, briefly; it's removed
until role-queries earn it).

### The link graph layer (build once, for links first)

The machinery a `reference` type would need — resolution (id → row), a
REVERSE INDEX (row → everything pointing at it), a dangling-target
presentation — is machinery text links already need and don't fully have:
backlinks ("what links here?"), stale-link detection, display that survives
target renames. So build the graph layer once, for TEXT LINKS, with one wire
encoding for a row target (the persistent-id / URL form). If role-queries
later prove wanted, `reference` stops being a new subsystem and becomes "that
same link value, stored in an attribute instead of a text run." The index
isn't the price of a speculative type; it's an overdue feature for links that
a future type happens to reuse.

If/when `reference` lands, the costs already cataloged apply and are all
served by the graph layer:

- display purity: `OutlineAttributes` stays outline-ignorant via a resolver
  injection (`display(…, resolve: (id) => string | undefined)`);
- badge invalidation rides the reverse index (renaming a referent must
  invalidate badges on OTHER rows — source-row memoization can't see it);
- dangling targets get an explicit "missing" face, never a raw pid;
- the id encoding is pinned in the `AttributeType` doc; ids carry no comma,
  so `list` (multiple referents) is legal;
- v1 scope is same-document; cross-document paste degrades visibly to the
  dangling state.

**Sequencing:** derived ancestor fields + inline links + name-valued
attributes (shipped or nearly free) → the link graph layer, for backlinks →
only then, if evidence demands it, `reference` on top.

## The native object layer (mirror of OutlineAttributes)

Just as `OutlineAttributes` centralizes value parse/format/suggest, an object
layer centralizes the behaviors that make a *thing* feel like a thing, so every
object type gets them uniformly — implemented once, driven entirely by schema:

- **Detect** — is this row a Book? (explicit `@type`, plus presumed types)
- **Validate** — which expected fields/children are missing; surface as hints.
- **Template** — "New Project" inserts a structured branch scaffold.
- **Display** — an object-level badge or summary for the root row (stick to
  the existing badge/summary vocabulary before inventing cards).
- **Complete** — offer this object's fields and child types in context.
- **Summarize** — roll the subtree up (a project's task counts), reusing
  `bike.summary` / the branch-summary machinery in `Tree`. Missing primitive:
  a reduction that STOPS at nested object roots (a project inside a project
  shouldn't leak into its parent's rollup) — a `within: 'object'` boundary on
  summaries, or similar.

## Composition and inheritance

Object types compose: a `novel` extends `book` (adds `genre`, keeps
`author`/`published`); a `chapter` is a child object of `book` and a parent of
`section`. Single-inheritance, shallow, with one-line merge semantics — deep
merge is where inheritance schemes go to die:

- a child's field config **overrides the parent's wholesale** (no per-facet
  merging);
- `contains` merges by key, child winning.

## Where schemas live — and what that forces NOW

Extension-owned schemas (code, like `bike.attribute`) and user-defined schemas
(no code: in-document or settings UI) should both exist — "define a Book type
for your reading list" must not require writing an extension. User-defined
means **serializable**, and that has a concrete consequence for
`attribute.d.ts` today: `AttributeConfig` contains a function
(`suggestions` — as of 0.63.0 the only callback; `shortcuts`/`filter` are
gone). Split it:

- a **declarative core** — everything JSON-representable: `type`, the facets,
  `title`/`description`/`emptyLabel`, `defaultBadge`, `list`;
- the **callback extra** — `suggestions`.

Extensions register both; stored object schemas carry only the core. If the
type system doesn't draw this line, it gets drawn ad hoc later.

Registration itself belongs beside the attribute surface — `bike.object(name,
config)` next to `bike.attribute`, plus `bike.observeObjects`. The symmetry is
the product ("the same move, one level up"); a separate surface would undercut
it.

## How a row becomes typed

Prefer **explicit over inferred** (softened only by presumed types, above). A
reserved `@type` attribute names the object type; the registry maps `book` →
schema. Explicit is honest, queryable (`@type:book`), and avoids the fragility
of "has a title and an author, must be a book." Inference could exist later as
an *assist* ("this looks like a book — tag it?"), never as silent truth.

Dogfood the attribute layer for `@type` itself: the host registers `type` as an
open, `list: true` `choice` whose choices derive live from the object registry.
Multiple types per row and `@type:book` completion then fall out of existing
choice semantics rather than new machinery. (Check the reserved-attribute-names
list first — `type` is a word users already use, and the catch-all badge's
reserved-name exclusion interacts with it.)

Partial conformance is always tolerated — an outline row is a freeform thing
that an object schema *describes*, not a record a schema *owns*.

## What it unlocks

- **Templates** — structured insertion for higher-level things.
- **Schema-aware queries** — the query engine already filters attributes
  (`@type:book` works today); objects give it named shapes. Backlinks come
  from the link graph layer. Forward JOINS ("books whose author is in
  France") *require* a dereference operator over row targets in outline-path
  — query-language work, not a free byproduct.
- **Rollups** — branch summaries scoped to an object's subtree (needs the
  `within: 'object'` boundary above).
- **Relations & backlinks** — inline links + the graph layer; a `reference`
  type only if role-queries demand it.
- **Consistent entry & rendering** — the same payoff as typed values, one
  level up.

## Guiding tension

Bike is a freeform outliner, not a database. The whole design has to stay on the
*descriptive/assistive* side of the line: object types make higher-level things
easier to build, template, query, and read — but a row is never forced to
conform, and an outline full of untyped rows must keep working exactly as it does
today. Objects are a lens, not a cage.

The two expensive places — where design effort should go before any more
surface is written — are **contextual field scoping** and **the link graph
layer**: both push changes *down* into the attribute, text, and badge layers,
not just up into a new one.

## Open questions

- How validation hints surface without nagging (style state? inspector?
  nothing visible until asked?).
- Cross-document row targets — for links generally, not just a future
  `reference` (URL scheme? id remapping on paste?).
- Link graph index lifecycle and cost (built per document? lazily on first
  backlink query? persisted?).
- What evidence promotes `reference` off the deferred list — presumably
  role-queries users actually ask for that name-valued attributes can't
  answer (rename churn, ambiguous names).
- Presumed types and mixed children: when a book's children are chapters AND
  loose notes, how aggressive should chapter-presumption be in completion?
- Does `contains` need ordering ("chapters before appendices") or is
  cardinality truly enough to start?
- In-document schema storage format and its UI (a settings sheet? a special
  branch? front-matter?).
