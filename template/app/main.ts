import { AppExtensionContext, CommandContext } from 'bike/app'
import { HelloProtocol } from '../dom/protocols'

export async function activate(context: AppExtensionContext) {
  console.log('{{id}} activated')

  bike.commands.addCommands({
    commands: {
      '{{id}}:hello': helloCommand,
    },
  })
}

function helloCommand(context: CommandContext): boolean {
  let window = bike.frontmostWindow
  if (!window) return false

  let clickCount = 0

  window.presentSheet<HelloProtocol>('hello-sheet.js').then((handle) => {
    handle.postMessage({ type: 'greeting', name: 'World' })
    handle.onmessage = (message) => {
      switch (message.type) {
        case 'clicked':
          clickCount++
          handle.postMessage({ type: 'update', count: clickCount })
          break
        case 'dismiss':
          handle.dispose()
          break
      }
    }
  })

  return true
}
