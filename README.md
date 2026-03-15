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
| `bike-ext new [id]` | Create a new extension from template (bootstraps project on first run) |
| `bike-ext build` | Build all extensions for production |
| `bike-ext watch` | Build and watch for changes during development |
| `bike-ext package` | Package built extensions as `.bkext.zip` files |
| `bike-ext release <id>` | Create a GitHub release for an extension |

## Project structure

After running `bike-ext new`, your project will look like:

```
my-extensions/
├── package.json
├── tsconfig.json          # Generated on first `bike-ext new`
├── configs/
│   ├── tsconfig.app.json
│   ├── tsconfig.dom.json
│   └── tsconfig.style.json
└── src/
    └── my-extension.bkext/
        ├── manifest.json
        ├── app/main.ts
        ├── dom/hello-world.ts
        └── style/main.ts
```

## Extension contexts

- **App context** (`app/main.ts`) — Main logic, commands, keybindings, sidebar items
- **DOM context** (`dom/*.ts|tsx`) — Custom UI components using React
- **Style context** (`style/main.ts`) — Custom styling

## Next steps

To learn more see [Creating Extensions](https://bikeguide.hogbaysoftware.com/bike-2-preview/customizing-bike/creating-extensions) in Bike's user guide.

