import {
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

async function getChannel<T extends keyof ChannelTypeToChannelMap>(
  guild: Guild,
  channelNameOrId: string,
  channelType: T,
) {
  const channels = await guild.channels.fetch()

  let channel: NonThreadGuildBasedChannel | undefined | null
  channel = channels.find((channel) => (channel ? channel.name === channelNameOrId : false))
  if (channel && channel.type === channelType) return channel as ChannelTypeToChannelMap[T]

  channel = channels.get(channelNameOrId)
  if (channel && channel.type === channelType) return channel as ChannelTypeToChannelMap[T]

  throwError(`Failed to get channel: ${channelNameOrId}`)
}

function throwError(message: string): never {
  throw new Error(message)
}

function throwUserError(message: string): never {
  throw new UserError(message)
}

class UserError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name

    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export { UserError, getChannel, throwError, throwUserError }
