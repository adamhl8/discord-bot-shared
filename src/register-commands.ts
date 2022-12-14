import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v10"
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js"

interface Command {
  requiredRoles?: string[]
  command: SlashCommandBuilder
  run: (interaction: ChatInputCommandInteraction) => void | Promise<void>
}

interface Commands {
  [name: string]: Command
}

async function registerCommands(botToken: string, clientId: string, commands: Commands) {
  const commandData = Object.values(commands).map((command) => command.command.toJSON())

  const rest = new REST().setToken(botToken)
  await rest.put(Routes.applicationCommands(clientId), { body: commandData })
  console.log("Registered (/) commands.")
}

export default registerCommands
export { Command, Commands }
