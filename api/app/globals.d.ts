/**
 * Global functions available in the app context's headless JSContext.
 * (The DOM context gets these from the standard DOM lib instead.)
 */

declare function setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): number
declare function clearTimeout(timeoutId: number): void
declare function setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): number
declare function clearInterval(intervalId: number): void

declare const console: {
  trace(...data: any[]): void
  log(...data: any[]): void
  info(...data: any[]): void
  warn(...data: any[]): void
  error(...data: any[]): void
  debug(...data: any[]): void
}
