export interface Clipboard {
  /**
   * @requires `clipboardRead` permission
   * @param uti Default "public.utf8-plain-text".
   */
  readText(uti?: string): string

  /**
   * @requires `clipboardWrite` permission
   * @param uti Default "public.utf8-plain-text".
   */
  writeText(string: string, uti?: string): void
}
