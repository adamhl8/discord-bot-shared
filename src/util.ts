import { APIPartialChannel, BaseChannel, CategoryChannel, ChannelType, NonThreadGuildBasedChannel, TextChannel } from 'discord.js'
import getGuildCache from './guildCache.js'

type NonThreadGuildBasedChannelType =
  | ChannelType.GuildText
  | ChannelType.GuildVoice
  | ChannelType.GuildNews
  | ChannelType.GuildStageVoice
  | ChannelType.GuildCategory

async function getChannelByName<T extends NonThreadGuildBasedChannel>(
  channelName: string,
  channelType: NonThreadGuildBasedChannelType,
): Promise<T | undefined> {
  const { channels } = (await getGuildCache()) || throwError('Unable to get guild cache.')
  const channel = channels.find((channel) => channel.name === channelName)

  return channel && channel.type === channelType ? (channel as T) : undefined
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

export { getChannelByName, isTextChannel, isCategoryChannel, throwError }
