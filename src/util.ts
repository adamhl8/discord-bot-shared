import { APIPartialChannel, BaseChannel, CategoryChannel, ChannelType, TextChannel } from 'discord.js'

function isTextChannel(channel: BaseChannel | APIPartialChannel): channel is TextChannel {
  return channel.type === ChannelType.GuildText
}

function isCategoryChannel(channel: BaseChannel): channel is CategoryChannel {
  return channel.type === ChannelType.GuildCategory
}

function throwError(error: string): never {
  throw new Error(error)
}

export { isTextChannel, isCategoryChannel, throwError }
