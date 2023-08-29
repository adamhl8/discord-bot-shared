import {
  ChatInputCommandInteraction,
  Collection,
  Events,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
} from "discord.js"
import { DiscordContext } from "./bot.js"
import fetchInteraction, { NonNullChatInputCommandInteraction } from "./fetch-interaction.js"

export interface Command {
  requiredRoles?: string[]
  command: RESTPostAPIChatInputApplicationCommandsJSONBody
  run: (interaction: NonNullChatInputCommandInteraction) => void | Promise<void>
}

export type CommandHook = (interaction: NonNullChatInputCommandInteraction) => Promise<boolean>

export class CommandManager {
  #commands = new Collection<string, Command>()
  #globalPreRunHook?: CommandHook

  constructor(private discord: DiscordContext) {}

  /*
   * Add a command
   */
  add(command: Command) {
    if (!command.command.name) {
      throw new Error("a command is missing a name")
    }

    this.#commands.set(command.command.name, command)
  }

  setGlobalPreRunHook(hook: CommandHook) {
    this.#globalPreRunHook = hook
  }

  async _register() {
    const payload = this.#commands.map((c) => c.command)
    const route = Routes.applicationCommands(this.discord.applicationId)
    await this.discord.rest.put(route, { body: payload })

    console.log(`Registered ${this.#commands.size} (/) commands.`)
  }

  _listen() {
    this.discord.client.on(Events.InteractionCreate, async (_interaction) => {
      if (!_interaction.isChatInputCommand()) return

      let interaction: NonNullChatInputCommandInteraction
      try {
        interaction = await fetchInteraction(_interaction)
      } catch (error) {
        this.interactionErrorReply(_interaction, error)
        return
      }

      const command = this.#commands.get(interaction.commandName)
      if (!command) {
        this.interactionReply(interaction, "Unable to get command.")
        return
      }

      if (!(await this.checkRoles(command, interaction))) {
        this.interactionReply(interaction, "You do not have one of the required roles to run this command.")
        return
      }

      try {
        const shouldContinue = this.#globalPreRunHook ? await this.#globalPreRunHook(interaction) : true
        if (!shouldContinue) return

        await command.run(interaction)
      } catch (error) {
        this.interactionErrorReply(interaction, error)
      }
    })
  }

  private async checkRoles(command: Command, interaction: NonNullChatInputCommandInteraction) {
    if (!command.requiredRoles) return true

    if (command.requiredRoles.length > 0) {
      const member = await interaction.guild.members.fetch(interaction.user).catch(console.error)
      if (!member) return

      return member.roles.cache.some((role) =>
        command.requiredRoles ? command.requiredRoles.includes(role.name) : false,
      )
    }

    return false
  }

  private interactionReply(
    interaction: NonNullChatInputCommandInteraction | ChatInputCommandInteraction,
    message: string,
  ) {
    interaction.deferred
      ? void interaction.editReply(message).catch(console.error)
      : void interaction.reply({ content: message, ephemeral: true }).catch(console.error)
  }

  private interactionErrorReply(
    interaction: NonNullChatInputCommandInteraction | ChatInputCommandInteraction,
    error: unknown,
  ) {
    const errorMessage = error instanceof Error ? error.message : ""
    this.interactionReply(interaction, `There was an error while running this command.\n\`\`\`${errorMessage}\`\`\``)
  }
}
