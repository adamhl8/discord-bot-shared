import type {
  CategoryChannel,
  ChannelType,
  ForumChannel,
  Guild,
  NewsChannel,
  NonThreadGuildBasedChannel,
  StageChannel,
  TextChannel,
  VoiceChannel,
} from "discord.js"

interface ChannelTypeToChannelMap {
  [ChannelType.GuildCategory]: CategoryChannel
  [ChannelType.GuildAnnouncement]: NewsChannel
  [ChannelType.GuildStageVoice]: StageChannel
  [ChannelType.GuildText]: TextChannel
  [ChannelType.GuildVoice]: VoiceChannel
  [ChannelType.GuildForum]: ForumChannel
}

/**
 * Returns the guild channel of the given name/ID and type, otherwise throws.
 *
 * @param guild The Guild to fetch the channel from
 * @param channelNameOrId The name or ID of the channel to fetch
 * @param channelType The type of channel to fetch
 * @returns The channel of the given name/ID and type
 * @example
 * ```ts
 * import { getChannel } from "discord-bot-shared"
 * import { ChannelType } from "discord.js"
 *
 * // guild is of type Guild from discord.js
 * const someTextChannel = await getChannel(guild, "some-text-channel", ChannelType.GuildText)
 * ```
 *
 * Getting a properly typed channel with discord.js can be a bit of a pain, so this is an alternative.
 */
export async function getChannel<T extends keyof ChannelTypeToChannelMap>(
  guild: Guild,
  channelNameOrId: string,
  channelType: T,
): Promise<ChannelTypeToChannelMap[T]> {
  const channels = await guild.channels.fetch()

  let channel: NonThreadGuildBasedChannel | undefined | null
  channel = channels.find((chan) => (chan ? chan.name === channelNameOrId : false))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  if (channel && channel.type === channelType) return channel as ChannelTypeToChannelMap[T]

  channel = channels.get(channelNameOrId)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  if (channel && channel.type === channelType) return channel as ChannelTypeToChannelMap[T]

  throwError(`Failed to get channel: ${channelNameOrId}`)
}

/**
 * Throws an error with the given message.
 *
 * @param message The message to throw
 * @throws Error
 */
export function throwError(message: string): never {
  throw new Error(message)
}

/**
 * Throws a UserError with the given message.
 *
 * @param message The message to throw
 * @throws UserError
 */
export function throwUserError(message: string): never {
  throw new UserError(message)
}

export class UserError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = "UserError"

    Object.setPrototypeOf(this, new.target.prototype)
  }
}
