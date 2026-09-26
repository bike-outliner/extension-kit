# Creating Themes

Themes are `.bktheme` JSON files that set the colors, materials and typography
that [editor styles](style-context-tutorial.md) read.

- [Theme Schema](../schemas/theme-schema.json) — full schema reference

## Quick Start

Create a file called `my-theme.bktheme`:

```json
{
  "metadata": {
    "version": "1.0.0",
    "author": "Your Name",
    "appearance": "light"
  },
  "colors": {
    "text": "#333333",
    "background": "#fafafa"
  },
  "materials": {
    "editor": { "fill": "$background" }
  }
}
```

Put it in the folder that Bike > Settings > Appearance > Open Themes Folder…
opens, then choose it in that page's Light Theme popup. Themes reload on save.
Errors and warnings appear in Bike > Logs Explorer.

### `colors.background`

`colors.background` doesn't paint anything. Editor styles use it for contrast
and blending (e.g. selection). `materials.editor` paints the editor background.
Set `colors.background` to a color representative of that material, even if the
material is a gradient or system material.

## Theme Naming

The display name is the filename split on `-` and capitalized:
`solarized-light.bktheme` → "Solarized Light". In an extension it is prefixed
with the extension name: "Bike: Solarized Light".

## Theme Metadata

`metadata` is optional: `version`, `author`, `appearance`. `appearance` is
`"light"`, `"dark"` or `"any"` (default) and limits which mode offers the theme.
Paired light/dark themes are two files.

## Colors

`colors` holds semantic colors that Bike uses, plus custom colors of your own.

### Semantic Colors

```json
{
  "colors": {
    "text": "#657b83",
    "accent": "#268bd2",
    "background": "#fdf6e3",
    "caret": "#657b83",
    "caretLine": "rgba(0, 0, 0, 0.04)",
    "textBackgroundSelected": "rgba(38, 139, 210, 0.25)",
    "blockBackgroundSelected": "rgba(38, 139, 210, 0.15)",
    "findMatch": "rgba(181, 137, 0, 0.3)",
    "handle": "#93a1a1",
    "guideLine": "rgba(0, 0, 0, 0.1)",
    "focusArrow": "rgba(0, 0, 0, 0.4)",
    "spelling": "#dc322f",
    "grammar": "#859900"
  }
}
```

The [theme schema](../schemas/theme-schema.json) lists them all.

### Custom Colors and References

Any color value can reference another color in `colors` as `$name`:

```json
{
  "colors": {
    "base00": "#657b83",
    "base1": "#93a1a1",
    "base3": "#fdf6e3",
    "blue": "#268bd2",

    "text": "$base00",
    "accent": "$blue",
    "background": "$base3",
    "handle": "$base1"
  }
}
```

### Color Formats and Functions

| Format | Example |
|--------|---------|
| Hex | `#F00`, `#FF5500`, `#FF550080` |
| RGB/RGBA | `rgb(255, 128, 0)`, `rgba(255 128 0 / 50%)` |
| HSL/HSLA | `hsl(120, 100%, 50%)`, `hsla(120deg 100% 50% / 0.5)` |
| OKLab | `oklab(0.5 0.1 -0.1)` |
| OKLCH | `oklch(0.7 0.15 180)` |
| color-mix | `color-mix(in oklch, red, blue)` |
| color-contrast | `color-contrast($background vs black, white)` |
| light-dark | `light-dark(#fafafa, #222222)` |
| Relative colors | `rgb(from $accent r g b / calc(alpha * 0.5))` |
| macOS named | `text`, `accent`, `systemBlue`, `labelSecondary` |
| CSS named | `red`, `cornflowerblue`, `transparent` |

- macOS named colors adapt to light and dark mode.
- `light-dark(a, b)` uses `a` in light mode and `b` in dark mode.
- Relative colors (`rgb`, `hsl`, `oklab`, `oklch` with `from`): each channel
  and alpha takes the channel keyword, a literal, or a simple `calc`. Dynamic
  base colors stay dynamic.
- `color-mix` spaces: `srgb`, `hsl`, `oklab`, `oklch`, plus `okhsl` and `okhsv`
  (Ottosson's Oklab HSL/HSV, not CSS). Their lightness steps are even, where
  `oklch` ramps bunch up near white.
- `color-contrast(base vs a, b, …)` picks the candidate with the most contrast
  against `base`.
- Out-of-gamut colors are mapped into gamut by reducing chroma, keeping hue.

## Materials

A material paints a window area. It has optional `fill`, `borders` and
`cornerRadius`; without `fill` the area paints nothing.

```json
{
  "materials": {
    "editorPane": {
      "fill": "textBackground",
      "cornerRadius": { "topLeading": 8 },
      "borders": {
        "top": "separator",
        "leading": "separator"
      }
    }
  }
}
```

### Fills

A fill is a color, gradient, glass, system material, or active/inactive pair.

#### Colors

```json
{
  "materials": {
    "window": { "fill": "#fdf6e3" },
    "editor": { "fill": "$background" }
  }
}
```

#### Gradients


```json
{
  "materials": {
    "editor": {
      "fill": {
        "type": "linear",
        "angle": 180,
        "stops": [
          { "color": "white", "position": 0 },
          { "color": "$primary", "position": 1 }
        ]
      }
    }
  }
}
```

Stops run from 0 to 1. Linear `angle` is in degrees (0 = top to bottom, 90 =
left to right). `"type": "radial"` takes `centerX` and `centerY` (0 to 1).

#### Glass

`style` is `"clear"` or `"regular"` (more opaque). `tintColor` is optional.

```json
{
  "materials": {
    "sidebar": {
      "fill": {
        "type": "glass",
        "style": "regular",
        "tintColor": "$accent"
      }
    }
  }
}
```

#### System


```json
{
  "materials": {
    "titlebar": {
      "fill": {
        "type": "system",
        "style": "titlebar",
        "followsActive": true
      }
    }
  }
}
```

`style` is `"header"`, `"titlebar"` or `"windowBackground"`. `followsActive`
changes the material when the window is inactive. `opacity` is 0 to 1.

#### Active

Chooses a fill by window state:

```json
{
  "materials": {
    "window": {
      "fill": {
        "type": "active",
        "active": "$panel",
        "inactive": "$inactivePanel"
      }
    }
  }
}
```

### Borders

1pt colors per edge: `top`, `bottom`, `leading`, `trailing`. Set a shared
edge on one side only, or the strokes stack to 2pt.

### Corner Radius

A number sets all corners. An object sets `topLeading`, `topTrailing`,
`bottomLeading`, `bottomTrailing` (omitted = 0). Borders follow the corners.
Borders and corners at the window's outer edge are suppressed.

### Material Targets

- `window` — the overall window background
- `titlebar` — the title bar area
- `sidebar` — the sidebar panel
- `editorPane` — the pane containing the editor toolbar, editor, panel, and status bar
- `editorToolbar` — the toolbar at the top of the editor pane
- `editor` — the editor text area
- `editorPanel` — the bottom panel (find, spell check)
- `editorStatusBar` — the status bar
- `inspector` — the inspector panel

## Rows

`rows` styles row types. Each accepts `color`, `backgroundColor`, `fontFamily`,
`fontAdjust`, `fontWeight`, `fontTraits`, `underline` and `strikethrough`.

```json
{
  "rows": {
    "body": {
      "color": "$text"
    },
    "heading": {
      "color": "$orange",
      "fontWeight": "semibold"
    },
    "codeblock": {
      "color": "$green",
      "backgroundColor": "$base2",
      "fontFamily": "SF Mono",
      "fontTraits": ["monospace"]
    }
  }
}
```

- `fontAdjust` multiplies the base font size (`1.5`, `0.85`).
- `fontWeight`: `ultraLight`, `thin`, `light`, `regular`, `medium`, `semibold`,
  `bold`, `heavy`, `black`.
- `fontTraits`: `italic`, `bold`, `expanded`, `condensed`, `monospace`.

## Runs

`runs` styles inline formatting with the same properties as rows.

```json
{
  "runs": {
    "strong": {
      "fontWeight": "semibold"
    },
    "emphasis": {
      "fontTraits": ["italic"]
    },
    "link": {
      "color": "$blue",
      "underline": {
        "single": true
      }
    }
  }
}
```

### Underline and Strikethrough Options


```json
{
  "underline": {
    "color": "$accent",
    "single": true,
    "patternDash": true,
    "byWord": true
  }
}
```

Weight: `single`, `thick`, `double`. Pattern: `patternDot`, `patternDash`,
`patternDashDot`, `patternDashDotDot`. `byWord` skips spaces.

## Extension Themes

Themes in an extension's `theme/` folder install with it, and the extension
registry can distribute them:

```
my-extension.bkext
├── manifest.json
├── theme/
│   ├── my-light-theme.bktheme
│   └── my-dark-theme.bktheme
```

See [Creating Extensions](creating-extensions.md).

## Resources

- [Solarized](https://github.com/bike-outliner/core-extensions/blob/main/src/bike.bkext/theme/solarized.bktheme) — a complete theme example
- [Theme Schema](../schemas/theme-schema.json) — full property reference
