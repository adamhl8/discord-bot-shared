import { Client } from "discord.js"

function registerReady(bot: Client) {
  bot.once("ready", () => {
    console.log("Client is ready.")
  })
}

export default registerReady
