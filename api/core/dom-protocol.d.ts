/** Base type for all messages exchanged between app and DOM contexts. */
export type Message = { type: string; [key: string]: any }

/** Defines both directions of a DOMScript messaging protocol. */
export interface DOMProtocol {
  toDOM: Message
  toApp: Message
}
