import { OutlineEditor, Selection } from './outline-editor'
import { Disposable } from './system'

/**
 * Command definition. Either a bare action closure, or an object that pairs the
 * action with optional metadata such as a default {@link CommandButton}.
 */
export type CommandDefinition =
  | CommandAction
  | {
      /** Default button placement for this command. */
      button?: CommandButton
      action: CommandAction
    }

/** Where a {@link CommandButton} is placed by default. */
export type CommandButtonLocation =
  /** Adds menu item to the trailing view popup in window titlebar. */
  'titlebar' | 
  /** Adds button to the editor's top toolbar. */
  'toolbar' | 
  /** Adds button to the editor's bottom status bar. */
  'statusbar'

/** A default button an extension contributes for one of its commands. */
export type CommandButton = {
  /** SF Symbol name shown on the button (e.g. `'star'`, `'bolt'`). */
  symbol: string
  /** The bar the button is placed in by default. */
  location: CommandButtonLocation
}

/** Interface for managing commands. */
export interface Commands {
  /**
   * Adds commands to the app.
   *
   * When multiple commands share a CommandName, higher priority commands are
   * tried first (see {@link CommandAction}). Default priority is 0.
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
