import {
  ChatInputCommandInteraction,
  Collection,
  Events,
  Guild,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
} from "discord.js"
import { DiscordContext } from "./bot.js"

export interface Command {
  requiredRoles?: string[]
  command: RESTPostAPIChatInputApplicationCommandsJSONBody
  run: (context: CommandContext, interaction: ChatInputCommandInteraction) => void | Promise<void>
}

export interface CommandContext {
  guild: Guild
}

export type CommandHook = (context: CommandContext, interaction: ChatInputCommandInteraction) => Promise<boolean>

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
    this.discord.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.guildId) return
      if (!interaction.isChatInputCommand()) return

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
        const guild = await this.discord.client.guilds.fetch(interaction.guildId)

        const context: CommandContext = {
          guild,
        }

        const shouldContinue = this.#globalPreRunHook ? await this.#globalPreRunHook(context, interaction) : true
        if (!shouldContinue) return

        await command.run(context, interaction)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : ""
        this.interactionReply(interaction, `There was an error while running this command.\n${errorMessage}`)
      }
    })
  }

  private async checkRoles(command: Command, interaction: ChatInputCommandInteraction) {
    if (!command.requiredRoles) return true

    if (command.requiredRoles.length > 0) {
      const member = await interaction.guild?.members.fetch(interaction.user).catch(console.error)
      if (!member) return

      return member.roles.cache.some((role) =>
        command.requiredRoles ? command.requiredRoles.includes(role.name) : false,
      )
    }

    return false
  }

  private interactionReply(interaction: ChatInputCommandInteraction, message: string) {
    interaction.deferred
      ? void interaction.editReply(message).catch(console.error)
      : void interaction.reply({ content: message, ephemeral: true }).catch(console.error)
  }
}
