# Creating Extensions

Extensions introduce new commands, views, styles, and more. Sensitive features
are safeguarded by a permission system.

## Getting Started

Start by following the quick start instructions in the [extension kit
README](../README.md). After following those instructions you will have a new
`my-extension` running in Bike.

## Extension Development Overview

You've set up the kit and built and installed a new extension. Now we'll take a
closer look at how extensions are structured and what they can do. Here's a
generic extension structure:

```
extension.bkext
├── manifest.json
├── app (optional)
│   └── main.ts
├── dom (optional)
│   ├── protocols.ts
│   ├── view1.ts
│   └── view2.ts
├── style (optional)
│   └── main.ts
├── tests (optional)
│   └── extension.test.ts
├── theme (optional)
│   ├── theme1.bktheme
│   └── theme2.bktheme
```

Each extension has a `manifest.json` file which contains the name, permissions,
and other metadata. Properties are documented in the extension kit:
[schemas/manifest.schema.json](../schemas/manifest.schema.json).

Each subfolder corresponds to a different context where the extension code can
run. These contexts are run separately and have different available APIs. An
extension might not need to use all contexts, and you can safely delete the
folder of each unused context.

### App Context (Application Logic)

- Code runs in Bike's native app environment.
- Interact with outlines, clipboard, networking, etc.
- Some APIs require appropriate `manifest.json` permissions (e.g. `"clipboard"`)
- Import the API using `import { SYMBOL } from 'bike/app'`.

### DOM Context (DOM/HTML Views)

- Code runs in web views embedded in Bike's UI.
- Web views are sandboxed and have no network access.
- These views are loaded dynamically using app context APIs.
- Import the API using `import { SYMBOL } from 'bike/dom'`.

### Style Context (Outline Editor Styles)

- Used to define custom stylesheets for Bike's outline editor.
- Use outline paths to match outline elements and apply styles.
- Most extensions will not add styles; delete the style folder if unused.
- Import the API using `import { SYMBOL } from 'bike/style'`.

### Tests

- Test files live in the `tests/` subfolder with a `.test.ts` extension.
- Tests run in the app context (`bike/app` API) and run against a real outline.
- Run tests with `npx bike-ext test` or from Bike's Logs Explorer.
- See [Testing Extensions Tutorial](testing-extensions-tutorial.md) for details.

The app context and DOM context communicate using the `postMessage` and
`onmessage` methods. The message protocol is defined in `dom/protocols.ts`. The
common pattern involves performing work in the app context, such as querying the
outline or making network requests, and then sending the results to the DOM
context for display.

There is also a `theme` folder. Themes are configuration files used by the style
context. Any themes included with an extension will show up in Bike's themes
menus when the extension is installed. Themes can also be installed in Bike
independent of an extension.

## Extension Development Process

Open your `my-extensions` folder in Visual Studio Code and follow along with the
rest of this tutorial to learn about the development process.

### Open Terminal

You need a terminal open to run extension kit commands. You can use the
Terminal.app that comes with macOS, or you can use the Terminal that's built
into Visual Studio Code.

### Create Extension

To create a new extension, run the command:

```
npx bike-ext new <id>
```

The new extension is created for you in `src/`. This command is just creating
the folder structure; you could also create a new extension by creating the
extension folder and files manually.

### Configure Manifest 

Each extension has a `manifest.json` that controls metadata and behavior.
Properties are documented in
[schemas/manifest.schema.json](../schemas/manifest.schema.json).

### Build Extension

To build your extension, run the command:

```
npx bike-ext build my-extension
```

This is an important step. It compiles your TypeScript code, checks for errors,
and prepares the extension for use in Bike. Bike can only load built extensions.
Your built extension is placed in the `out/` folder. You need to run this
command after making changes to your extension's code.

To also install the built extensions into Bike, pass the `--install` flag:

```
npx bike-ext build my-extension --install
```

The `--install` flag copies built extensions from the `out/` folder to Bike's
extensions folder at
`~/Library/Containers/com.hogbaysoftware.Bike/Data/Library/Application
Support/Bike/Extensions`. They are automatically (re)loaded by Bike. You can
also install extensions by copying them to that folder manually, but using the
`--install` flag is more convenient during development.

### Watch Mode

To rebuild your extension automatically when you save changes:

```
npx bike-ext watch my-extension --install
```

A background process monitors your extension for changes. The rest of the
tutorials assume you are in watch mode with `--install`, so as soon as you save
changes, the results are loaded into Bike.

### Debug Extension

There are two important sources for debugging your extension.

#### Logging

To view Bike's Log Explorer:

- Choose the menu Bike > Logs Explorer

Do that now and you should see in the logs that your extension is installed and
activated. You will also see a notice originating from your extension's call to
`console.log` in the activate function.

It's a good idea to keep the logs explorer open while developing your extension.
It should also log any errors that occur in your extension.

#### Safari Debugger

For more complex debugging tasks, use Safari's debugger. This allows you to step
line by line over your extension code and inspect variables.

To enable Safari's debugger:

- Go to Safari > Settings > Advanced and check "Show features for web developers".
- Go to Safari > Develop > Inspect Apps and Devices to see active contexts.
- Start Bike 2 and it should show in the Safari window from the previous step.

In that window, it will show all of Bike's JavaScript contexts. Click on a
context to open it. Then you can set breakpoints, examine variables, etc.

#### Evaluate with AppleScript

You can execute JavaScript in Bike's app context using AppleScript, which is
useful for inspecting runtime state and testing API calls without rebuilding:

```sh
# Check Bike version
osascript -l JavaScript -e '
Application("Bike").evaluate({ script: "bike.version" })
'

# Inspect registered commands
osascript -l JavaScript -e '
Application("Bike").evaluate({ script: "bike.commands.toString()" })
'

# Pass input parameters (must use "input" key, value must be a string)
osascript -l JavaScript -e '
Application("Bike").evaluate({
  input: "Hello!",
  script: "(input) => { return bike.version + \": \" + input }"
})
'

# Use classes that need importing
osascript -l JavaScript -e '
Application("Bike").evaluate({
  script: "const { Outline } = require(\"bike/app\"); new Outline([\"A\", \"B\"]).root.children.length"
})
'
```

Key points for `evaluate`:

- Input and output are **strings only** — use `JSON.stringify`/`JSON.parse` for complex objects
- Use `var` (not `const`/`let`) if you need values to persist across multiple `evaluate` calls
- Wrap `osascript -e` values in single quotes, then use double quotes inside the script.

## Next Steps

- [App Context Tutorial](app-context-tutorial.md)
- [DOM Context Tutorial](dom-context-tutorial.md)
- [Style Context Tutorial](style-context-tutorial.md)
- [Testing Extensions Tutorial](testing-extensions-tutorial.md)
- [Sharing Extensions Tutorial](sharing-extensions-tutorial.md)



























We'll be creating a new extension now. Later, we'll add commands, custom views, and styles. The [finished extension](https://github.com/bike-outliner/example-extensions/tree/main/example-extensions/src/tutorial.bkext) is included in the example-extensions repo. If you get stuck and something doesn't work, check the finished tutorial to see where my instructions went wrong.

### Open Terminal

You need a terminal open to run extension kit commands. You can use the Terminal.app that comes with macOS, or you can use the Terminal that's built into Visual Studio Code.

### Create Extension

To create a new extension, run the command:

```
npx bike-ext new <id>
```

The new extension is created for you in `src/`. This command is just creating the folder structure; you could also create a new extension by creating the extension folder and files manually.

### Build Extension

To build your extension, run the command:

```
npx bike-ext build
```

To also install the built extensions into Bike, pass the `--install` flag:

```
npx bike-ext build --install
```

The `--install` flag copies built extensions to Bike's extensions folder at `~/Library/Containers/com.hogbaysoftware.Bike/Data/Library/Application Support/Bike/Extensions`, where they are automatically loaded by Bike. You can also install extensions by copying them to that folder manually, but using the `--install` flag is more convenient during development.

