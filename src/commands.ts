import { SlashCommandBuilder } from '@discordjs/builders'
import { REST } from '@discordjs/rest'
import { RESTPostAPIApplicationCommandsJSONBody, Routes } from 'discord-api-types/v10'
import { Collection, CommandInteraction } from 'discord.js'
import { readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

interface CommandImport {
  default: Command
}

interface Command {
  requiredRoles?: string[]
  command: SlashCommandBuilder
  run: (interaction: CommandInteraction) => void | Promise<void>
}

type CommandsCollection = Collection<string, Command>

async function registerCommands(botToken: string, clientId: string, projectMetaURL: string, guildId?: string) {
  const commands: CommandsCollection = new Collection()
  const commandData: RESTPostAPIApplicationCommandsJSONBody[] = []

  const commandsDirectory = fileURLToPath(new URL('commands', projectMetaURL))
  const commandFiles = await readdir(commandsDirectory).catch(console.error)
  if (!commandFiles) return commands

  for (const file of commandFiles) {
    const { default: command } = (await import(`${commandsDirectory}/${file}`)) as CommandImport
    commands.set(command.command.name, command)
    commandData.push(command.command.toJSON())
  }

  const rest = new REST().setToken(botToken)
  if (guildId)
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commandData }).catch(console.error)
  else rest.put(Routes.applicationCommands(clientId), { body: commandData }).catch(console.error)
  console.log('Registered application (/) commands.')

  return commands
}

export default registerCommands
export { Command, CommandsCollection }
