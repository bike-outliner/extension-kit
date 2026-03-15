# Extension Kit

Build tooling and API types for Bike Outliner extensions.

## Quick Reference

```bash
npm install                    # Install dependencies
npx bike-ext build             # Production build (typecheck + bundle + validate)
npx bike-ext watch             # Development mode with file watching
npx bike-ext new <id>          # Scaffold a new extension
npx bike-ext package           # Package extensions as .bkext.zip
npx bike-ext release <id>      # Create GitHub release
npm run build-runtime          # Build React runtime (runtime/)
npm run watch-runtime          # Watch React runtime
```

There is no separate typecheck command — typechecking runs automatically during `build` and `watch` via the `typecheckPlugin`.

## Project Structure

```
extension-kit/
├── api/                    # Type definitions for three extension contexts
│   ├── app/                #   App context (commands, keybindings, outline API)
│   ├── dom/                #   DOM context (React UI, components)
│   ├── style/              #   Style context (editor styling, decorations)
│   └── core/               #   Shared types (Json, OutlinePath)
├── bin/bike-ext.mjs        # CLI dispatcher
├── lib/                    # Build tooling
│   ├── build.mjs           #   Main esbuild orchestration
│   ├── plugins.mjs         #   esbuild plugins (validate, typecheck, install)
│   ├── build-runtime.mjs   #   React runtime build
│   ├── typecheck.mjs       #   TypeScript compiler API wrapper
│   ├── new.mjs             #   Extension scaffolding
│   ├── package.mjs         #   ZIP packaging (uses ditto)
│   └── release.mjs         #   GitHub release (uses gh CLI)
├── runtime/                # React runtime bundled into Bike.app
│   ├── common.ts           #   Exposes React/ReactDOM as window globals
│   ├── sheet.tsx            #   Sheet UI template
│   └── inspector.tsx        #   Inspector UI template
├── schemas/manifest.schema.json
└── template/               # Scaffolded by `bike-ext new`
```

## Architecture

Extensions have up to three contexts, each with separate TypeScript configs and entry points:

| Context | Entry point | API import | Purpose |
|---------|-------------|------------|---------|
| **App** | `app/main.ts` | `bike/app` | Commands, keybindings, sidebar, outline manipulation |
| **DOM** | `dom/*.ts\|tsx` | `bike/dom` | React UI (sheets, inspector panels) |
| **Style** | `style/main.ts` | `bike/style` | Editor styling via declarative rule layers |

Each context is typechecked independently using its own tsconfig from `api/{context}/tsconfig.json`. Consumer projects get three configs in `configs/` that extend these.

App and DOM communicate via `postMessage`/`onmessage` on `DOMScriptHandle` (app side) and `DOMExtensionContext` (DOM side).

## Build Pipeline

`build.mjs` creates an esbuild context with four plugins from `plugins.mjs`:

1. **externalGlobalPlugin** — Maps `react`, `react-dom`, `bike/components` to `window.*` globals
2. **copyAndValidatePlugin** — Copies `manifest.json` files, validates `.bktheme` files against JSON schema
3. **typecheckPlugin** — Runs `typecheckContexts()` for all three contexts plus any per-extension tsconfigs
4. **installExtensionPlugin** — Copies built extensions to Bike.app's Extensions directory when `manifest.install === true`

Output format is IIFE bundles. Production uses external sourcemaps + minification; dev uses inline sourcemaps.

## Code Style

- 2-space indentation
- Single quotes
- Semicolons
- ES module imports (`import`/`export`)
- Build tooling files are `.mjs` (plain JavaScript)
- API type definitions are `.d.ts`
- `runtime/` uses `.ts` and `.tsx`

## Key Types

The style API types in `api/style/editor-style.d.ts` define the full styling system:

- `EditorStyle` — returned by `defineEditorStyle()`, has `layer()` method
- `StyleContext` — passed to all rule callbacks (theme, settings, viewport, caches)
- `RowStyle`, `TextRunStyle`, `CaretStyle`, `ViewportStyle` — style objects modified in rules
- `Decoration`, `Layout`, `LayoutValue` — visual decoration system

The `layer()` callback destructures as `(row, run, caret, viewport, include)` — all parameters are fully typed via the `EditorStyle` interface, so no type annotations are needed on the callback parameters.

## Extension Manifest

Validated by `schemas/manifest.schema.json`. Required fields: `version`, `api_version`, `permissions`, `host_permissions`. The extension ID is derived from the folder name (minus `.bkext`).

## Related Repos

This package is consumed by extension projects via `npm install --save-dev @bike-outliner/extension-kit`. The sibling repos `core-extensions/` and `example-extensions/` are consumers that use `bike-ext build` to compile.
