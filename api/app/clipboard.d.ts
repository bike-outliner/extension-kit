/** Interface for managing the clipboard — `bike.clipboard`. */
export interface Clipboard {
  /**
   * Reads the text from the clipboard.
   *
   * @requires `clipboardRead` permission
   * @param uti - The associated UTI. (default is "public.utf8-plain-text")
   */
  readText(uti?: string): string

  /**
   * Writes the text to the clipboard.
   *
   * @requires `clipboardWrite` permission
   * @param uti - The associated UTI. (default is "public.utf8-plain-text")
   */
  writeText(string: string, uti?: string): void
}
