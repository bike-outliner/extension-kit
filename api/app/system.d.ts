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
 * Interface for disposables.
 *
 * Disposables are used throughout the API to allow for the cleanup of
 * resources (such as event handlers) or removal of additions (such as
 * commands, keybindings, and sidebar items) when they are no longer needed.
 *
 * Disposables are automatically disposed when your extension is
 * deactivated. It is not necessary to manually dispose them. You may wish
 * to keep disposables around if you want to be able to dispose them while
 * your extension is still running.
 *
 * In some cases (such as SidebarItem) the disposable is also a handle that
 * provides API to modify the added item.
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

