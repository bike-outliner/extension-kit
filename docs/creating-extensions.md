# Creating Extensions

Extensions add commands, views, styles and themes. Sensitive APIs require
manifest permissions. Start with the [README](../README.md) quick start.

## Structure

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

`manifest.json` holds the version, permissions and other metadata; see
[schemas/manifest.schema.json](../schemas/manifest.schema.json). The id and
display name come from the `.bkext` folder name. It is the only required file.

Each other folder is a separate context with its own API. Delete the folders
you don't use.

### App Context

- `import { … } from 'bike/app'`
- Commands, keybindings, outlines, clipboard, networking.
- Some APIs need manifest permissions (`clipboardRead`, `clipboardWrite`, `openURL`, `keychain`).

### DOM Context

- `import { … } from 'bike/dom'`
- Sandboxed web views (no network access), presented from the app context.
- Reaches outlines through `bike.session` or messages to the app context.

### Style Context

- `import { … } from 'bike/style'`
- Outline editor styles: rules match outline paths and set style properties.

### Tests and Themes

- `tests/*.test.ts` run in the app context. See [Testing Extensions](testing-extensions-tutorial.md).
- `theme/*.bktheme` appear in Bike's theme menus. See [Creating Themes](creating-themes.md).

App and DOM contexts exchange messages with `postMessage`/`onmessage`, typed by
`dom/protocols.ts`.

## Development

Open the `my-extensions` folder itself in VS Code, not an individual extension
folder, so type checking works.

| Command | Result |
|---------|--------|
| `npx bike-ext new <id>` | Creates `src/<id>.bkext` from the template. |
| `npx bike-ext build <id>` | Typechecks and bundles into `out/`. Bike loads only built extensions. |
| `npx bike-ext build <id> --install` | Also copies to `~/Library/Containers/com.hogbaysoftware.Bike/Data/Library/Application Support/Bike/Extensions`; Bike reloads it. |
| `npx bike-ext watch <id> --install` | Rebuilds and reinstalls on save. The tutorials assume this is running. |

### Debugging

- **Logs:** Bike > Logs Explorer shows install, activation, `console.log` output
  and errors.
- **Safari debugger:** enable Safari > Settings > Advanced > "Show features for
  web developers", then Safari > Develop > Inspect Apps and Devices lists
  Bike's JavaScript contexts. Select one to set breakpoints.
- **Automation:** the `bike` CLI (and `bike mcp` for AI agents) reads editor and
  outline state, performs commands, and evaluates app context scripts. See
  [Session Automation](session-automation.md).

```sh
bike get commands
echo 'bike.version' | bike evaluate script --file -
echo '(input) => bike.version + ": " + input' | bike evaluate script --file - --input "Hello"
```

`evaluate script` runs plain JavaScript (no TypeScript or `import`; use
`require('bike/app')`). Promise results are awaited.

## Next Steps

- [App Context Tutorial](app-context-tutorial.md)
- [DOM Context Tutorial](dom-context-tutorial.md)
- [Style Context Tutorial](style-context-tutorial.md)
- [Testing Extensions Tutorial](testing-extensions-tutorial.md)
- [Sharing Extensions Tutorial](sharing-extensions-tutorial.md)