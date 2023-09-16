import {
  ChatInputCommandInteraction,
  Collection,
  Events,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
} from "discord.js"
import { DiscordContext } from "./bot.js"
import { UserError } from "./util.js"

interface Command {
  requiredRoles?: string[]
  command: RESTPostAPIChatInputApplicationCommandsJSONBody
  run: (interaction: ChatInputCommandInteraction<"cached">) => void | Promise<void>
}

type CommandHook = (interaction: ChatInputCommandInteraction<"cached">) => Promise<boolean>

class CommandManager {
  #commands = new Collection<string, Command>()
  #globalPreRunHook?: CommandHook
  #discord: DiscordContext

  constructor(discord: DiscordContext) {
    this.#discord = discord
  }

  /*
   * Add a command
   */
  add(command: Command) {
    this.#commands.set(command.command.name, command)
  }

  setGlobalPreRunHook(hook: CommandHook) {
    this.#globalPreRunHook = hook
  }

  async register() {
    const payload = this.#commands.map((c) => c.command)
    const route = Routes.applicationCommands(this.#discord.applicationId)
    await this.#discord.rest.put(route, { body: payload })

    console.log(`Registered ${this.#commands.size} (/) commands.`)
  }

  async unregisterGuildCommands() {
    if (this.#discord.client.readyAt) {
      await this._unregisterGuildCommands().catch(console.error)
    } else {
      this.#discord.client.once(Events.ClientReady, async () => {
        await this._unregisterGuildCommands().catch(console.error)
      })
    }
  }

  private async _unregisterGuildCommands() {
    let guilds
    try {
      guilds = await this.#discord.client.guilds.fetch()
    } catch (error) {
      console.error("Unable to unregister guild commands. Failed to fetch guilds.")
      throw error
    }
    for (const guild of guilds.values()) {
      const route = Routes.applicationGuildCommands(this.#discord.applicationId, guild.id)
      await this.#discord.rest.put(route, { body: [] })
      console.log(`Unregistered commands from guild: ${guild.name}`)
    }
  }

  async unregisterApplicationCommands() {
    const route = Routes.applicationCommands(this.#discord.applicationId)
    await this.#discord.rest.put(route, { body: [] })
    console.log("Unregistered application commands.")
  }

  _listen() {
    this.#discord.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return
      if (!interaction.guildId) return
      if (!interaction.inCachedGuild()) await interaction.client.guilds.fetch(interaction.guildId).catch(console.error)
      if (!interaction.inCachedGuild()) {
        this.interactionReply(interaction, "Guild is not cached. Try again.")
        return
      }

      const command = this.#commands.get(interaction.commandName)
      if (!command) {
        this.interactionReply(interaction, `Failed to get command with name: ${interaction.commandName}`)
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
        this.interactionReply(interaction, error)
      }
    })
    console.log("Listening for commands.")
  }

  private async checkRoles(command: Command, interaction: ChatInputCommandInteraction<"cached">) {
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

  private interactionReply(interaction: ChatInputCommandInteraction, error: unknown) {
    let errorMessage = ""
    if (error instanceof UserError) errorMessage = error.message
    else if (error instanceof Error && error.stack) errorMessage = error.stack
    else errorMessage = String(error)

    const message = `There was an error while running this command.\n\`\`\`${errorMessage}\`\`\``
    interaction.deferred
      ? void interaction.editReply(message).catch(console.error)
      : void interaction.reply({ content: message, ephemeral: true }).catch(console.error)
  }
}

export default CommandManager
export type { Command, CommandHook }
