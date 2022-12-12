import { Client, GuildResolvable } from "discord.js"

let bot: Client

function setBot(botClient: Client) {
  bot = botClient
}

async function getGuildCache(guildResolvable: GuildResolvable) {
  if (!bot) return

  const guild = await bot.guilds.fetch({ guild: guildResolvable })
  if (!guild) return

  const channels = await guild.channels.fetch()
  if (!channels) return

  const emojis = await guild.emojis.fetch()
  if (!emojis) return

  const members = await guild.members.fetch()
  if (!members) return

  const roles = await guild.roles.fetch()
  if (!roles) return

  return {
    guild,
    channels,
    emojis,
    members,
    roles,
  }
}

export default getGuildCache
export { setBot }
