import { RelativeOutlinePath } from '../core/outline-path'
import { Image, Font, Color } from '../core/graphics'
import { Insets, Rect, Point, Size } from '../core/geometry'
import { EditorTheme } from './editor-theme'

/**
 * Defines an editor style: layers of rules, each an outline path plus a
 * function that modifies the style of matching elements. Matching rules run in
 * definition order (no specificity), each seeing the previous rule's result.
 *
 * Styles are cached, so a rule must be a pure function of its inputs; never
 * read global mutable state.
 *
 * ```ts
 * let style = defineEditorStyle("my-style", "My Style")
 * style.layer("base", (row, run, caret, viewport) => {
 *   row(`.*`, (context, row) => {
 *     row.padding = new Insets(10, 10, 10, 28)
 *   })
 *   run('.@emphasized', (context, run) => {
 *     run.font = run.font.withItalics()
 *   })
 * })
 * ```
 * @param id Unique style id.
 * @param displayName User-visible name.
 */
export declare function defineEditorStyle(id: EditorStyleId, displayName: string): EditorStyle

/**
 * Merges rules into the layers of existing editor styles.
 *
 * @param id Unique modifier id.
 * @param displayName User-visible name.
 * @param matchingEditorStyleIds Style ids to modify. Omitted, applies to all
 *   editor styles.
 */
export declare function defineEditorStyleModifier(
  id: EditorStyleId,
  displayName: string,
  matchingEditorStyleIds?: RegExp
): EditorStyle

export interface EditorStyle {
  /**
   * Adds rules to a layer. Layers are ordered by first use; calling again with
   * the same name appends to that layer.
   */
  layer(
    name: RulesLayerName,
    rulesCallback: (
      row: (
        match: RelativeOutlinePath,
        apply: (context: StyleContext, row: RowStyle) => void
      ) => void,
      run: (
        match: RelativeOutlinePath,
        apply: (context: StyleContext, run: TextRunStyle) => void
      ) => void,
      caret: (apply: (context: StyleContext, caret: CaretStyle) => void) => void,
      viewport: (apply: (context: StyleContext, viewport: ViewportStyle) => void) => void,
      /**
       * Copies another style's layer rules, e.g. `include('bike',
       * 'run-formatting')`. Copied immediately, so rules modifiers add later
       * are not included.
       * @param fromId Source editor style id.
       * @param fromLayer Source layer.
       */
      include: (fromId: EditorStyleId, fromLayer: RulesLayerName) => void
    ) => void
  ): void
}

export type EditorStyleId = string

export type RulesLayerName =
  | 'base' // Default rows/runs (*) formatting
  | 'row-formatting' // Row type formatting
  | 'run-formatting' // Inline text formatting
  | 'controls' // Controls formatting
  | 'selection' // Selection formatting
  | 'outline-focus' // Focus row formatting
  | 'text-focus' // Text focus formatting (word/sentence/paragraph)
  | 'filter-match' // Filter match formatting
  | 'highlights' // Highlight formatting
  | string

/** Passed to rule `apply` functions. */
export interface StyleContext {
  os: 'macOS' | 'iOS'
  /** Editor has keyboard focus. */
  isKey: boolean
  /** Mouse cursor hidden while typing. */
  isTyping: boolean
  isFiltering: boolean
  isDarkMode: boolean
  isFullScreen: boolean
  /** Window chrome hidden; document fills the window. */
  isFullWindow: boolean
  /** Selection is being dragged. */
  isDragSource: boolean
  viewportSize: Size
  /** Overlapping chrome (floating toolbar, status bar) within `viewportSize`. */
  viewportContentInsets: Insets
  settings: EditorSettings
  theme: EditorTheme
  /** Cleared whenever this context changes. */
  userCache: Map<string, any>
  /**
   * Consecutive same-type sibling counts from the outermost same-type ancestor
   * to this row (last entry). Empty body rows don't break a run. Set only for headings and
   * ordered rows.
   */
  consecutivePath?: number[]
}

export interface EditorSettings {
  showCaretLine: boolean
  showGuideLines: boolean
  showFocusArrows: boolean
  /** Scale fonts to fit the viewport. */
  allowFontScaling: boolean
  /** Control categories that fade while typing. */
  hiddenControlsWhenTyping: HiddenControl[]
  writingFocusMode?: WritingFocusMode
  /** 0–1. */
  typewriterMode?: number
  /** Body font. */
  font: Font
  /** In characters. */
  lineWidth?: number
  lineHeightMultiple: number
  rowSpacingMultiple: number
}

export type WritingFocusMode = 'paragraph' | 'sentence' | 'word'

export type HiddenControl = 'guides' | 'handles' | 'badges'

export interface CaretStyle {
  color: Color
  width: number
  blinkStyle: CaretBlinkStyle
  /** Caret line background. */
  lineColor: Color
  messageFont: Font
  messageColor: Color
  loadedAttributesFont: Font
  loadedAttributesColor: Color
}

export type CaretBlinkStyle = 'discrete' | 'continuous' | 'none'

export interface ViewportStyle {
  padding: Insets
  /**
   * Used for contrast and blending; doesn't paint. The painted background is
   * the theme's `materials.editor`.
   */
  backgroundColor: Color
  /** Base text font before row rules. Row-independent badges render with it. */
  font: Font
}

/** Applies to the matched row only, not its children. */
export interface RowStyle extends DecorationContainer {
  /** 0–1. */
  opacity: number
  /** Creates indentation. */
  padding: Insets
  text: TextStyle
}

export interface TextStyle extends TextContainer {
  scale: number
  lineHeightMultiple: number
}

export interface TextRunStyle extends TextContainer {
  /** Enclosing text's scale. */
  readonly scale: number
  /**
   * Used only when the run is a single embed character (e.g. hr). Values 0–1
   * are a fraction of line width/height; > 1 are points. Default 1.
   */
  embedSize: Size
}

export type Ligature = 'default' | 'none' | 'all'

/** Wraps `NSUnderlineStyle`. */
export interface TextLineStyle {
  color: Color
  single: boolean
  thick: boolean
  double: boolean
  patternDot: boolean
  patternDash: boolean
  patternDashDot: boolean
  patternDashDotDot: boolean
  byWord: boolean
}

export interface TextContainer extends DecorationContainer {
  font: Font
  /** Default 0. */
  kerning: number
  /** Default 0. */
  tracking: number
  ligature: Ligature
  baselineOffset: number
  color: Color
  backgroundColor: Color
  underline: TextLineStyle
  strikethrough: TextLineStyle
  margin: Insets
  padding: Insets
}

/** Row, row text, or text run. `layout` positions relative to the container. */
export interface DecorationContainer {
  /** Adds or modifies the decoration with `id`. */
  decoration(id: string, modify: (decoration: Decoration, layout: Layout) => void): void

  /** Modifies every existing decoration. */
  decorations(modify: (decoration: Decoration, layout: Layout) => void): void
}

/**
 * Visual layer attached to a row, row text, or text run; wraps `CAShapeLayer`.
 * Decorations don't affect layout (make room with padding and margins), except
 * `flow: 'trailing'` decorations that wrap past the last text line, which add
 * row height.
 *
 * `mergable` decorations with equal styling and touching frames combine: text
 * run decorations in consecutive runs merge into one shape (text selection);
 * row and text decorations in consecutive rows adjust their `corners.radius`
 * corners to form one rounded shape (block selection).
 */
export interface Decoration {
  /** Default false. */
  hidden: boolean
  /** 0–1. */
  opacity: number
  border: DecorationBorder
  corners: DecorationCorners
  shadow: DecorationShadow
  contents: DecorationContents
  /** Background color. */
  color: Color
  /** Radians. Default 0. */
  rotation: number
  /** Default 0. */
  zPosition: number
  /** Point on the decoration placed at `x`, `y`, 0–1. Default 0.5, 0.5. */
  anchor: Point
  /** Default container center. */
  x: LayoutValue
  /** Default container center. */
  y: LayoutValue
  /** Default fills container. */
  width: LayoutValue
  /** Default fills container. */
  height: LayoutValue
  mergable: boolean
  /** Line fragments shown on when text wraps. Default `all`. */
  fragmentPlacement: 'all' | 'first' | 'last'
  /** Flows after the row's last text line; `x` and `y` are ignored. */
  flow?: 'trailing'
  /** Flow order. Default 0. */
  order?: number
  /** Performed on click. */
  commandName?: string
  capabilities?: ('drag-row' | 'accept-drop')[]

  /** Animated properties on update. All default true. */
  readonly transitions: {
    color: boolean
    borderColor: boolean
    borderWidth: boolean
    corners: boolean
    opacity: boolean
    rotation: boolean
    position: boolean
    size: boolean
    contents: boolean
    /** Sets all to false. */
    clear(): void
  }
}

/**
 * Values for a decoration's `x`, `y`, `width`, `height`. Child layouts narrow
 * the reference, e.g. `layout.firstLine.bottom` vs the row's `layout.bottom`.
 */
export interface Layout {
  text: Layout
  firstLine: Layout
  lastLine: Layout
  width: LayoutValue
  height: LayoutValue
  top: LayoutValue
  bottom: LayoutValue
  baseline: LayoutValue
  centerY: LayoutValue
  leading: LayoutValue
  leadingContent: LayoutValue
  trailing: LayoutValue
  centerX: LayoutValue
  fixed(value: number): LayoutValue
}

/** Resolved to a number during layout. */
export interface LayoutValue {
  min(value: number | LayoutValue): LayoutValue
  max(value: number | LayoutValue): LayoutValue
  scale(value: number | LayoutValue): LayoutValue
  offset(value: number | LayoutValue): LayoutValue
  minus(value: number | LayoutValue): LayoutValue
}

export interface DecorationBorder {
  color: Color
  width: number
}

export interface DecorationShadow {
  color: Color
  opacity: number
  /** Blur radius. */
  radius: number
  offset: {
    width: number
    height: number
  }
}

/** Each corner flag defaults true. */
export interface DecorationCorners {
  radius: number
  /** Top right. */
  maxXMaxYCorner: boolean
  /** Bottom right. */
  maxXMinYCorner: boolean
  /** Top left. */
  minXMaxYCorner: boolean
  /** Bottom left. */
  minXMinYCorner: boolean
}

/** Wraps `CALayer` contents properties. */
export interface DecorationContents {
  image: Image
  /** Portion of the image to use. */
  rect: Rect
  /** Portion of the image to stretch. */
  center: Rect
  /** How to position and scale the image. */
  gravity: ContentsGravity
}

/** Wraps `CALayerContentsGravity`. */
export type ContentsGravity =
  | 'bottom'
  | 'bottomLeft'
  | 'bottomRight'
  | 'center'
  | 'left'
  | 'resize'
  | 'resizeAspect'
  | 'resizeAspectFill'
  | 'right'
  | 'top'
  | 'topLeft'
  | 'topRight'
