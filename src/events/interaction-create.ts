import { ChatInputCommandInteraction, Client } from "discord.js"
import { Command, Commands } from "../register-commands.js"

type InteractionCheck = (interaction: ChatInputCommandInteraction) => Promise<boolean | void>

function registerInteractionCreate(bot: Client, commands: Commands, interactionCheck?: InteractionCheck) {
  bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return

    const command = commands[interaction.commandName]
    if (!command) return interactionReply(interaction, "Unable to get command.")

    if (!(await checkRoles(command, interaction)))
      return interactionReply(interaction, "You do not have one of the required roles to run this command.")

    try {
      const interactionCheckPassed = interactionCheck ? await interactionCheck(interaction) : true
      if (!interactionCheckPassed) return

      await command.run(interaction)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ""
      interactionReply(interaction, `There was an error while running this command.\n${errorMessage}`)
    }
  })
}

async function checkRoles(command: Command, interaction: ChatInputCommandInteraction) {
  if (!command.requiredRoles) return true

  if (command.requiredRoles.length > 0) {
    const member = await interaction.guild?.members.fetch(interaction.user).catch(console.error)
    if (!member) return

    return member.roles.cache.some((role) => (command.requiredRoles ? command.requiredRoles.includes(role.name) : false))
  }

  return false
}

function interactionReply(interaction: ChatInputCommandInteraction, message: string) {
  interaction.deferred
    ? void interaction.editReply(message).catch(console.error)
    : void interaction.reply({ content: message, ephemeral: true }).catch(console.error)
}

export default registerInteractionCreate
export { InteractionCheck }
