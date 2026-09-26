/**
 * Granted in `manifest.json` `permissions`; fixed at runtime. Network access
 * is governed separately by `host_permissions`.
 */
export interface Permissions {
  contains(permission: Permission): boolean
}

export type Permission = 'openURL' | 'clipboardRead' | 'clipboardWrite' | 'keychain'

/** Undoes whatever returned it. Everything is disposed when the extension deactivates. */
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
   * Opens in the default application.
   * @requires `openURL` permission
   */
  open(configuration: URLOpenConfiguration): void
}

type URLOpenConfiguration = {
  /** Activate the opening app. Default true. */
  activate?: boolean
  /** Default true. */
  promptsUserIfNeeded?: boolean
}

