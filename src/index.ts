import { Client, ClientOptions, Collection } from "discord.js"
import registerInteractionCreate, { InteractionCheck } from "./events/interaction-create.js"
import registerReady from "./events/ready.js"
import Guild from "./guild.js"
import registerCommands, { Commands } from "./register-commands.js"
import registerEvents, { Events } from "./register-events.js"

const botToken = process.env.BOT_TOKEN || ""
const clientId = process.env.CLIENT_ID || ""

async function login(botIntents: ClientOptions, commands: Commands, events: Events, interactionCheck?: InteractionCheck) {
  console.log("Logging in...")

  const bot = new Client(botIntents)
  await registerCommands(botToken, clientId, commands)
  registerEvents(bot, events)

  // Register default/built-in events
  registerReady(bot)
  registerInteractionCreate(bot, commands, interactionCheck)

  await bot.login(botToken)
  console.log("Logged in.")

  const partialGuilds = await bot.guilds.fetch()
  const guildPromises = partialGuilds.map((guildPartial) => guildPartial.fetch())
  const guilds = await Promise.all(guildPromises)
  const GuildCollection = new Collection<string, Guild>()
  for (const guild of guilds) GuildCollection.set(guild.id, new Guild(guild.id, guild))

  return { GuildCollection, bot }
}

export default login
export { InteractionCheck } from "./events/interaction-create.js"
export { Command } from "./register-commands.js"
export { isCategoryChannel, isTextChannel, throwError } from "./util.js"
