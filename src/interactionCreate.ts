import { ChatInputCommandInteraction, Client } from 'discord.js'
import { Command, CommandsCollection } from './commands.js'

type InteractionCheck = (interaction: ChatInputCommandInteraction) => Promise<boolean | void>

function registerInteractionCreate(bot: Client, commands: CommandsCollection, interactionCheck?: InteractionCheck) {
  bot.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return

    const command = commands.get(interaction.commandName)
    if (!command)
      return void interaction.reply({ content: 'Unable to get command.', ephemeral: true }).catch(console.error)

    if (!(await checkRoles(command, interaction)))
      return void interaction
        .reply({ content: 'You do not have one of the required roles to run this command.', ephemeral: true })
        .catch(console.error)

    try {
      const interactionCheckPassed = interactionCheck ? await interactionCheck(interaction) : true
      if (!interactionCheckPassed) return

      await command.run(interaction)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ''
      await interaction
        .reply({ content: `There was an error while running this command.\n${errorMessage}`, ephemeral: true })
        .catch(console.error)
    }
  })
}

async function checkRoles(command: Command, interaction: ChatInputCommandInteraction) {
  if (command.requiredRoles && command.requiredRoles.length > 0) {
    const member = await interaction.guild?.members.fetch(interaction.user).catch(console.error)
    if (!member) return

    return member.roles.cache.some((role) =>
      command.requiredRoles ? command.requiredRoles.includes(role.name) : false,
    )
  }

  return false
}

export default registerInteractionCreate
export { InteractionCheck }
