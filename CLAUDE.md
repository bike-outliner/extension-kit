# Extension Kit

Build tooling and API types for Bike Outliner extensions.

## Quick Reference

```bash
npm install                    # Install dependencies
npx bike-ext build             # Production build (typecheck + bundle + validate)
npx bike-ext watch             # Development mode with file watching
npx bike-ext new <id>          # Scaffold a new extension
npx bike-ext test              # Build, install, and run extension tests
npx bike-ext package           # Package extensions as .bkext.zip
npx bike-ext release <id>      # Create GitHub release
npx bike-ext submit <id>       # Submit extension to registry via PR
npx bike-ext clean             # Remove build output
npm run build-runtime          # Build React runtime (runtime/)
npm run watch-runtime          # Watch React runtime
npm run check-api              # Typecheck api/*.d.ts WITH lib check (this repo only)
```

Extension projects have no separate typecheck command — typechecking runs automatically during
`build` and `watch` via the `typecheckPlugin`.

`test` refuses to run when an extension that ships tests is disabled in Bike. Bike loads a disabled
extension but never runs it and never says so, so its tests are skipped while the summary still
reads `ALL TESTS PASSED` — a green suite for a repo whose tests never executed. `checkTestExtensionsEnabled`
in `lib/test.mjs` reads Bike's `bike.extensions.disabledIds` preference and fails first, naming the
extensions to enable.

`check-api` deliberately runs WITH lib check (`api/{app,dom,style}/tsconfig.json` don't set `skipLibCheck`), because here the `.d.ts` files are the product. Consumer projects force `skipLibCheck` (their `file:` symlink makes the api files appear twice). Run `check-api` after touching anything in `api/`; it is a required pre-release step (`hogbaycontext/workflows/release-checklist.md`).

## Project Structure

```
extension-kit/
├── api/                    # Type definitions for three extension contexts
│   ├── app/                #   App context (commands, keybindings, outline API)
│   ├── dom/                #   DOM context (React UI, components)
│   ├── style/              #   Style context (editor styling, decorations)
│   └── core/               #   Shared types (Json, OutlinePath, DOMProtocol, bike globals)
├── docs/                   # Extension development guides and tutorials
├── bin/bike-ext.mjs        # CLI dispatcher
├── lib/                    # Build tooling
│   ├── build.mjs           #   Main esbuild orchestration
│   ├── plugins.mjs         #   esbuild plugins (validate, typecheck, install)
│   ├── build-runtime.mjs   #   React runtime build
│   ├── typecheck.mjs       #   TypeScript compiler API wrapper
│   ├── new.mjs             #   Extension scaffolding
│   ├── package.mjs         #   ZIP packaging (uses ditto)
│   ├── release.mjs         #   GitHub release (uses gh CLI)
│   └── submit.mjs          #   Registry PR submission (uses gh CLI)
├── runtime/                # React runtime bundled into Bike.app
│   ├── common.ts           #   Exposes React/ReactDOM as window globals
│   ├── components.tsx      #   bike/components implementations
│   ├── format.ts           #   Shared formatting helpers
│   ├── value-codec.ts      #   bike.encodeValue/decodeValue wire codecs
│   ├── sheet.tsx           #   Sheet UI template
│   ├── inspector.tsx       #   Inspector UI template
│   ├── panel.tsx           #   Panel UI template (+ panel.html)
│   └── extensions-settings.tsx  # Extensions settings UI
├── schemas/                # manifest.schema.json, theme-schema.json
└── template/               # Scaffolded by `bike-ext new`
```

## Architecture

Extensions have up to three contexts, each with separate TypeScript configs and entry points:

| Context | Entry point | API import | Purpose |
|---------|-------------|------------|---------|
| **App** | `app/main.ts` | `bike/app` | Commands, keybindings, sidebar, outline manipulation |
| **DOM** | `dom/*.ts\|tsx` | `bike/dom` | React UI (sheets, panels, inspector items) |
| **Style** | `style/main.ts` | `bike/style` | Editor styling via declarative rule layers |

Each context is typechecked independently using its own tsconfig from `api/{context}/tsconfig.json`. Consumer projects get three configs in `configs/` that extend these.

App and DOM communicate via `postMessage`/`onmessage` on `DOMScriptHandle` (app side) and `DOMExtensionContext` (DOM side).

## Build Pipeline

`build.mjs` creates an esbuild context with four plugins from `plugins.mjs`:

1. **externalGlobalPlugin** — Maps `react`, `react-dom`, `bike/components` to `window.*` globals
2. **copyAndValidatePlugin** — Copies `manifest.json` and `.bktheme` files, validating both against their JSON schemas
3. **typecheckPlugin** — Runs `typecheckContexts()` for all three contexts plus any per-extension tsconfigs
4. **installExtensionPlugin** — Copies built extensions to Bike's Extensions directory; only added to the build when the `--install` flag is passed

Output format is IIFE bundles. Production uses external sourcemaps + minification; dev uses inline sourcemaps.

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
