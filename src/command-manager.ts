import {
  Collection,
  Events,
  Routes,
  type ChatInputCommandInteraction,
  type Interaction,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js"

import type { DiscordContext } from "./bot.js"
import { throwUserError, UserError } from "./util.js"

interface Command {
  requiredRoles?: string[]
  command: RESTPostAPIChatInputApplicationCommandsJSONBody
  run: (interaction: ChatInputCommandInteraction<"cached">) => void | Promise<void>
}

type CommandHook = (interaction: ChatInputCommandInteraction<"cached">) => boolean | Promise<boolean>

class CommandManager {
  readonly #commands = new Collection<string, Command>()
  #globalCommandHook?: CommandHook
  readonly #discord: DiscordContext

  public constructor(discord: DiscordContext) {
    this.#discord = discord
  }

  /*
   * Add a command
   */
  public add(command: Command) {
    this.#commands.set(command.command.name, command)
  }

  public setGlobalCommandHook(commandHook: CommandHook) {
    this.#globalCommandHook = commandHook
  }

  public async register() {
    const payload = this.#commands.map((c) => c.command)
    const route = Routes.applicationCommands(this.#discord.applicationId)
    await this.#discord.rest.put(route, { body: payload })

    console.log(`Registered ${this.#commands.size.toString()} (/) commands.`)
  }

  public async unregisterGuildCommands() {
    if (this.#discord.client.readyAt) await this._unregisterGuildCommands()
    else this.#discord.client.once(Events.ClientReady, () => void this._unregisterGuildCommands())
  }

  private async _unregisterGuildCommands() {
    let guilds
    try {
      guilds = await this.#discord.client.guilds.fetch()
    } catch (error) {
      console.error("Unable to unregister guild commands. Failed to fetch guilds.")
      throw error
    }

    const unregisterPromises = []
    for (const guild of guilds.values()) {
      const route = Routes.applicationGuildCommands(this.#discord.applicationId, guild.id)
      const unregisterGuildCommands = async () => {
        await this.#discord.rest.put(route, { body: [] })
        console.log(`Unregistered commands from guild: ${guild.name}`)
      }
      unregisterPromises.push(unregisterGuildCommands())
    }

    await Promise.all(unregisterPromises)
  }

  public async unregisterApplicationCommands() {
    const route = Routes.applicationCommands(this.#discord.applicationId)
    await this.#discord.rest.put(route, { body: [] })
    console.log("Unregistered application commands.")
  }

  public _listen() {
    const listen = async (interaction: Interaction) => {
      if (!interaction.isChatInputCommand()) return
      if (!interaction.guildId) return
      if (!interaction.inCachedGuild()) await interaction.client.guilds.fetch(interaction.guildId).catch(console.error)
      if (!interaction.inCachedGuild()) {
        CommandManager.interactionReply(interaction, "Guild is not cached. Try again.")
        return
      }

      const command = this.#commands.get(interaction.commandName)
      if (!command) {
        CommandManager.interactionReply(interaction, `Failed to get command with name: ${interaction.commandName}`)
        return
      }

      if (!(await CommandManager.checkRoles(command, interaction))) {
        CommandManager.interactionReply(interaction, "You do not have one of the required roles to run this command.")
        return
      }

      try {
        const shouldContinue = this.#globalCommandHook ? await this.#globalCommandHook(interaction) : true
        if (!shouldContinue) throwUserError("The global command hook returned false.")

        await command.run(interaction)
      } catch (error) {
        CommandManager.interactionReply(interaction, error)
      }
    }

    this.#discord.client.on(Events.InteractionCreate, (interaction) => void listen(interaction))
    console.log("Listening for commands.")
  }

  private static async checkRoles(command: Command, interaction: ChatInputCommandInteraction<"cached">) {
    if (!command.requiredRoles) return true

    if (command.requiredRoles.length > 0) {
      const member = await interaction.guild.members.fetch(interaction.user).catch(console.error)
      if (!member) return false

      return member.roles.cache.some((role) =>
        command.requiredRoles ? command.requiredRoles.includes(role.name) : false,
      )
    }

    return false
  }

  private static interactionReply(interaction: ChatInputCommandInteraction, error: unknown) {
    let errorMessage: string
    if (error instanceof UserError) errorMessage = error.message
    else if (error instanceof Error && error.stack) errorMessage = error.stack
    else errorMessage = String(error)

    const message = `There was an error while running this command.\n\`\`\`${errorMessage}\`\`\``
    const handleInteractionReply = async () => {
      await (interaction.deferred
        ? interaction.editReply(message).catch(console.error)
        : interaction.reply({ content: message, ephemeral: true }).catch(console.error))
    }
    void handleInteractionReply()
  }
}

export { CommandManager }
export type { Command, CommandHook }
