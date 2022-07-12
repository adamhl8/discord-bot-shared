import { Client, Guild } from 'discord.js'

let bot: Client

function setBot(botClient: Client) {
  bot = botClient
}

async function getGuildCache(baseGuild?: Guild) {
  if (!bot) return

  const guilds = await bot.guilds.fetch().catch(console.error)
  if (!guilds) return
  const guild = baseGuild
    ? await baseGuild.fetch().catch(console.error)
    : await guilds.first()?.fetch().catch(console.error)
  if (!guild) return

  const channels = await guild.channels.fetch().catch(console.error)
  if (!channels) return

  const emojis = await guild.emojis.fetch().catch(console.error)
  if (!emojis) return

  const members = await guild.members.fetch().catch(console.error)
  if (!members) return

  const roles = await guild.roles.fetch().catch(console.error)
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
