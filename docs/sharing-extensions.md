# Sharing Extensions

Once your extension is working locally, you can package it for distribution and
list it in the Bike extensions registry so other users can install it from
Settings > Extensions > Browse.

## 1. Package

Build your extensions, then create ZIP files ready for distribution:

```sh
npx bike-ext build
npx bike-ext package
```

This creates a `.bkext.zip` for each extension in `out/packages/`.

## 2. Create a GitHub Release

Release a single extension using the `release` command. It reads the version
from the extension's `manifest.json` and creates a GitHub Release tagged
`<id>-v<version>` with the ZIP attached.

This requires the [`gh` CLI](https://cli.github.com) to be installed and
authenticated (`gh auth login`).

```sh
npx bike-ext release calendar   # creates release "calendar-v1.0.0"
npx bike-ext release d3         # creates release "d3-v2.1.0"
```

Each extension is released independently with its own version. The download
URL for the attached ZIP asset is what you'll provide to the registry.

## 3. Submit to the Registry

Submit your extension to the
[extensions-registry](https://github.com/jessegrosjean/bike-extensions)
so users can discover and install it from within Bike:

```sh
npx bike-ext submit calendar   # opens a PR to add/update the registry entry
```

This forks the registry repo (if needed), adds your extension's entry to
`extensions.json`, and opens a pull request — all automatically.

Alternatively, you can manually fork the registry, edit `extensions.json`, and
open a PR yourself. See that repo's README for the entry format.