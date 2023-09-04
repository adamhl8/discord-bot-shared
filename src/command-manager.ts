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

  async _register() {
    const payload = this.#commands.map((c) => c.command)
    const route = Routes.applicationCommands(this.#discord.applicationId)
    await this.#discord.rest.put(route, { body: payload })

    console.log(`Registered ${this.#commands.size} (/) commands.`)
  }

  _listen() {
    this.#discord.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return
      if (!interaction.guildId) return
      if (!interaction.inCachedGuild()) await interaction.client.guilds.fetch(interaction.guildId)
      if (!interaction.inCachedGuild()) {
        this.interactionErrorReply(interaction, "Guild is not cached. Try again.")
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
        this.interactionErrorReply(interaction, error)
      }
    })
  }

  private async checkRoles(command: Command, interaction: ChatInputCommandInteraction<"cached">) {
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

  private interactionReply(interaction: ChatInputCommandInteraction, message: string) {
    interaction.deferred
      ? void interaction.editReply(message).catch(console.error)
      : void interaction.reply({ content: message, ephemeral: true }).catch(console.error)
  }

  private interactionErrorReply(interaction: ChatInputCommandInteraction, error: unknown) {
    let errorBlock = ""
    if (error instanceof UserError) errorBlock = `\n\`\`\`${error.message}\`\`\``
    else if (error instanceof Error) errorBlock = `\n\`\`\`${error.stack}\`\`\``
    this.interactionReply(interaction, `There was an error while running this command.${errorBlock}`)
  }
}

export default CommandManager
export type { Command, CommandHook }
