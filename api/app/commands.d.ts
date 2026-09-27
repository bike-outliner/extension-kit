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

/** Interface for managing commands. */
export interface Commands {
  /**
   * Adds commands to the app.
   *
   * Higher `priority` commands with the same name are tried first. Default 0.
   * @returns Disposable removes added commands.
   */
  addCommands(commands: { commands: Record<CommandName, CommandDefinition>; priority?: number }): Disposable

  /**
   * Performs the named command.
   * @param options - Editor and selection to use as the command context.
   * @returns Undefined if the command was not found. True if the command
   * was found and returned true when performed. False if the command was
   * found but returned false when performed.
   */
  performCommand(command: CommandName, options?: CommandContext): boolean | undefined

  /** Debugging function to list all commands. */
  toString(): string
}

/**
 * The name of the command in the form `category:name-of-command`. If you don't
 * want the command to show in the command palette then use a name that starts
 * with a period, such as `bike:.click-handle` for the full command name.
 */
export type CommandName = string

/**
 * Context passed to command action.
 *
 * Generally the frontmost outline editor and that editor's selection are
 * passed. In some cases (such as when clicking text run decoration with
 * associated command) the selection is created from the decoration's run range,
 * not the editor selection.
 */
export type CommandContext = {
  editor?: OutlineEditor
  selection?: Selection
}

/**
 * The closure to perform when a command is triggered. When false is
 * returned lower priority commands with same CommandName are triggered
 * until one returns true or no more commands match.
 *
 * Async commands can return a Promise<boolean>. When a Promise is returned,
 * the command is considered handled (as if it returned true) and the chain
 * stops. The resolved value is for the command's internal use.
 */
export type CommandAction = (context: CommandContext) => boolean | Promise<boolean>
