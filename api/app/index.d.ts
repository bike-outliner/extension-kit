// Pull the app context's ambient globals (console, setTimeout, …) in with the
// barrel, so importing `bike/app` is enough to see them — a project whose
// `configs/tsconfig.app.json` predates the globals.d.ts `include` entry (and any
// editor that resolves this file through the `bike/app` path mapping) would
// otherwise report TS2304 for them. Safe to reference from here and nowhere
// else: the DOM context reaches app types only through direct file imports
// (`../app/system`, `../app/outline`), never this barrel, so these declarations
// stay out of the lib.dom program they conflict with.
/// <reference path="./globals.d.ts" />

export * from './bike'
export * from './alert'
export * from './choice-box'
export * from './clipboard'
export * from './keychain'
export * from './workspace'
export * from './attribute'
export * from './badge'
export * from './menu'
export * from './summary'
export * from '../core/graphics'
export * from '../core/geometry'
export * from './commands'
export * from './dom-script'
export * from './fetch'
export * from './inspector'
export * from './keybindings'
export * from './outline-editor'
export * from './picker'
export * from '../core/bike-globals'
export * from '../core/dom-protocol'
export * from '../core/json'
export * from '../core/outline-path'
export * from './outline'
export * from './settings'
export * from './sidebar'
export * from './system'
export * from './input'
