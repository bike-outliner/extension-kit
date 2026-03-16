# Testing Extensions

Write automated tests for your extensions using the built-in test harness. Tests have full access to the `bike` API and run against a real outline document.

## Running Tests

There are two ways to run extension tests:

### Command Line

Run tests using the extension kit CLI:

```
npx bike-ext test              # Build, install, and run all extension tests
npx bike-ext test tutorial     # Build, install, and run tests for a specific extension
```

This builds all extensions, installs them into Bike, then launches Bike to run the tests. Results are printed to stdout and the process exits with code 0 (all passed) or 1 (failures).

The command finds Bike.app automatically (checking `/Applications/Bike.app` and Spotlight). Set the `BIKE_PATH` environment variable to override the location.

### Logs Explorer

Open **Window > Logs Explorer** and click the **Run Tests** button. This runs tests from all installed and enabled extensions, with results displayed in the log.

## Writing Tests

Test files use TypeScript with the `.test.ts` extension. They are compiled during the build step along with the rest of your extension.

Structure tests using `describe` and `it`:

```typescript
describe("My Feature", () => {
    it("does something", () => {
        assert(true, "Expected true")
    })

    it("computes correctly", () => {
        assert.equal(1 + 1, 2, "Math works")
    })
})
```

Place test files in a `tests/` subfolder of your extension:

```
my-extension.bkext
├── app/
├── manifest.json
└── tests/
    └── my-extension.test.ts
```

The `describe`, `it`, and `assert` functions are provided by the test harness at runtime. Type declarations are included in the extension kit, so you get full autocomplete and type checking.

## Assertions

Five assertion functions are available:

| Function | Description |
|----------|-------------|
| `assert(condition, msg)` | Fails if `condition` is falsy |
| `assert.equal(a, b, msg)` | Fails if `a !== b` (strict equality) |
| `assert.notEqual(a, b, msg)` | Fails if `a === b` |
| `assert.throws(fn, msg)` | Fails if `fn()` does not throw |
| `assert.rejects(fn, msg)` | Fails if `fn()` does not reject (async) |

The `msg` parameter is optional for all assertions. When omitted, a default message is generated.

## Test Environment

Tests require that no documents are open when they start. The test harness will refuse to run if any documents are open.

Use `bike.testEditor()` or `bike.testOutline()` to get a test document:

- **`bike.testEditor()`** -- Returns an `OutlineEditor` for a fresh test document. On the first call it creates a new untitled document. On subsequent calls it resets the same document to an empty outline with no undo history.
- **`bike.testOutline()`** -- Same as `testEditor()` but returns the `Outline` directly.

Each `describe` block should call one of these at the top to get a clean slate:

```typescript
describe("My Tests", () => {
    const editor = bike.testEditor()
    const outline = editor.outline
    // ...
})
```

Key points:

- All `bike` APIs are available, including registered extension commands
- Extensions are built and installed before tests run, so your commands and keybindings are available
- The test document is automatically closed after all tests complete

## Example

A complete test file that exercises outline operations:

```typescript
describe("Outline Operations", () => {
    const outline = bike.testOutline()

    it("starts with an empty root", () => {
        assert(!outline.root.firstChild, "Expected no children on root")
    })

    it("can insert rows", () => {
        outline.transaction({ label: "test" }, () => {
            outline.insertRows(["hello", "world"], outline.root)
        })
        assert.equal(outline.root.children.length, 2)
    })

    it("can read row text", () => {
        assert.equal(outline.root.firstChild!.text.string, "hello")
    })

    it("can query rows", () => {
        const result = outline.query("//row") as { type: 'elements', value: unknown[] }
        assert.equal(result.value.length, 2)
    })
})
```

## Async Tests

Test functions can be async. The test runner will await the returned promise:

```typescript
it("fetches data", async () => {
    const response = await fetch("https://example.com/api")
    assert.equal(response.status, 200)
})
```

Async tests run sequentially — each test waits for the previous one to complete.

## Tips

- **Use `bike.testEditor()` or `bike.testOutline()`** at the top of each `describe` block for a fresh outline.
- **Use transactions** for outline changes -- wrap insertions, moves, and deletions in `outline.transaction()`.
- **Tests run sequentially** -- each `it` block runs to completion (including awaiting async tests) before the next one starts.
- **State accumulates** within a `describe` block -- rows created in one `it` block are visible in subsequent blocks.
- **Close all documents** before running tests -- the harness won't run if documents are open.
