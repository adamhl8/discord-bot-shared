import { ChatInputCommandInteraction } from "discord.js"
import { throwError } from "./util.js"

type NoNullProperties<T> = {
  [P in keyof T]: P extends "ephemeral" ? T[P] : Exclude<T[P], null | undefined>
}

export type NonNullChatInputCommandInteraction = NoNullProperties<ChatInputCommandInteraction<"cached">>

function assertPropertyNotNull<T, K extends keyof T>(
  obj: T,
  prop: K,
  errorMessage: string,
): asserts obj is T & Record<K, NonNullable<T[K]>> {
  if (!obj[prop]) {
    throwError(errorMessage)
  }
}

async function fetchInteraction(interaction: ChatInputCommandInteraction): Promise<NonNullChatInputCommandInteraction> {
  if (!interaction.guildId) throwError("Failed to fetch interaction: guildId is null")
  if (!interaction.inCachedGuild()) await interaction.client.guilds.fetch(interaction.guildId)
  if (!interaction.inCachedGuild()) throwError("Failed to fetch interaction: guild is not cached")

  if (!interaction.command) await interaction.guild.commands.fetch(interaction.commandId)
  assertPropertyNotNull(interaction, "command", "Failed to fetch interaction: command is null")
  assertPropertyNotNull(interaction, "commandGuildId", "Failed to fetch interaction: commandGuildId is null")

  if (!interaction.channel) await interaction.guild.channels.fetch(interaction.channelId)
  assertPropertyNotNull(interaction, "channel", "Failed to fetch interaction: channel is null")

  return interaction
}

export default fetchInteraction
