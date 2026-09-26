/**
 * Row drags over a DOM script dispatch bubbling `bike:rowdrag*` events on the
 * element under the cursor. As in HTML5, `preventDefault()` on `rowdragenter`
 * or `rowdragover` accepts; otherwise no `bike:rowdrop` fires. Ids are
 * `bike.session` ids, from any document.
 */

interface RowDragDetail {
  outline: OutlineId
  rows: SessionId[]
  /** Client coordinates. */
  clientX: number
  clientY: number
}

type RowDragEvent = CustomEvent<RowDragDetail>

interface GlobalEventHandlersEventMap {
  'bike:rowdragenter': RowDragEvent
  'bike:rowdragover': RowDragEvent
  /** Coordinates may be -1,-1 when leaving the webview. */
  'bike:rowdragleave': RowDragEvent
  'bike:rowdrop': RowDragEvent
}
