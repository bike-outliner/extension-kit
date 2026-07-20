/**
 * Types for receiving native row drags in DOM extensions.
 *
 * When outline rows are dragged over an extension webview (inspector item,
 * panel, or sheet), Bike dispatches synthetic DOM events on the element under
 * the cursor. The events bubble, so a delegated listener on your script's
 * root element works well.
 *
 * Acceptance mirrors HTML5 drag-and-drop: call `preventDefault()` on
 * `bike:rowdragenter` or `bike:rowdragover` to accept the drop. If nothing
 * accepts, the drag's cursor shows "not allowed" and no `bike:rowdrop` fires.
 *
 * The payload ids are in `bike.session`'s id spaces — `outline` is the source
 * outline's persistent id and `rows` are live session ids — so they can be
 * passed straight to `bike.session.updateRows`, `moveRows`, etc. This works
 * even when the rows were dragged from a different document than the one the
 * script's host window shows.
 *
 * @example
 * ```typescript
 * context.element.addEventListener('bike:rowdragover', (e) => {
 *   if ((e.target as HTMLElement).closest('.drop-zone')) e.preventDefault()
 * })
 * context.element.addEventListener('bike:rowdrop', (e) => {
 *   const { outline, rows } = e.detail
 *   bike.session.updateRows({ outline, rows, attributes: { tagged: '' } })
 * })
 * ```
 */

interface RowDragDetail {
  /** Persistent id of the outline the dragged rows belong to. */
  outline: OutlineId
  /** Session ids of the dragged rows. */
  rows: SessionId[]
  /** Drag location in client coordinates. */
  clientX: number
  clientY: number
}

type RowDragEvent = CustomEvent<RowDragDetail>

interface GlobalEventHandlersEventMap {
  /** Drag moved onto a new element. `preventDefault()` = accept the drop. */
  'bike:rowdragenter': RowDragEvent
  /** Drag moved within an element. `preventDefault()` = accept the drop. */
  'bike:rowdragover': RowDragEvent
  /** Drag left the element (or the webview; coordinates may be -1,-1). */
  'bike:rowdragleave': RowDragEvent
  /** Accepted drop. Fires on the element under the cursor. */
  'bike:rowdrop': RowDragEvent
}
