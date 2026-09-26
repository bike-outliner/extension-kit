import { Insets, Size, Path, LineCap, LineJoin, FillRule } from './geometry'
import { SFSymbolName } from './bike-globals'

/** Opaque cache passed to `resolve()` methods by the styling system. */
export interface Cache {}

/** Decoration content. */
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
   * Places `image` to the right, vertically centered. {@link Image.withComposite}
   * overlays instead.
   * @param spacing Default 0.
   */
  withHStack(image: Image, spacing?: number): Image
  withBackground(background: ImageBackground): Image
  resolve(cache: Cache): {
    width: number
    height: number
  }
}

/** Rounded rect drawn behind an image, sized to the image plus `padding`. */
export interface ImageBackground {
  fill?: Color
  stroke?: Color
  /** Drawn inside the bounds. Default 1. */
  strokeWidth?: number
  /** Clamped to half the smaller dimension. Default 0. */
  cornerRadius?: number
  /** Default 0. */
  padding?: number | Insets
}

export class Text {
  font: Font
  color: Color
  string: string
  constructor(string: string, font?: Font, color?: Color)
}

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

/** Wraps `NSImage.SymbolConfiguration`. */
export class SymbolConfiguration {
  constructor(name: SFSymbolName, variableValue?: number)

  withFont(font: Font): SymbolConfiguration
  withSymbolScale(scale: SymbolScale): SymbolConfiguration
  withHierarchicalColor(color: Color): SymbolConfiguration
  withPaletteColors(colors: Color[]): SymbolConfiguration
  preferringMonochrome(): SymbolConfiguration
  preferringMulticolor(): SymbolConfiguration
  preferringHierarchical(): SymbolConfiguration
}

/** Adjusts symbol size relative to its font. */
export type SymbolScale = 'small' | 'medium' | 'large'

/**
 * Wraps `NSFontDescriptor`. Missing bold/italic faces are synthesized; missing
 * monospace substitutes the system monospaced face unless a family is set with
 * {@link Font.withFace} or {@link Font.withFamily}; unsupported OpenType
 * features are silently ignored. {@link Font.resolve} reports which happened.
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

  /** @param name Font family, e.g. "Helvetica". */
  constructor(name: string, pointSize: number)

  withFamily(family: string): Font

  withFace(face: string): Font

  withPointSize(pointSize: number): Font

  /** Multiplies the point size. */
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

  /** Lowercase figures. */
  withOldstyleFigures(): Font

  /** Uppercase figures. */
  withLiningFigures(): Font

  withSuperscript(): Font

  withSubscript(): Font

  withOrdinals(): Font

  /** OpenType `ss01`–`ss20`. Out-of-range `n` is ignored. */
  withStylisticSet(n: number): Font

  resolve(cache: Cache): FontAttributes
}

export type FontAttributes = {
  name: string
  family: string
  pointSize: number
  ascender: number
  descender: number
  xHeight: number
  xWidth: number
  maximumAdvancement: Size
  /** No bold face; weight faked by stroking glyphs. */
  synthesizedBold: boolean
  /** No italic face; slant faked by shearing. */
  synthesizedOblique: boolean
  /** No monospaced variant; the system monospaced face was used. */
  substitutedMonospace: boolean
  /** Size relative to 14pt. */
  uiScale: number
}

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

/**
 * `srgb`, `hsl`, `oklab`, `oklch` match CSS `color-mix()`. `okhsl` and `okhsv`
 * are Ottosson's Oklab-based HSL/HSV (not CSS).
 */
export type ColorSpace = 'srgb' | 'hsl' | 'oklab' | 'oklch' | 'okhsl' | 'okhsv'

/** WCAG level or a custom ratio. */
export type ContrastTarget = 'aa' | 'aaLarge' | 'aaa' | 'aaaLarge' | number

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

  /** @param white 0-1 */
  static gray(white: number): Color

  /**
   * Matches CSS `hsl()`.
   * @param hue Degrees, wrapping.
   * @param saturation 0-1
   * @param lightness 0-1
   * @param alpha 0-1
   */
  static hsla(hue: number, saturation: number, lightness: number, alpha?: number): Color

  /**
   * Matches CSS `oklab()`.
   * @param l 0-1
   * @param a ~-0.4 to 0.4
   * @param b ~-0.4 to 0.4
   * @param alpha 0-1
   */
  static oklab(l: number, a: number, b: number, alpha?: number): Color

  /**
   * Matches CSS `oklch()`. Out-of-gamut values reduce chroma, preserving hue.
   * @param l 0-1
   * @param c 0-0.4
   * @param h Degrees, wrapping.
   * @param alpha 0-1
   */
  static oklch(l: number, c: number, h: number, alpha?: number): Color

  /** Follows the current appearance. */
  static lightDark(light: Color, dark: Color): Color

  /** @param image Tiled when filling. */
  static pattern(image: Image): Color

  /**
   * @param red 0-1
   * @param green 0-1
   * @param blue 0-1
   * @param alpha 0-1
   */
  constructor(red: number, green: number, blue: number, alpha?: number)

  /** Clamped to 0–1. */
  alphaSet(value: number): Color

  /** Adds to alpha, clamped to 0–1. */
  alphaOffset(amount: number): Color

  /** Multiplies alpha, clamped to 0–1. */
  alphaMultiplied(factor: number): Color

  /** Adds to oklch lightness (0–1 scale). */
  lightened(amount: number): Color

  /** `lightened(-amount)`. */
  darkened(amount: number): Color

  /** Multiplies oklch chroma. */
  saturated(factor: number): Color

  /** `saturated(1 / factor)`. */
  desaturated(factor: number): Color

  /** Rotates oklch hue. */
  hueShifted(degrees: number): Color

  /**
   * CSS `color-mix()`. Hue spaces take the shorter arc; a gray side takes the
   * other color's hue.
   * @param fraction 0 = this, 1 = `color`.
   * @param colorSpace Default `oklab`.
   */
  mixed(color: Color, fraction: number, colorSpace?: ColorSpace): Color

  /** Best-contrasting candidate (CSS `color-contrast()`). */
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
