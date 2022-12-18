import { APIPartialChannel, BaseChannel, CategoryChannel, ChannelType, Guild, NonThreadGuildBasedChannel, TextChannel } from "discord.js"

type NonThreadGuildBasedChannelType =
  | ChannelType.GuildText
  | ChannelType.GuildVoice
  | ChannelType.GuildNews
  | ChannelType.GuildStageVoice
  | ChannelType.GuildCategory

async function getChannel<T extends NonThreadGuildBasedChannel>(
  guild: Guild,
  channelNameOrId: string,
  channelType: NonThreadGuildBasedChannelType,
): Promise<T | undefined> {
  const channels = await guild.channels.fetch()

  let channel: NonThreadGuildBasedChannel | undefined | null
  channel = channels.find((channel) => (channel ? channel.name === channelNameOrId : false))
  if (channel) return channel.type === channelType ? (channel as T) : undefined

  channel = channels.get(channelNameOrId)
  if (channel) return channel.type === channelType ? (channel as T) : undefined
}

function isTextChannel(channel: BaseChannel | APIPartialChannel): channel is TextChannel {
  return channel.type === ChannelType.GuildText
}

function isCategoryChannel(channel: BaseChannel): channel is CategoryChannel {
  return channel.type === ChannelType.GuildCategory
}

function throwError(error: string): never {
  throw new Error(error)
}

export { getChannel, isTextChannel, isCategoryChannel, throwError }
