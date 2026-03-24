import { DOMExtensionContext } from 'bike/dom'
import { HelloProtocol } from './protocols'

export async function activate(context: DOMExtensionContext<HelloProtocol>) {
  context.element.textContent = 'Loading...'

  context.onmessage = (message) => {
    switch (message.type) {
      case 'greeting':
        context.element.textContent = `Hello, ${message.name}! Click me.`
        break
      case 'update':
        context.element.textContent = `Clicked ${message.count} time(s). Double-click to dismiss.`
        break
    }
  }

  context.element.addEventListener('click', () => {
    context.postMessage({ type: 'clicked' })
  })

  context.element.addEventListener('dblclick', () => {
    context.postMessage({ type: 'dismiss' })
  })
}
