/**
 * Permissions are used to control access to sensitive APIs such as the
 * clipboard and web requests. They are set in the extension manifest and
 * cannot be changed by the extension code.
 */
export interface Permissions {
  contains(permission: Permission): boolean
}

/** Permissions that can be granted through `manifest.json`. */
export type Permission = 'openURL' | 'clipboardRead' | 'clipboardWrite' | 'keychain'

/**
 * Undoes whatever returned it — an observer, a command, a sidebar item.
 *
 * Everything an extension registers is disposed automatically when it
 * deactivates, so keep a Disposable only to undo something earlier than that.
 * Some (SidebarItem) double as a handle for modifying what they added.
 */
export interface Disposable {
  dispose(): void
}

export class URL {
  constructor(url: string)

  scheme?: string
  user?: string
  password?: string
  host?: string
  port?: number
  path?: string
  query?: string
  queryParameters?: Record<string, string>
  fragment?: string

  readonly absoluteString: string

  /**
   * Open this URL in the system's default application.
   * @requires `openURL` permission
   */
  open(configuration: URLOpenConfiguration): void
}

/** Configuration for opening a URL. */
type URLOpenConfiguration = {
  /** Whether to activate the application (default: true) */
  activate?: boolean
  /** Whether to prompt the user if needed (default: true) */
  promptsUserIfNeeded?: boolean
}

