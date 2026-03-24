import { Color, defineEditorStyle, Insets } from 'bike/style'

let style = defineEditorStyle('{{id}}', '{{id}}')

style.layer('base', (row, run, caret, viewport, include) => {
  row(`.*`, (context, row) => {
    row.padding = new Insets(4, 0, 4, 0)
  })
})
