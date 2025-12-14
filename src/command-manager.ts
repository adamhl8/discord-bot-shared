import type {
  ChatInputCommandInteraction,
  Interaction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js"
import { Collection, Events, MessageFlags, Routes } from "discord.js"
import type { Result } from "ts-explicit-errors"
import { attempt, CtxError, err, filterMap, isErr } from "ts-explicit-errors"

import type { DiscordContext } from "~/bot.ts"
import { components } from "~/components.ts"
import { handleCallback } from "~/util.ts"

export type CommandRunFn = (interaction: ChatInputCommandInteraction<"cached">) => void | Promise<void>

export interface Command {
  requiredRoles?: string[]
  command: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder
  run: CommandRunFn
}

interface CommandHookResult {
  success: boolean
  message?: string
}
export type CommandHook = (
  interaction: ChatInputCommandInteraction<"cached">,
) => CommandHookResult | Promise<CommandHookResult>

export class CommandManager {
  readonly #commands = new Collection<string, Command>()
  #globalCommandHook?: CommandHook
  readonly #discord: DiscordContext

  public constructor(discord: DiscordContext) {
    this.#discord = discord
  }

  private getCommandPayload() {
    return this.#commands.map((c) => c.command.toJSON())
  }

  private async onReady(fn: () => Result | Promise<Result>) {
    if (this.#discord.client.isReady()) await handleCallback(fn)
    else this.#discord.client.once(Events.ClientReady, async () => await handleCallback(fn))
  }

  /*
   * Add a command
   */
  public add(command: Command): void {
    this.#commands.set(command.command.name, command)
  }

  public setGlobalCommandHook(commandHook: CommandHook): void {
    this.#globalCommandHook = commandHook
  }

  public async register(): Promise<void> {
    const registerResult = await attempt(async () => {
      const route = Routes.applicationCommands(this.#discord.applicationId)
      await this.#discord.rest.put(route, { body: this.getCommandPayload() })

      console.log(`Globally registered ${this.#commands.size.toString()} (/) commands.`)
    })

    if (isErr(registerResult)) console.error(`failed to register global commands: ${registerResult.messageChain}`)
  }

  public async unregister(): Promise<void> {
    const unregisterResult = await attempt(async () => {
      const route = Routes.applicationCommands(this.#discord.applicationId)
      await this.#discord.rest.put(route, { body: [] })

      console.log("Unregistered global commands.")
    })

    if (isErr(unregisterResult)) console.error(`failed to unregister global commands: ${unregisterResult.messageChain}`)
  }

  public async guildRegister() {
    const registerGuildCommands = async (): Promise<Result> => {
      const guilds = await attempt(() => this.#discord.client.guilds.fetch())
      if (isErr(guilds)) return err("failed to fetch guilds", guilds)

      const commandPayload = this.getCommandPayload()

      const { errors } = await filterMap(guilds.values(), async (guild) => {
        const registerResult = await attempt(async () => {
          const route = Routes.applicationGuildCommands(this.#discord.applicationId, guild.id)
          await this.#discord.rest.put(route, { body: commandPayload })
          console.log(`Registered ${this.#commands.size.toString()} (/) commands in guild '${guild.name}'`)
        })

        if (isErr(registerResult))
          return err(`failed to register guild commands in guild '${guild.name}'`, registerResult)

        return
      })

      if (errors)
        return err(
          `failed to register guild commands in all guilds:\n${errors.map((error) => error.message).join("\n")}`,
          undefined,
        )
    }

    await this.onReady(async (): Promise<Result> => {
      const registerGuildCommandsResult = await registerGuildCommands()
      if (isErr(registerGuildCommandsResult))
        return err("failed to register guild commands", registerGuildCommandsResult)
    })
  }

  public async guildUnregister(): Promise<void> {
    const unregisterGuildCommands = async (): Promise<Result> => {
      const guilds = await attempt(() => this.#discord.client.guilds.fetch())
      if (isErr(guilds)) return err("failed to fetch guilds", guilds)

      const { errors } = await filterMap(guilds.values(), async (guild) => {
        const registerResult = await attempt(async () => {
          const route = Routes.applicationGuildCommands(this.#discord.applicationId, guild.id)
          await this.#discord.rest.put(route, { body: [] })
          console.log(`Unregistered commands in guild '${guild.name}'`)
        })

        if (isErr(registerResult))
          return err(`failed to unregister guild commands in guild '${guild.name}'`, registerResult)

        return
      })

      if (errors)
        return err(
          `failed to unregister guild commands in all guilds:\n${errors.map((error) => error.message).join("\n")}`,
          undefined,
        )
    }

    await this.onReady(async (): Promise<Result> => {
      const unregisterGuildCommandsResult = await unregisterGuildCommands()
      if (isErr(unregisterGuildCommandsResult))
        return err("failed to unregister guild commands", unregisterGuildCommandsResult)
    })
  }

  public _listen(): void {
    const handleInteraction = async (interaction: Interaction): Promise<Result> => {
      if (!interaction.isChatInputCommand()) return
      if (!interaction.guildId) return

      const guild = await interaction.client.guilds.fetch(interaction.guildId)
      if (isErr(guild))
        return await CommandManager.interactionErrorReply(
          interaction,
          err(`failed to fetch guild with id '${interaction.guildId}'`, guild),
        )

      if (!interaction.inCachedGuild())
        return await CommandManager.interactionErrorReply(interaction, "Guild is not cached. Try again.")

      const command = this.#commands.get(interaction.commandName)
      if (!command)
        return await CommandManager.interactionErrorReply(
          interaction,
          err(`failed to get command with name '${interaction.commandName}'`, undefined),
        )

      const hasRequiredRole = await CommandManager.checkRoles(command, interaction)
      if (isErr(hasRequiredRole))
        return await CommandManager.interactionErrorReply(interaction, err("failed to check roles", hasRequiredRole))

      if (!hasRequiredRole)
        return await CommandManager.interactionErrorReply(
          interaction,
          "You do not have one of the required roles to run this command.",
          "warn",
        )

      const globalCommandHookResult = await attempt(() =>
        this.#globalCommandHook ? this.#globalCommandHook(interaction) : { success: true },
      )
      if (isErr(globalCommandHookResult))
        return await CommandManager.interactionErrorReply(
          interaction,
          err("failed to run global command hook", globalCommandHookResult),
        )

      const {
        success: shouldContinue,
        message: globalCommandHookMessage = "The global command hook did not succeed.",
      } = globalCommandHookResult
      if (!shouldContinue)
        return await CommandManager.interactionErrorReply(interaction, globalCommandHookMessage, "warn")

      const commandRunResult = await attempt(() => command.run(interaction))
      if (isErr(commandRunResult))
        return await CommandManager.interactionErrorReply(
          interaction,
          err(`failed to run command \`${command.command.name}\``, commandRunResult),
        )
    }

    this.#discord.client.on(
      Events.InteractionCreate,
      async (interaction) => await handleCallback(() => handleInteraction(interaction)),
    )

    console.log("Listening for commands.")
  }

  private static async checkRoles({ requiredRoles }: Command, interaction: ChatInputCommandInteraction<"cached">) {
    if (!requiredRoles) return true

    if (requiredRoles.length > 0) {
      const member = await attempt(() => interaction.guild.members.fetch(interaction.user))
      if (isErr(member)) return err(`failed to fetch member '${interaction.user.id}'`, member)

      return member.roles.cache.some((role) => requiredRoles.includes(role.name))
    }

    return false
  }

  private static async interactionErrorReply(
    interaction: ChatInputCommandInteraction,
    error: string | CtxError,
    type: keyof typeof components = "error",
  ): Promise<Result> {
    const errorMessage = error instanceof CtxError ? error.messageChain : error
    const errorComponent = components[type](errorMessage)

    const reply = await attempt(async () =>
      interaction.deferred
        ? interaction.editReply(errorComponent)
        : interaction.reply({
            components: errorComponent.components,
            flags: [...errorComponent.flags, MessageFlags.Ephemeral],
          }),
    )

    if (isErr(reply)) return err(`failed to reply to interaction from command '${interaction.commandName}'`, reply)
  }
}
