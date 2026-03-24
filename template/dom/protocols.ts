import { DOMProtocol } from 'bike/core'

export interface HelloProtocol extends DOMProtocol {
  toDOM:
    | { type: 'greeting'; name: string }
    | { type: 'update'; count: number }
  toApp:
    | { type: 'clicked' }
    | { type: 'dismiss' }
}
