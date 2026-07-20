import { Insets, Size, Path, LineCap, LineJoin, FillRule } from './geometry'
import { SFSymbolName } from './bike-globals'

/** Opaque cache passed to `resolve()` methods by the styling system. */
export interface Cache {}

/** Image - Used for Decoration content */
export class Image {
  static none(): Image
  static fromText(text: Text): Image
  static fromShape(shape: Shape): Image
  static fromSymbol(symbol: SymbolConfiguration): Image

  constructor(name: string)

  withSize(size: Size): Image
  withScale(scale: number): Image
  withComposite(image: Image): Image
  /**
   * @returns A new image drawn over a rounded-rect backdrop sized to this
   * image plus the background's padding
   */
  withBackground(background: ImageBackground): Image
  resolve(cache: Cache): {
    width: number
    height: number
  }
}

/**
 * A rounded-rect fill/border drawn behind an image by
 * {@link Image.withBackground}, sized to the image plus `padding` — so
 * content that can't be measured in the extension (text, symbols) never
 * needs explicit backdrop dimensions.
 */
export interface ImageBackground {
  /** Backdrop fill color. */
  fill?: Color
  /** Border color. */
  stroke?: Color
  /** Border line width, drawn inside the backdrop bounds (default 1). */
  strokeWidth?: number
  /** Corner radius, clamped to half the smaller dimension (default 0). */
  cornerRadius?: number
  /** Space around the image: one number for all edges, or per-edge Insets (default 0). */
  padding?: number | Insets
}

/**
 * Text - Text with a font, color, and string. Use as decoration image content.
 */
export class Text {
  font: Font
  color: Color
  string: string
  constructor(string: string, font?: Font, color?: Color)
}

/**
 * Shape - Path with stroke and color. Use as decoration image content.
 */
export class Shape {
  path: Path
  line: ShapeLine
  fill: ShapeFill
  stroke: ShapeStroke
  padding: Insets
  constructor(path: Path)
}

export interface ShapeLine {
  cap: LineCap
  dashPattern?: number[]
  dashPhase: number
  join: LineJoin
  width: number
  miterLimit: number
}

export interface ShapeFill {
  color: Color
  rule: FillRule
}

export interface ShapeStroke {
  color: Color
  start: number
  end: number
}

/**
 * SymbolConfiguration – Wraps NSImage.SymbolConfiguration. Use as decoration
 * image content
 */
export class SymbolConfiguration {
  constructor(name: SFSymbolName, variableValue?: number)

  withFont(font: Font): SymbolConfiguration
  withSymbolScale(scale: SymbolScale): SymbolConfiguration
  withHierarchicalColor(color: Color): SymbolConfiguration
  withPaletteColors(colors: Color[]): SymbolConfiguration
  preferringMonochrome(): SymbolConfiguration
  preferringMulticolor(): SymbolConfiguration
  preferringHierarchical(): SymbolConfiguration
  /** @deprecated Misspelling kept for compatibility — use `preferringMonochrome`. */
  preferingMonochrome(): SymbolConfiguration
  /** @deprecated Misspelling kept for compatibility — use `preferringMulticolor`. */
  preferingMulticolor(): SymbolConfiguration
  /** @deprecated Misspelling kept for compatibility — use `preferringHierarchical`. */
  preferingHierachical(): SymbolConfiguration
}

/** SymbolScale – Use font for symbol size, then adjust with symbol scale */
export type SymbolScale = 'small' | 'medium' | 'large'

/**
 * Font - Wraps a `NSFontDescriptor`.
 *
 * This class can be a bit mysterious to work with. You are creating a
 * description of a font that you want, but sometimes that described font might
 * not exist. For example the following font might surprise:
 *
 * ```
 * new Font("Helvetica", 24).withMonospace()
 * ```
 *
 * You will likely get Helvetica at 24 points. The `withMonospaced` call will
 * have no effect because there isn't a monospaced version of Helvetica on your
 * computer.
 *
 * Generally if you are confused look into how `NSFontDescriptor` works. This is
 * a light wrapper around that class.
 */
export class Font {
  static systemBody(): Font
  static systemCallout(): Font
  static systemCaption1(): Font
  static systemCaption2(): Font
  static systemFootnote(): Font
  static systemHeadline(): Font
  static systemSubheadline(): Font
  static systemLargeTitle(): Font
  static systemTitle1(): Font
  static systemTitle2(): Font
  static systemTitle3(): Font

  /**
   * @param name Font family, e.g. "Helvetica"
   * @param pointSize e.g. 12
   */
  constructor(name: string, pointSize: number)

  withFamily(family: string): Font

  withFace(face: string): Font

  withPointSize(pointSize: number): Font

  /**
   * Multiply the point size by a factor — relative sizing when the base's
   * absolute size isn't knowable (e.g. a badge's `env.font`).
   * @param scale - The point size multiplier, ex. 0.8
   * @returns A new font with the scaled point size
   */
  withScale(scale: number): Font

  withWeight(weight: FontWeight): Font

  withBold(): Font

  withItalics(): Font

  withMonospace(): Font

  withSmallCaps(): Font

  withLowercaseSmallCaps(): Font

  withUppercaseSmallCaps(): Font

  withMonospacedDigit(): Font

  withFractions(): Font

  withSlashedZero(): Font

  /** Oldstyle (lowercase) figures */
  withOldstyleFigures(): Font

  /** Lining (uppercase) figures */
  withLiningFigures(): Font

  withSuperscript(): Font

  withSubscript(): Font

  withOrdinals(): Font

  /**
   * Enable an OpenType stylistic set (ss01–ss20). Out-of-range values are ignored.
   * @param n - The stylistic set number (1–20)
   * @returns A new font with the stylistic set enabled
   */
  withStylisticSet(n: number): Font

  resolve(cache: Cache): FontAttributes
}

export type FontAttributes = {
  name: string
  pointSize: number
  ascender: number
  descender: number
  xHeight: number
  xWidth: number
  maximumAdvancement: Size
  uiScale: number // Size relative to the 14pt baseline
}

/** FontWeight */
export type FontWeight =
  | 'ultraLight'
  | 'thin'
  | 'light'
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'heavy'
  | 'black'

/** Color space for mixing operations */
export type ColorSpace = 'srgb' | 'hsl' | 'oklab' | 'oklch'

/** WCAG contrast targets */
export type ContrastTarget = 'aa' | 'aaLarge' | 'aaa' | 'aaaLarge' | number

/** Color - Wraps an underlying CGColor. */
export class Color {
  static none(): Color
  static black(): Color
  static white(): Color
  static clear(): Color

  static text(): Color
  static textHeader(): Color
  static textBackground(): Color
  static textBackgroundSelected(): Color
  static contentBackgroundSelected(): Color
  static contentBackgroundSelectedUnemphasized(): Color
  static windowBackground(): Color

  static label(): Color
  static labelSecondary(): Color
  static labelTertiary(): Color
  static labelQuaternary(): Color
  static labelQuinary(): Color

  static systemFill(): Color
  static systemFillSecondary(): Color
  static systemFillTertiary(): Color
  static systemFillQuaternary(): Color
  static systemFillQuinary(): Color

  static link(): Color
  static accent(): Color
  static shadow(): Color
  static separator(): Color
  static highlight(): Color
  static findHighlight(): Color
  static insertionPoint(): Color

  static systemBlue(): Color
  static systemBrown(): Color
  static systemCyan(): Color
  static systemGray(): Color
  static systemGreen(): Color
  static systemIndigo(): Color
  static systemMint(): Color
  static systemOrange(): Color
  static systemPink(): Color
  static systemPurple(): Color
  static systemRed(): Color
  static systemTeal(): Color
  static systemYellow(): Color

  /**
   * @param white 0-1
   */
  static gray(white: number): Color

  /**
   * Create color from HSL (hue, saturation, lightness all 0-1)
   * @param hue 0-1
   * @param saturation 0-1
   * @param lightness 0-1
   * @param alpha 0-1
   */
  static hsla(hue: number, saturation: number, lightness: number, alpha?: number): Color

  /**
   * Create color in OKLab perceptually uniform space (l: 0-1, a/b: ~-0.4 to 0.4)
   * @param l 0-1
   * @param a ~-0.4 to 0.4
   * @param b ~-0.4 to 0.4
   * @param alpha 0-1
   */
  static oklab(l: number, a: number, b: number, alpha?: number): Color

  /**
   * Create color in OKLch perceptually uniform space (l: 0-1, c: 0-0.4, h: 0-1)
   * @param l 0-1
   * @param c 0-0.4
   * @param h 0-1
   * @param alpha 0-1
   */
  static oklch(l: number, c: number, h: number, alpha?: number): Color

  /**
   * Pick a color based on the current appearance (light vs dark mode).
   * Resolves to `light` in light appearance and `dark` in dark appearance,
   * automatically updating when the system appearance changes.
   * @param light - The color to use in light mode
   * @param dark - The color to use in dark mode
   */
  static lightDark(light: Color, dark: Color): Color

  /**
   * @param image Tile pattern image used when filling
   */
  static pattern(image: Image): Color

  /**
   * @param red 0-1
   * @param green 0-1
   * @param blue 0-1
   * @param alpha 0-1
   */
  constructor(red: number, green: number, blue: number, alpha?: number)

  /**
   * Replace alpha with `value` (0-1). Result alpha is clamped to [0, 1].
   */
  alphaSet(value: number): Color

  /**
   * Add `amount` to alpha. Positive opacifies, negative fades. Clamped to [0, 1].
   */
  alphaOffset(amount: number): Color

  /**
   * Multiply alpha by `factor`. Clamped to [0, 1].
   */
  alphaMultiplied(factor: number): Color

  /**
   * Bump oklch lightness by `amount` (typical range 0–1). Negative values darken.
   */
  lightened(amount: number): Color

  /**
   * Drop oklch lightness by `amount`. Equivalent to `lightened(-amount)`.
   */
  darkened(amount: number): Color

  /**
   * Multiply oklch chroma by `factor`. Values > 1 increase saturation.
   */
  saturated(factor: number): Color

  /**
   * Divide oklch chroma by `factor`. Equivalent to `saturated(1 / factor)`.
   */
  desaturated(factor: number): Color

  /**
   * Rotate oklch hue by `degrees`. Wraps modulo 360°.
   */
  hueShifted(degrees: number): Color

  /**
   * Mix this color with another (CSS color-mix).
   * @param fraction - Mix amount (0 = this, 1 = color)
   * @param colorSpace Color space for mixing (default oklab)
   */
  mixed(color: Color, fraction: number, colorSpace?: ColorSpace): Color

  /**
   * Select best contrasting color from candidates (CSS color-contrast).
   * @param target - WCAG target or custom ratio
   */
  contrasted(candidates: Color[], target?: ContrastTarget): Color

  resolve(cache: Cache): {
    alpha: number
    pattern?: Image
    components?: {
      red: number
      green: number
      blue: number
    }
  }
}
