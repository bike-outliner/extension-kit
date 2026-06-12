# Creating Themes

Themes customize the colors, materials, and typography of Bike's interface. They
are JSON files with the `.bktheme` extension. `//` and `/* ... */` comments are
allowed. Themes are configuration files for the more complex
[editor styles](style-context-tutorial.md).

- [Theme Schema](../schemas/theme-schema.json) — full feature reference

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

Bike loads themes from its themes folder.

Use Bike > Settings > Appearance > Open Themes Folder… to open it in the Finder.
Place your `my-theme.bktheme` file there. It will then appear in the Light Theme
popup in that same settings page.

Once selected in the popup, your theme is active and you should see the text
color and editor background change. Themes are live-reloaded as you edit them,
so make changes and your outline editor should update immediatly when you save.

Note: As you develop your theme, you should keep Bike > Logs Explorer open to
see any errors or warnings about your theme.

### Editor Styles vs Themes

Themes are a higher-level way to customize the look of Bike, while editor styles
provide more fine-grained control. A theme defines a palette of colors and
materials, and then editor styles reference those colors and materials to style
specific parts of the editor.

### Special case: `colors.background` property

The `colors.background` property is a semantic color — it is used by the editor
style for contrast and blending calculations (e.g. selection highlighting), but
it does not paint the editor's visual background. To change the editor
background, set `materials.editor` instead. Materials are more expressive than a
flat color — they support flat colors, but also gradients, and system materials.

You will generally want to set `colors.background` to a color that represents
the `editor` material, even if that material is not a flat color. This ensures
that text and other elements that use the `background` color for contrast
calculations will still work correctly.

## Theme Naming

The theme's display name is derived from its filename. The filename (without
`.bktheme`) is split on `-` and each word is capitalized:

- `my-theme.bktheme` → "My Theme"
- `solarized-light.bktheme` → "Solarized Light"

When a theme is included in an extension, its display name is prefixed with the
extension name. For example, `solarized-light.bktheme` in `bike.bkext` appears
as "Bike Solarized Light".

## Theme Metadata

The `metadata` section provides optional information about your theme:

```json
{
  "metadata": {
    "version": "1.0.0",
    "author": "Hog Bay Software",
    "appearance": "light"
  }
}
```

The `appearance` field controls when the theme is available:
- `"light"` — Theme only available when Bike is in light mode
- `"dark"` — Theme only available when Bike is in dark mode
- `"any"` — Theme available in both modes (the default if omitted)

If you are creating paired light/dark themes, make two separate `.bktheme`
files with the appropriate appearance set for each.

## Colors

The `colors` section defines colors used throughout the theme. There are two
kinds of colors: semantic colors that Bike uses directly, and custom colors
that you define for your own use.

### Semantic Colors

Semantic colors control specific parts of the UI, such as `text` used above.
Set the ones you want to change:

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

See the [theme schema](../schemas/theme-schema.json) for the full list of
semantic colors and their descriptions.

### Custom Colors and References

You can define custom colors and reference them elsewhere using the `$name`
syntax. This keeps your palette in one place:

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

Any color property in the theme can use a `$reference` to a color defined in
this section.

### Color Formats and Functions

Themes support multiple color formats and functions:

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

The macOS named colors adapt automatically to light and dark mode.

The `light-dark` function picks the first color in light mode and the second in
dark mode.

Relative color syntax (`rgb(from ...)`, also `hsl`, `oklab`, `oklch`) derives a
new color from a base color. Each channel and the alpha slot accepts the
channel keyword (passthrough), a literal value, or a simple calc like
`calc(alpha * 0.5)`. Dynamic base colors stay dynamic — the transform is
applied per appearance.

The `color-mix` function blends two colors together. You can reference custom
colors in the mix:

```json
{
  "colors": {
    "primary": "#3498db",
    "highlight": "color-mix(in oklch, $primary 70%, white)"
  }
}
```

The `color-contrast` function selects the color with the highest contrast
against a base color, useful for ensuring readability:

```json
{
  "colors": {
    "background": "#fdf6e3",
    "autoText": "color-contrast($background vs black, white)"
  }
}
```

## Materials

Materials control the visual surface of different areas of the window. A
material is an object with an optional `fill`, `borders`, and `cornerRadius`.
If `fill` is omitted the area paints nothing — useful for borders-only
materials, or to let the area behind show through.

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

A fill is a color, gradient, glass effect, system material, or active/inactive
pair.

#### Colors

The simplest fill is a color:

```json
{
  "materials": {
    "window": { "fill": "#fdf6e3" },
    "editor": { "fill": "$background" }
  }
}
```

#### Gradients

Linear and radial gradients use color stops positioned from 0 to 1:

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

For linear gradients, `angle` specifies the direction in degrees (0 = top to
bottom, 90 = left to right). For radial gradients, use `"type": "radial"` with
`centerX` and `centerY` (0 to 1) to position the center.

#### Glass

Glass fills create a translucent, blurred effect. Use `"clear"` for more
transparency or `"regular"` for a more opaque look. An optional `tintColor`
shifts the hue:

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

System fills use macOS native appearances:

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

The `style` can be `"header"`, `"titlebar"`, or `"windowBackground"`. Set
`followsActive` to `true` if the material should change when the window becomes
inactive. Use `opacity` (0 to 1) to adjust the material's opacity.

#### Active

An active fill selects between two fills based on window state:

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

Per-edge 1pt border colors: `top`, `bottom`, `leading`, `trailing`. Only one
side of a shared edge should set a color, otherwise the strokes stack into a
2pt line.

### Corner Radius

A number applies to all four corners. An object sets per-corner radii using
`topLeading`, `topTrailing`, `bottomLeading`, and `bottomTrailing` (omitted
corners are 0). Borders follow the rounded corners.

Borders and corners on edges that sit at the window's outer boundary are
suppressed automatically.

### Material Targets

You can set materials for these window areas:

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

The `rows` section styles different row types. Each row type supports `color`,
`backgroundColor`, `fontFamily`, `fontAdjust`, `fontWeight`, `fontTraits`,
`underline`, and `strikethrough`.

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
    "note": {
      "color": "$secondaryText",
      "fontTraits": ["italic"]
    },
    "blockquote": {
      "color": "$cyan",
      "fontTraits": ["italic"]
    },
    "codeblock": {
      "color": "$green",
      "backgroundColor": "$base2",
      "fontFamily": "SF Mono",
      "fontTraits": ["monospace"]
    },
    "task": {
      "color": "$text"
    },
    "orderedList": {
      "color": "$text"
    },
    "unorderedList": {
      "color": "$text"
    },
    "horizontalRule": {
      "color": "$base1"
    }
  }
}
```

The `fontAdjust` property is a multiplier relative to the base font size. Use
`1.5` to make headings 50% larger, or `0.85` to make notes slightly smaller.

The `fontWeight` values are: `ultraLight`, `thin`, `light`, `regular`,
`medium`, `semibold`, `bold`, `heavy`, `black`.

The `fontTraits` array can include: `italic`, `bold`, `expanded`, `condensed`,
`monospace`.

## Runs

The `runs` section styles inline text formatting. It uses the same properties
as rows.

```json
{
  "runs": {
    "strong": {
      "fontWeight": "semibold"
    },
    "emphasis": {
      "fontTraits": ["italic"]
    },
    "strikethrough": {
      "color": "$secondaryText",
      "strikethrough": {
        "single": true
      }
    },
    "code": {
      "color": "$magenta",
      "fontFamily": "SF Mono",
      "fontTraits": ["monospace"],
      "backgroundColor": "$base2"
    },
    "mark": {
      "backgroundColor": "rgba(181, 137, 0, 0.25)"
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

The `underline` and `strikethrough` properties accept an object with line
styling options:

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

Available options: `single`, `thick`, `double` for line weight, and
`patternDot`, `patternDash`, `patternDashDot`, `patternDashDotDot` for
patterns. Set `byWord` to apply the line only under words, skipping spaces.

## Extension Themes

Themes can also be included in extensions, allowing you to bundle custom themes
with your extension's functionality. Or enabling you to publish you theme in the
extension registry, making it easy for users to discover and install your theme
directly from Bike.

Place `.bktheme` files in the `theme/` folder of your extension:

```
my-extension.bkext
├── manifest.json
├── theme/
│   ├── my-light-theme.bktheme
│   └── my-dark-theme.bktheme
```

Themes are loaded directly from extension bundles — they are not copied. In
Bike's theme menus, extension themes appear prefixed with the extension name.
For example, `solarized-light.bktheme` in `bike.bkext` appears as "Bike
Solarized Light". See [Creating Extensions](creating-extensions.md) for more on
building and installing extensions.

## Resources

- [Theme Schema](../schemas/theme-schema.json) — full property reference
- [Style Context Tutorial](style-context-tutorial.md) — for more advanced styling with code
- [Solarized Light](https://github.com/bike-outliner/core-extensions/blob/main/src/bike.bkext/theme/solarized-light.bktheme) — a complete theme example
