import { ChannelType, NonThreadGuildBasedChannel } from 'discord.js'
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

function throwError(error: string): never {
  throw new Error(error)
}

export { getChannelByName, throwError }
