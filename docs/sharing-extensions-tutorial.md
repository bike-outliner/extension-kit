# Sharing Extensions Tutorial

Once your extension is working, you can package it for distribution and list it
in the Bike extensions registry so other users can install it from Settings >
Extensions > Browse.

## Package Extesion

Build your extensions, then create ZIP files ready for distribution:

```sh
npx bike-ext build my-extension
npx bike-ext package my-extension
```

This creates a `.bkext.zip` for the extension `out/packages/`.

## Create a GitHub Release for the Extension

Release a single extension using the `release` command. It reads the version
from the extension's `manifest.json` and creates a GitHub Release tagged
`<id>-v<version>` with the ZIP attached.

This requires the [`gh` CLI](https://cli.github.com) to be installed and
authenticated (`gh auth login`).

```sh
npx bike-ext release my-extension   # creates release "my-extension-v0.1.0"
```

You can have multiple extensions in the same repository, but each extension is
released independently with its own version. The download URL for the attached
ZIP asset is what you'll provide to the registry.

## Submit the Extension to Bike's Extension Registry

Submit your extension to the
[extensions-registry](https://github.com/bike-outliner/extensions-registry)
so users can discover and install it from within Bike:

```sh
npx bike-ext submit my-extension   # opens a PR to add/update the registry entry
```

This forks the registry repo (if needed), adds your extension's entry to
`extensions.json`, and opens a pull request — all automatically.

Alternatively, you can manually fork the registry, edit `extensions.json`, and
open a PR yourself. See that repo's README for the entry format.