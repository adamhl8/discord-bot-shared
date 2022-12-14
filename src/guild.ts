import { ChannelType, Guild as djsGuild, NonThreadGuildBasedChannel } from "discord.js"

type NonThreadGuildBasedChannelType =
  | ChannelType.GuildText
  | ChannelType.GuildVoice
  | ChannelType.GuildNews
  | ChannelType.GuildStageVoice
  | ChannelType.GuildCategory

class Guild {
  readonly id: string
  readonly guild: djsGuild

  constructor(id: string, guild: djsGuild) {
    this.id = id
    this.guild = guild
  }

  get members() {
    return this.guild.members.fetch()
  }

  get channels() {
    return this.guild.channels.fetch()
  }

  get roles() {
    return this.guild.roles.fetch()
  }

  get emojis() {
    return this.guild.emojis.fetch()
  }

  async getChannel<T extends NonThreadGuildBasedChannel>(
    channelNameOrId: string,
    channelType: NonThreadGuildBasedChannelType,
  ): Promise<T | undefined> {
    const channels = await this.channels

    let channel: NonThreadGuildBasedChannel | undefined | null
    channel = channels.find((channel) => (channel ? channel.name === channelNameOrId : false))
    if (channel) return channel.type === channelType ? (channel as T) : undefined

    channel = channels.get(channelNameOrId)
    if (channel) return channel.type === channelType ? (channel as T) : undefined
  }
}

export default Guild
