import { Client } from 'discord.js'

let bot: Client

function setBot(botClient: Client) {
  bot = botClient
}

async function getGuildCache() {
  if (!bot) return

  const guilds = await bot.guilds.fetch()
  if (!guilds) return
  const guild = await guilds.first()?.fetch()
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
