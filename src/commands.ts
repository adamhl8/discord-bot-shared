import { REST } from "@discordjs/rest"
import { RESTPostAPIApplicationCommandsJSONBody, Routes } from "discord-api-types/v10"
import { ChatInputCommandInteraction, Collection, SlashCommandBuilder } from "discord.js"
import { readdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"

interface CommandImport {
  default: Command
}

interface Command {
  requiredRoles?: string[]
  command: SlashCommandBuilder
  run: (interaction: ChatInputCommandInteraction) => void | Promise<void>
}

type CommandsCollection = Collection<string, Command>

async function registerCommands(botToken: string, clientId: string, projectMetaURL: string, guildId?: string) {
  const commands: CommandsCollection = new Collection()
  const commandData: RESTPostAPIApplicationCommandsJSONBody[] = []

  const commandsDirectory = fileURLToPath(new URL("commands", projectMetaURL))
  const commandFiles = await readdir(commandsDirectory)
  if (!commandFiles) return commands

  for (const file of commandFiles) {
    const { default: command } = (await import(`${commandsDirectory}/${file}`)) as CommandImport
    if (!command) continue
    commands.set(command.command.name, command)
    commandData.push(command.command.toJSON())
  }

  const rest = new REST().setToken(botToken)
  guildId
    ? await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commandData })
    : await rest.put(Routes.applicationCommands(clientId), { body: commandData })
  console.log("Registered application (/) commands.")

  return commands
}

export default registerCommands
export { Command, CommandsCollection }
