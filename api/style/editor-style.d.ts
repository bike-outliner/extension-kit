import { RelativeOutlinePath } from '../core/outline-path'
import { Image, Font, Color } from '../core/graphics'
import { Insets, Rect, Point, Size } from '../core/geometry'
import { EditorTheme } from './editor-theme'

/**
 * Defines EditorStyle – Ordered list of style rules.
 *
 * Each rule is a function with an associated outline path. The rule's function
 * is called when the outline path matches the element being styled. The rule's
 * function is passed a style object that it may modify. That style object is
 * then passed on to the next matching rule.
 *
 * Rules should be ordered from least specific to most specific. The first rule
 * sets the general style, following rules modify that style for specific
 * situations. Unlike CSS there is no specificity calculation, rules are always
 * processed in the order they are defined.
 *
 * Style objects are cached. The same set of inputs to a rule's function should
 * always generate the same style object modifications. Never use global mutable
 * state in rule logic or you will get unexpected results. Unlike CSS, you can
 * read the incoming rule state, and make decisions based on that state.
 *
 * Rules are organized into layers. Use `defineEditorStyleModifier` to inject
 * new rules into existing editor style layers.
 *
 * Example (new editor style):
 * ```ts
 * let style = defineEditorStyle("my-style", "My Style")
 *
 * style.layer("base", (row, run, caret, viewport) => {
 *   row(`.*`, (editor, row) => {
 *     row.padding = new Insets(10, 10, 10, 28)
 *   })
 *   run('.@emphasized', (editor, text) => {
 *     text.font = text.font.withItalics()
 *   })
 * })
 * ```
 * @param displayName - User visible editor style name
 */
export declare function defineEditorStyle(id: EditorStyleId, displayName: string): EditorStyle

/**
 * EditorStyleModifier – Insert rules into existing EditorStyles.
 *
 * Rules defined here are merged into existing styles whose `id` matches
 * `matchingEditorStyleIds`. If that matcher is not set then these rules are
 * merged into all editor styles. editor styles that are modified.
 *
 * @param displayName - User visible editor style modifier name
 * @param matchingEditorStyleIds - Regular expression to match editor style
 *   ids that this modifier should be applied to. If not set then this modifier
 *   is applied to all editor styles.
 */
export declare function defineEditorStyleModifier(
  id: EditorStyleId,
  displayName: string,
  matchingEditorStyleIds?: RegExp
): EditorStyle

export interface EditorStyle {
  /**
   * Add/Modify an editor style rules layer.
   *
   * Layers are ordered by when they are first named. The rules within a layer
   * are ordered by definition order. If `layer` is called multiple times with
   * the same name, the new rules are added to the end of the existing layer.
   *
   * The purpose of layers is to group rules together, and allow later style
   * modifiers to insert rules into known locations.
   *
   * Example:
   * ```ts
   * editorStyle.layer("base", (row, run, caret, viewport) => {
   *   row(`.*`, (editor, row) => {
   *     row.padding = new Insets(10, 10, 10, 28)
   *   })
   * })
   * ```
   */
  layer(
    name: RulesLayerName,
    rulesCallback: (
      /**
       * Define a row rule.
       */
      row: (
        match: RelativeOutlinePath,
        apply: (context: StyleContext, row: RowStyle) => void
      ) => void,
      /**
       * Define a text run rule.
       */
      run: (
        match: RelativeOutlinePath,
        apply: (context: StyleContext, run: TextRunStyle) => void
      ) => void,
      /**
       * Define a caret rule. Generally this only needs to be used once per
       * editor style, by convention it is defined in the base layer.
       */
      caret: (apply: (context: StyleContext, caret: CaretStyle) => void) => void,
      /**
       * Define a viewport rule. Generally this only needs to be used once per
       * editor style, by convention it is defined in the base layer.
       */
      viewport: (apply: (context: StyleContext, viewport: ViewportStyle) => void) => void,
      /**
       * Include rules from another editor style layer.
       *
       * For example, you might want to `include('bike', 'run-formatting')` to
       * add the standard run formatting rules. This saves typing and means
       * you'll get updated run-formatting rules when the standard Bike style
       * changes.
       *
       * The includes added immediately and won't contain any rules added later
       * by modifiers. Expectation is you will only include rules from the
       * standard `bike` editor style, or some future standard style that also
       * ships with Bike.
       *
       * @param fromLayer Rules layer to import
       */
      include: (fromId: EditorStyleId, fromLayer: RulesLayerName) => void
    ) => void
  ): void
}

export type EditorStyleId = string

/**
 * RulesLayerName - The name of a rules layer.
 *
 * The name is used to identify the layer when defining rules. The name is also
 * used to identify the layer when modifying existing styles.
 */
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

/**
 * StyleContext – Context passed to stylesheet `apply` functions.
 *
 * Use this in rule definitions to determine the applied style values. Cache
 * values derived from this context in `userCache` to avoid recomputing them.
 * Anytime this context changes the `userCache` is also invalidated.
 */
export interface StyleContext {
  /** Host platform the editor is running on */
  os: 'macOS' | 'iOS'
  /** True when editor has keyboard focus  */
  isKey: boolean
  /** True when editor is typing (mouse hidden)  */
  isTyping: boolean
  /** True when editor is filtering  */
  isFiltering: boolean
  /** True when in dark mode  */
  isDarkMode: boolean
  /** True when in full screen mode  */
  isFullScreen: boolean
  /** True when in full window mode (window chrome hidden, document fills the window) */
  isFullWindow: boolean
  /** True when dragging selection  */
  isDragSource: boolean
  viewportSize: Size
  /** Insets of overlapping chrome (e.g. floating toolbar/status bar) on the viewport. Subtract from `viewportSize` to get the visible content area. */
  viewportContentInsets: Insets
  settings: EditorSettings
  theme: EditorTheme
  /** Cache for values derived from this editor state */
  userCache: Map<string, any>
  /**
   * Consecutive-sibling counts of same-type ancestor down to this row The last
   * entry is this row's own count. Empty body rows do not break the run.
   * IMPORTANT: Set only for headings and ordered rows
   */
  consecutivePath?: number[]
}

export interface EditorSettings {
  /** Show caret line  */
  showCaretLine: boolean
  /** Show guide lines  */
  showGuideLines: boolean
  /** Show focus arrows  */
  showFocusArrows: boolean
  /** Show row attributes button  */
  showAttributesButton: boolean
  /** Allow font scaling to better fit viewport  */
  allowFontScaling: boolean
  /** Hide controls when typing  */
  hideControlsWhenTyping: boolean
  /** Writing focus mode  */
  writingFocusMode?: WritingFocusMode
  /** Typewriter mode (0-1)  */
  typewriterMode?: number
  /** Body font  */
  font: Font
  /** Line width (characters)  */
  lineWidth?: number
  lineHeightMultiple: number
  rowSpacingMultiple: number
}

export type WritingFocusMode = 'paragraph' | 'sentence' | 'word'

/** CaretStyle – The global text caret style */
export interface CaretStyle {
  color: Color
  width: number
  blinkStyle: CaretBlinkStyle
  /** The caret line background color  */
  lineColor: Color
  messageFont: Font
  messageColor: Color
  loadedAttributesFont: Font
  loadedAttributesColor: Color
}

/** CaretBlinkStyle - Caret blink style */
export type CaretBlinkStyle = 'discrete' | 'continuous' | 'none'

/** ViewportStyle – The global viewport style */
export interface ViewportStyle {
  /** The viewport insets  */
  padding: Insets
  /**
   * The viewport semantic background color.
   *
   * This color is used for contrast and blending calculations, but does not
   * paint the actual background of the viewport. To change the visual
   * background, use the `materials.editor` property in the theme.
   */
  backgroundColor: Color
  /**
   * The outline's base text font — the settings-derived font before any row
   * rule (heading bold, note size) diverges from it. Row-independent chrome
   * (value-aware badges) renders with this font, so set it whenever your
   * stylesheet computes its own base font.
   */
  font: Font
}

/**
 * RowStyle – The style for a row in the outline.
 *
 * Row style only applies to an individual row, not to the rows contained by
 * this row.
 */
export interface RowStyle extends DecorationContainer {
  /** Opacity (0-1) */
  opacity: number
  /** The row padding. Generally used to create outline indentation */
  padding: Insets
  /** The row's text style, affects only the matched row's text, not contained rows */
  text: TextStyle
}

/**
 * TextStyle - The style for row text.
 */
export interface TextStyle extends TextContainer {
  scale: number
  lineHeightMultiple: number
}

/**
 * TextRunStyle – The style for text runs.
 */
export interface TextRunStyle extends TextContainer {
  /** Enclosing text's scale */
  readonly scale: number
  /**
   * Embed size.
   *
   * Ignored unless text run contains a single embed/attachment character.
   * Currently only used when implementing hr's. The size values are interpreted
   * based on the range of the value (default 1):
   *
   * 1. 0-1: Interpreted as a percentage of line width/height.
   * 2. > 1: Interpreted as a fixed point size.
   */
  embedSize: Size
}

/** Ligature - Text ligature style */
export type Ligature = 'default' | 'none' | 'all'

/** TextLineStyle - Wraps an NSUnderlineStyle. */
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

/**
 * TextContainer - Common text style properties shared by TextStyle and TextRunStyle
 */
export interface TextContainer extends DecorationContainer {
  font: Font
  /** The run kerning (default 0) */
  kerning: number
  /** The run tracking (default 0) */
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

/**
 * DecorationContainer - An object to which visual decorations are attached.
 * Row, Row text, and Row text runs are all decoration containers. Decoration
 * containers provide methods to add and modify decorations and provide the
 * layout object that's used to position the decorations relative to the
 * container.
 */
export interface DecorationContainer {
  /**
   * Add/Modify decoration by id.
   */
  decoration(id: string, modify: (decoration: Decoration, layout: Layout) => void): void

  /**
   * List and modify all existing decorations.
   */
  decorations(modify: (decoration: Decoration, layout: Layout) => void): void
}

/**
 * Decoration - Add visual decorations to outline.
 *
 * Decorations are attached to rows, row texts, or row text runs. They can have
 * a background color, border, and corner radius. They can also have image
 * content. Decorations do not affect layout, you need to make space for them
 * using row and text padding and margins.
 *
 * Decorations can be marked `mergable`. Similar mergable decorations may be
 * combined into a single shape. The exact merging behavior depends on where the
 * decoration is attached:
 *
 * - Text run decorations are merged when they appear in consecutive text runs,
 *   have equal styling, and touching/close frames.
 *
 *   The frames of the merged decorations are combined into a single shape that
 *   is the union of all the individual run decoration frames. This shapes
 *   corners will be rounded via the `corners.radius` property. See text
 *   selection for intended use/behavior.
 *
 * - Row and text decorations are merged when they appear in consecutive rows,
 *   have equal styling, and touching/close frames.
 *
 *   Row and text decorations are not merged into a single shape. Instead their
 *   corners are modified to match the preceding and following decoration
 *   corners to create a larger rounded shape. This will only have a visible
 *   effect when `border.radius` is applied. See block selection for intended
 *   use/behavior.
 *
 * Decorations closely wrap a `CAShapeLayer`. Look into the `CAShapeLayer`
 * documentation for more information on the possibilities.
 */
export interface Decoration {
  /** Hidden (default false) */
  hidden: boolean
  /** Opacity (0-1) */
  opacity: number
  border: DecorationBorder
  /** Corners */
  corners: DecorationCorners
  shadow: DecorationShadow
  contents: DecorationContents
  /** Background color */
  color: Color
  /** Radian rotation (default 0) */
  rotation: number
  /** Depth ordering (default 0) */
  zPosition: number
  /** Relative (0-1) Position on decoration that is positioned (default to center, 0.5, 0.5) */
  anchor: Point
  /** The x value (default container center) */
  x: LayoutValue
  /** The y value (default container center) */
  y: LayoutValue
  /** The width value (default fill container) */
  width: LayoutValue
  /** The height value (default fill container) */
  height: LayoutValue
  /** Whether the decoration can be merged with similar (see interface docs) */
  mergable: boolean
  /** Which line fragment(s) to show the decoration on when text wraps (default 'all') */
  fragmentPlacement: 'all' | 'first' | 'last'
  /** Flow with other decoration after the row's last text line (x, y ignored when set) */
  flow?: 'trailing'
  /** Flow ordering (default 0). */
  order?: number
  /** Optional command name to perform when activated (clicked) */
  commandName?: string
  /** Optional interaction capabilities */
  capabilities?: ('drag-row' | 'accept-drop')[]

  /** The properties to animate when using updating decoration */
  readonly transitions: {
    color: boolean // (default true)
    borderColor: boolean // (default true)
    borderWidth: boolean // (default true)
    corners: boolean // (default true)
    opacity: boolean // (default true)
    rotation: boolean // (default true)
    position: boolean // (default true)
    size: boolean // (default true)
    contents: boolean // (default true)
    clear(): void // set all to false
  }
}

/**
 * Layout - Decorations are positioned with layouts.
 *
 * The layout provides access to layout values which are assigned to the
 * decorations x, y, width, and height. Layout values can be used on own, or
 * combined with each other in various ways.
 *
 * Layouts also provide access to child layouts such as `text`, `firstLine` and
 * `lastLine`. For example to get the layout value for the bottom of the first
 * line of a row you could use `layout.firstLine.bottom`. While in the same
 * context `layout.bottom` would give the layout value for the bottom of the
 * row.
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

/**
 * LayoutValue - A logical layout value that is resolved to a number by the
 * layout process and then used to set a Decoration's x, y, width, and height
 * properties.
 */
export interface LayoutValue {
  /** Min of this and value. */
  min(value: number | LayoutValue): LayoutValue
  /** Max of this and value. */
  max(value: number | LayoutValue): LayoutValue
  /** This scaled by value. */
  scale(value: number | LayoutValue): LayoutValue
  /** This offset by value. */
  offset(value: number | LayoutValue): LayoutValue
  /** This minus value. */
  minus(value: number | LayoutValue): LayoutValue
}

/** DecorationBorder - Wraps CALayer border */
export interface DecorationBorder {
  color: Color
  width: number
}

/** DecorationShadow - Wraps CALayer shadow */
export interface DecorationShadow {
  color: Color
  opacity: number
  /** Shadow blur radius */
  radius: number
  offset: {
    width: number
    height: number
  }
}

/** DecorationCorners - Wraps CALayer corner */
export interface DecorationCorners {
  radius: number
  /** Apply radius to top right corner (default true) */
  maxXMaxYCorner: boolean
  /** Apply radius to bottom right corner (default true) */
  maxXMinYCorner: boolean
  /** Apply radius to top left corner (default true) */
  minXMaxYCorner: boolean
  /** Apply radius to bottom left corner (default true) */
  minXMinYCorner: boolean
}

/**
 * DecorationContents - Wraps CALayer contents values.
 *
 * Decoration content is eventually an bitmap image, but you can construct that
 * image from text, shapes, and symbols. In addition to standard images.
 */
export interface DecorationContents {
  /** Contents Image */
  image: Image
  /** Contents Rect, portion of contents to use */
  rect: Rect
  /** Contents Center, portion of contents to stretch */
  center: Rect
  /** Contents Gravity, how to position and scale contents */
  gravity: ContentsGravity
}

/** ContentsGravity - Wraps CALayerContentsGravity */
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
