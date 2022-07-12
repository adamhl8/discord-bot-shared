import { Client, CommandInteraction } from 'discord.js'
import { CommandsCollection } from './commands.js'

type InteractionCheck = (interaction: CommandInteraction) => Promise<boolean | void>

function registerInteractionCreate(bot: Client, commands: CommandsCollection, interactionCheck?: InteractionCheck) {
  bot.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return

    const command = commands.get(interaction.commandName)
    if (!command)
      return await interaction.reply({ content: 'Unable to get command.', ephemeral: true }).catch(console.error)

    if (command.requiredRoles && command.requiredRoles.length > 0) {
      const member = await interaction.guild?.members.fetch(interaction.user).catch(console.error)
      if (!member) return
      if (
        !member.roles.cache.some((role) => (command.requiredRoles ? command.requiredRoles.includes(role.name) : false))
      )
        return await interaction
          .reply({ content: 'You do not have the required role(s) to run this command.', ephemeral: true })
          .catch(console.error)
    }

    const interactionCheckPassed = interactionCheck ? await interactionCheck(interaction) : true
    if (!interactionCheckPassed) return

    try {
      await command.run(interaction)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ''
      await interaction
        .reply({ content: `There was an error while running this command.\n${errorMessage}`, ephemeral: true })
        .catch(console.error)
    }
  })
}

export default registerInteractionCreate
export { InteractionCheck }
