# Testing Extensions Tutorial

Tests are `tests/*.test.ts` files in an extension. They run in the app context
(`bike/app`) and are built with the extension. `describe`, `it` and `assert` are
typed globals; there is nothing to import.

## Running Tests

```
npx bike-ext test              # all extensions in the package
npx bike-ext test tutorial     # one extension
```

`test` builds and installs, launches Bike in test mode, and prints the results.
It exits 0 if every test passes and 1 otherwise. It refuses to run when an
extension under test is disabled in Bike. Set `BIKE_PATH` if it can't find
Bike.app.

Bike > Logs Explorer > **Run Tests** runs the installed tests and logs the
results. Core extension tests don't ship with Bike; build them from source to
run them.

## Writing Tests

```typescript
describe("My Tests", () => {
    const editor = bike.testEditor()
    const outline = editor.outline

    it("simple assert", () => {
        assert(true, "Expected true")
    })

    it("async test", async () => {
        const result = await new Promise<string>((resolve) => {
          setTimeout(() => resolve("done"), 100)
        })
        assert(result === "done", "Expected promise to resolve")
    })

    it("can create and read rows", () => {
        outline.insertRows(["Hello", "World"], outline.root)
        assert.equal(outline.root.children.length, 2)
        assert.equal(outline.root.firstChild!.text.string, "Hello")
    })
})
```

Tests run in order; each async test finishes before the next starts. Outline
changes persist between tests. `bike.testEditor()` resets the test document and
returns its editor.

## Testing the Archive Done Command

This tests the [App Context Tutorial](app-context-tutorial.md) command:

```typescript
import { Row } from 'bike/app'

describe("Archive Done Command", () => {
    const editor = bike.testEditor()
    const outline = editor.outline

    it("sets up tasks with some marked done", () => {
        outline.transaction({ label: "setup" }, () => {
            let rows = outline.insertRows([
                { type: "task", text: "Task 1" },
                { type: "task", text: "Task 2" },
                { type: "task", text: "Task 3" },
            ], outline.root)
            rows[0].setAttribute("done", "")
            rows[2].setAttribute("done", "")
        })
        assert.equal(outline.root.children.length, 3)
    })

    it("archives done tasks", () => {
        bike.commands.performCommand("tutorial:archive-done", { editor })
        let archiveRow = (outline.query('//@id = archive').value as Row[])[0]
        assert(archiveRow, "Expected an Archive row to be created")
        assert.equal(archiveRow.children.length, 2, "Expected 2 done tasks archived")
        assert.equal(archiveRow.firstChild!.text.string, "Task 1")
        assert.equal(archiveRow.lastChild!.text.string, "Task 3")
    })

    it("leaves undone tasks in place", () => {
        let topLevelRows = outline.root.children.filter(r => r.persistentId !== "archive")
        assert.equal(topLevelRows.length, 1, "Expected 1 undone task remaining")
        assert.equal(topLevelRows[0].text.string, "Task 2")
    })
})
```
