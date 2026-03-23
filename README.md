# @bike-outliner/extension-kit

Build tooling and API types for [Bike Outliner](https://www.hogbaysoftware.com/bike/) extensions.

## Requirements

- Node.js 20.11+ (uses `import.meta.dirname`)
- macOS (extension installation targets Bike.app)

## Quick start

```sh
mkdir my-extensions && cd my-extensions
npm init -y
npm install --save-dev @bike-outliner/extension-kit
npx bike-ext new my-extension
npx bike-ext build
```

## Commands

| Command | Description |
|---------|-------------|
| `npx bike-ext new [id]` | Create a new extension from template (bootstraps project on first run) |
| `npx bike-ext build [--install]` | Build all extensions for production |
| `npx bike-ext watch [--install]` | Build and watch for changes during development |
| `npx bike-ext test [id]` | Build, install, and run tests (optionally for a specific extension) |
| `npx bike-ext package` | Package built extensions as `.bkext.zip` files |
| `npx bike-ext release <id>` | Create a GitHub release for an extension |
| `npx bike-ext submit <id>` | Submit extension to the registry via pull request |

## Project structure

After running `npx bike-ext new`, your project will look like:

```
my-extensions/
├── package.json
├── tsconfig.json          # Generated on first `npx bike-ext new`
├── configs/
│   ├── tsconfig.app.json
│   ├── tsconfig.dom.json
│   └── tsconfig.style.json
└── src/
    └── my-extension.bkext/
        ├── manifest.json
        ├── app/main.ts
        ├── dom/hello-world.ts
        ├── style/main.ts
        └── tests/extension.test.ts
```

## Extension contexts

- **App context** (`app/main.ts`) — Main logic, commands, keybindings, sidebar items
- **DOM context** (`dom/*.ts|tsx`) — Custom UI components using React
- **Style context** (`style/main.ts`) — Custom outline styling

## Examples

See these projects for example extensions built with this kit:

[Core Extension](https://github.com/bike-outliner/core-extensions) (Ship with Bike)
[Example Extensions](https://github.com/bike-outliner/example-extensions)

## Documentation

- [Creating Extensions](docs/creating-extensions.md) — overview, setup, and first extension
- [App Context Tutorial](docs/app-context-tutorial.md) — commands, keybindings, outline manipulation
- [DOM Context Tutorial](docs/dom-context-tutorial.md) — custom UI with sheets and React
- [Style Context Tutorial](docs/style-context-tutorial.md) — outline styling, decorations, themes
- [Testing Extensions](docs/testing-extensions.md) — writing and running tests
- [Sharing Extensions](docs/sharing-extensions.md) — packaging, releasing, and registry submission
- [API Reference](api/) — type definitions for all three contexts

