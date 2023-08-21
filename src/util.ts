import {
  APIPartialChannel,
  BaseChannel,
  CategoryChannel,
  ChannelType,
  Guild,
  NonThreadGuildBasedChannel,
  TextChannel,
} from "discord.js"

type NonThreadGuildBasedChannelType =
  | ChannelType.GuildText
  | ChannelType.GuildVoice
  | ChannelType.GuildAnnouncement
  | ChannelType.GuildStageVoice
  | ChannelType.GuildCategory

async function getChannel<T extends NonThreadGuildBasedChannel>(
  guild: Guild,
  channelNameOrId: string,
  channelType: NonThreadGuildBasedChannelType,
) {
  const channels = await guild.channels.fetch()

  let channel: NonThreadGuildBasedChannel | undefined | null
  channel = channels.find((channel) => (channel ? channel.name === channelNameOrId : false))
  if (channel && channel.type === channelType) return channel as T

  channel = channels.get(channelNameOrId)
  if (channel && channel.type === channelType) return channel as T

  throw new Error(`Unable to get channel: ${channelNameOrId}`)
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

export { getChannel, isCategoryChannel, isTextChannel, throwError }
