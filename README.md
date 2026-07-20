# @bike-outliner/extension-kit

Build tooling and API types for [Bike Outliner](https://www.hogbaysoftware.com/bike/) extensions.

- [API Reference](api/) — type definitions for all three contexts

## Requirements

- Node.js 20.11+
- Bike Outliner 2 for macOS

## Quick start

```sh
mkdir my-extensions && cd my-extensions
npm init -y
npm install --save-dev https://github.com/bike-outliner/extension-kit
npx bike-ext new my-extension
npx bike-ext build --install
```

You should now see a new extension in Bike named "My Extension".

## Updating

To update the `extension-kit` dependency in the future run:

```sh
npm install https://github.com/bike-outliner/extension-kit --save-dev
```

## Commands

| Command | Description |
|---------|-------------|
| `npx bike-ext new [id]` | Create a new extension from template (bootstraps project on first run) |
| `npx bike-ext build [id] [--install]` | Build extensions for production (all or specific) |
| `npx bike-ext watch [id] [--install]` | Build and watch for changes during development (all or specific) |
| `npx bike-ext test [id]` | Build, install, and run tests (all or specific) |
| `npx bike-ext package [id]` | Package built extensions as `.bkext.zip` files (all or specific) |
| `npx bike-ext release <id>` | Create a GitHub release for an extension |
| `npx bike-ext submit <id>` | Submit extension to the registry via pull request |
| `npx bike-ext clean` | Remove build output |

## Project structure

After running `npx bike-ext new my-extension` (above), your project will look like:

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
        ├── dom/protocols.ts
        ├── dom/hello-sheet.ts
        ├── style/main.ts
        ├── theme/default.bktheme
        └── tests/extension.test.ts
```

Note: The extension files in `my-extension.bkext` are generated to give a full
working example. The only file required is `manifest.json`, the rest can be
deleted. Many extensions might only have a `app/main.ts` file.

## Extension contexts

- **App context** (`app/main.ts`) — Main logic, commands, keybindings, sidebar items
- **DOM context** (`dom/*.ts|tsx`) — Custom UI components using React
- **Style context** (`style/main.ts`) — Custom outline styling

## Examples

See these projects for example extensions built with this kit:

- [Core Extensions](https://github.com/bike-outliner/core-extensions)
- [Example Extensions](https://github.com/bike-outliner/example-extensions)

## Documentation

- [Creating Themes](docs/creating-themes.md) — create a theme
- [Creating Extensions](docs/creating-extensions.md) — overview, setup, and first extension
- [App Context Tutorial](docs/app-context-tutorial.md) — commands, keybindings, outline manipulation
- [DOM Context Tutorial](docs/dom-context-tutorial.md) — custom UI with sheets and React
- [Style Context Tutorial](docs/style-context-tutorial.md) — outline styling, decorations, themes
- [Summary & Badges Tutorial](docs/summary-badges-tutorial.md) — subtree summaries and value-aware row badges
- [Filter Queries Tutorial](docs/filter-queries-tutorial.md) — labeled filter queries in the filter field autocomplete
- [Attachments Tutorial](docs/attachments-tutorial.md) — reading and displaying embedded file attachments
- [Testing Extensions Tutorial](docs/testing-extensions-tutorial.md) — writing and running tests
- [Sharing Extensions Tutorial](docs/sharing-extensions-tutorial.md) — packaging, releasing, and registry submission
- [Session Automation Reference](docs/session-automation.md) — the `bike` CLI (+MCP) and `bike.session` DOM API
- [API Reference](api/) — type definitions for all three contexts + CLI

