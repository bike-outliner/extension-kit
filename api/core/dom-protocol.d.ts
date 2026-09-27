/** Message between app and DOM contexts. */
export type Message = { type: string; [key: string]: any }

export interface DOMProtocol {
  toDOM: Message
  toApp: Message
}
