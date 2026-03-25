# Testing Extensions Tutorial

Write tests for your extensions using the built-in test harness.

- Entry points: `tests/*.test.ts`
- Tests run in the app context (`bike/app` API)
- And can also test APIs defined in `bike/app/test`
- `describe`, `it`, and `assert` functions are provided by the test harness

## Setup

This tutorial assumes that you have completed the [DOM Context
Tutorial](dom-context-tutorial.md). Your extension should already have a
`tests/` folder with a sample test file.

## Running Tests

To run tests open terminal and run:

```
npx bike-ext test              # Build, install, and run all extension tests in package
npx bike-ext test tutorial     # Build, install, and run tests for a specific extension
```

The test command builds and installs the extension to test into Bike. It then
launches Bike in a special test mode that runs the tests and prints results to
the terminal. The process exits with code 0 if all tests pass, or 1 if there are
any failures.

Use `BIKE_PATH` environment variable to specify the exact path to Bike.app if
the test command is not finding it.

You can also run tests from Bike > Logs Explorer. Click the **Run Tests** button
and test results are displayed in the log. Note: The core extensions tests are
not included with Bike, so if you want to run them you will need to build and
install the core extensions from source.

## Writing Tests

Test files use TypeScript with the `.test.ts` extension. Place them in a
`tests/` subfolder of your extension. They are compiled during the build step
along with the rest of your extension:

```
my-extension.bkext
├── app/
├── manifest.json
└── tests/
    └── my-extension.test.ts
```

The `describe`, `it`, and `assert` functions are provided by the test harness.
Type declarations for these functions are included in the extension kit, so you
get autocomplete and type checking.

This example shows common testing patterns:

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

Async tests run sequentially — each test waits for the previous one to complete.
Modifications to the outline persist across tests, so you can set up state in
one test and make assertions on it in later tests. You can also use
`bike.testEditor()` to get a fresh outline.

## Testing the Archive Done Command

If you followed the [App Context Tutorial](app-context-tutorial.md), you can
test the `tutorial:archive-done` command. This example sets up an outline with
task rows, marks some as done, runs the command, and verifies the results:

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
        let topLevelRows = outline.root.children.filter(r => r.id !== "archive")
        assert.equal(topLevelRows.length, 1, "Expected 1 undone task remaining")
        assert.equal(topLevelRows[0].text.string, "Task 2")
    })
})
```