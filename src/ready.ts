import { Client } from 'discord.js'

function registerReady(bot: Client) {
  bot.once('ready', () => {
    console.log('I am ready!')
  })
}

export default registerReady
