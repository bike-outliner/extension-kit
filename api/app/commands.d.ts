import { OutlineEditor, Selection } from './outline-editor'
import { Disposable } from './system'
import { SFSymbolName } from '../core/bike-globals'

export type CommandDefinition =
  | CommandAction
  | {
      button?: CommandButton
      action: CommandAction
    }

export type CommandButtonLocation =
  /** Menu item in the titlebar's trailing popup. */
  'titlebar' | 
  /** Editor top toolbar. */
  'toolbar' | 
  /** Editor bottom status bar. */
  'statusbar'

/** Default button for a command. */
export type CommandButton = {
  symbol: SFSymbolName
  location: CommandButtonLocation
}

export interface Commands {
  /** Higher `priority` commands with the same name are tried first. Default 0. */
  addCommands(commands: { commands: Record<CommandName, CommandDefinition>; priority?: number }): Disposable

  /** @returns The command's result, or undefined if not found. */
  performCommand(command: CommandName, options?: CommandContext): boolean | undefined

  /** Lists all commands, for debugging. */
  toString(): string
}

/** `category:name-of-command`. A name starting with `.` (`bike:.click-handle`) is hidden from the command palette. */
export type CommandName = string

/**
 * Usually the frontmost editor and its selection. A clicked run decoration
 * passes a selection of the run's range instead.
 */
export type CommandContext = {
  editor?: OutlineEditor
  selection?: Selection
}

/**
 * Returning false tries the next lower-priority command with the same name.
 * Returning a Promise counts as true; its resolved value is ignored.
 */
export type CommandAction = (context: CommandContext) => boolean | Promise<boolean>
