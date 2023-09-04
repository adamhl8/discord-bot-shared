import { ChatInputCommandInteraction } from "discord.js"
import { NoNullProperties, assertPropertyNotNull } from "./type-utils.js"

type NonNullChatInputCommandInteraction = NoNullProperties<
  ChatInputCommandInteraction<"cached">,
  "ephemeral" | "command" | "commandGuildId"
>

async function fetchInteraction(interaction: ChatInputCommandInteraction): Promise<NonNullChatInputCommandInteraction> {
  if (!interaction.guildId) throw new FetchInteractionError("guildId is null")
  if (!interaction.inCachedGuild()) await interaction.client.guilds.fetch(interaction.guildId)
  if (!interaction.inCachedGuild()) throw new FetchInteractionError("guild is not cached")

  if (!interaction.channel) await interaction.guild.channels.fetch(interaction.channelId)
  assertPropertyNotNull(interaction, "channel", new FetchInteractionError("channel is null"))

  return interaction
}

class FetchInteractionError extends Error {
  constructor(message: string) {
    super(`Failed to fetch interaction: ${message}`)
    this.name = this.constructor.name

    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export default fetchInteraction
export type { NonNullChatInputCommandInteraction }
