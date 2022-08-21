import { Client, ClientOptions } from 'discord.js'
import registerCommands from './commands.js'
import registerEvents from './events.js'
import { setBot } from './guildCache.js'
import registerInteractionCreate, { InteractionCheck } from './interactionCreate.js'
import registerReady from './ready.js'

const botToken = process.env.BOT_TOKEN || ''
const clientId = process.env.CLIENT_ID || ''
const guildId = process.env.GUILD_ID || ''

async function login(botIntents: ClientOptions, projectMetaURL: string, interactionCheck?: InteractionCheck): Promise<Client> {
  const bot = new Client(botIntents)
  const commands = await registerCommands(botToken, clientId, projectMetaURL, guildId)

  registerReady(bot)
  registerInteractionCreate(bot, commands, interactionCheck)
  void registerEvents(projectMetaURL)

  setBot(bot)

  void bot.login(botToken)
  return bot
}

export default login
export { Command } from './commands.js'
export { default as getGuildCache } from './guildCache.js'
export { InteractionCheck } from './interactionCreate.js'
export { getChannelByName, throwError } from './util.js'
